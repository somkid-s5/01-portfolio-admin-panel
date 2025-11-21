"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { TriangleAlertIcon } from "lucide-react"

import { RichProjectEditor } from "@/components/project-editor"
import { ProjectBlogPreview } from "@/components/project-preview"

type DocStatus = "draft" | "published" | "archived"

type DocSectionRow = {
  id: string
  name: string
  slug: string
}

type DocPageRow = {
  id: string
  section_id: string
  title: string
  slug: string
  excerpt: string | null
  status: DocStatus
  content_json: any | null
}

type TempImage = {
  id: string
  file: File
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export default function EditDocPage() {
  const router = useRouter()
  const params = useParams()
  const docId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sections, setSections] = useState<DocSectionRow[]>([])

  const [sectionId, setSectionId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [status, setStatus] = useState<DocStatus>("draft")
  const [contentJson, setContentJson] = useState<any | null>(null)
  const [tempImages, setTempImages] = useState<TempImage[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      // โหลด sections + doc page พร้อมกัน
      const [secRes, docRes] = await Promise.all([
        supabase
          .from("doc_sections")
          .select("id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase
          .from("doc_pages")
          .select("id, section_id, title, slug, excerpt, status, content_json")
          .eq("id", docId)
          .maybeSingle(),
      ])

      if (secRes.error) {
        setError(secRes.error.message)
        setLoading(false)
        return
      }
      if (docRes.error) {
        setError(docRes.error.message)
        setLoading(false)
        return
      }
      if (!docRes.data) {
        setError("Docs page not found.")
        setLoading(false)
        return
      }

      setSections(secRes.data as DocSectionRow[])

      const row = docRes.data as DocPageRow
      setSectionId(row.section_id)
      setTitle(row.title)
      setSlug(row.slug)
      setExcerpt(row.excerpt ?? "")
      setStatus(row.status)
      setContentJson(row.content_json ?? null)

      setLoading(false)
    }

    if (docId) {
      load()
    }
  }, [docId])

  async function uploadTempImagesAndPatchContent(
    rawContent: any,
    images: TempImage[],
    slugForName: string
  ): Promise<any> {
    if (!rawContent || images.length === 0) return rawContent

    const findFile = (id: string) => images.find((img) => img.id === id)?.file

    async function walk(node: any): Promise<any> {
      if (!node) return node
      const newNode = { ...node }

      // image ที่ยังเป็น temp (มี data-temp-id)
      if (
        newNode.type === "image" &&
        newNode.attrs &&
        newNode.attrs["data-temp-id"]
      ) {
        const tempId = newNode.attrs["data-temp-id"] as string
        const file = findFile(tempId)

        if (file) {
          const ext = file.name.split(".").pop() || "png"
          const fileName = `${slugForName}-${tempId}.${ext}`

          // 🟢 ใช้ bucket เดียวกับหน้า /admin/docs/new
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("doc-images") // ถ้าใช้ชื่ออื่น ปรับตรงนี้ให้ตรง
            .upload(fileName, file, { upsert: true })

          if (uploadError) {
            throw new Error(uploadError.message)
          }

          const { data: publicUrlData } = supabase.storage
            .from("doc-images")
            .getPublicUrl(uploadData.path)

          newNode.attrs = {
            ...newNode.attrs,
            src: publicUrlData.publicUrl,
          }
          delete newNode.attrs["data-temp-id"]
        }
      }

      if (Array.isArray(newNode.content)) {
        newNode.content = await Promise.all(newNode.content.map(walk))
      }

      return newNode
    }

    return await walk(rawContent)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      if (!sectionId) {
        setError("Please select a section for this docs page.")
        setSaving(false)
        return
      }

      const slugForName = (slug || slugify(title) || "doc").toLowerCase()

      // 1) upload inline images ใหม่ (ถ้ามี) และ patch content_json
      let finalContent = contentJson
      try {
        finalContent = await uploadTempImagesAndPatchContent(
          contentJson,
          tempImages,
          slugForName
        )
      } catch (err: any) {
        setError("Upload inline images failed: " + err.message)
        setSaving(false)
        return
      }

      // 2) update row
      const { error: updateErr } = await supabase
        .from("doc_pages")
        .update({
          section_id: sectionId,
          title,
          slug: slugForName,
          excerpt: excerpt || null,
          status,
          content_json: finalContent ?? null,
        })
        .eq("id", docId)

      if (updateErr) {
        setError(updateErr.message)
        setSaving(false)
        return
      }

      router.push("/admin/docs")
    } catch (err: any) {
      setError(err.message ?? "Unknown error")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-6 w-40 bg-muted animate-pulse rounded-md" />
        <Card className="bg-card/90 border border-border/60">
          <CardContent className="py-10 text-sm text-muted-foreground">
            Loading docs page…
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Documentation Page
          </h1>
          <p className="text-sm text-muted-foreground">
            Update metadata and rich content for this docs page.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/docs")}
        >
          Back to docs
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* ซ้าย: ฟอร์ม */}
        <Card className="bg-card/90 border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Doc details</CardTitle>
            <CardDescription>
              Change section, status, slug and full article content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <Alert className="mb-2 bg-destructive/10 text-destructive border-none">
                  <TriangleAlertIcon className="h-4 w-4" />
                  <AlertTitle>Failed to update docs page</AlertTitle>
                  <AlertDescription className="text-destructive/80">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Section + Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Section</Label>
                  <Select
                    value={sectionId}
                    onValueChange={(value) => setSectionId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Defines where this page appears in the left docs sidebar.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as DocStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title + Slug */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => setSlug(slugify(title))}
                    >
                      Auto
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Used for URLs. Final URL will be /docs/&lt;section&gt;/&lt;slug&gt;.
                  </p>
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Short summary for previews, search, or cards.
                </p>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <Label>Content</Label>
                <p className="text-[11px] text-muted-foreground">
                  Full docs content. Existing images will stay as-is; new images from your device are uploaded on save.
                </p>
                <RichProjectEditor
                  initialContent={contentJson}
                  onChange={(doc) => setContentJson(doc)}
                  onAddTempImage={(tempId, file) =>
                    setTempImages((prev) => [...prev, { id: tempId, file }])
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/docs")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ขวา: Live preview */}
        <ProjectBlogPreview
          title={title || "Untitled docs page"}
          excerpt={excerpt}
          status={status as any}
          techStack={""}
          coverImageUrl={null}
          contentJson={contentJson}
        />
      </div>
    </div>
  )
}
