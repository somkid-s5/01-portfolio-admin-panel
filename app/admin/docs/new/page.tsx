"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { ProjectBlogPreview } from "@/components/project-preview" // ใช้ตัวเดียวกับ Projects preview ได้เลย

type DocStatus = "draft" | "published" | "archived"

type DocSectionRow = {
  id: string
  name: string
  slug: string
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

export default function NewDocPage() {
  const router = useRouter()

  const [loadingSections, setLoadingSections] = useState(true)
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

  // โหลด section มาให้เลือก
  useEffect(() => {
    const loadSections = async () => {
      setLoadingSections(true)
      setError(null)

      const { data, error } = await supabase
        .from("doc_sections")
        .select("id, name, slug")
        .order("sort_order", { ascending: true })

      if (error) {
        setError(error.message)
        setLoadingSections(false)
        return
      }

      setSections(data as DocSectionRow[])
      setLoadingSections(false)
    }

    loadSections()
  }, [])

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

          // 🟢 เปลี่ยน bucket ตามที่คุณใช้จริง
          // ถ้าอยาก reuse bucket เดิมของ Projects ให้เปลี่ยน "doc-images" เป็น "project-images"
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("doc-images")
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
        setError("Please select a section for this doc page.")
        setSaving(false)
        return
      }

      const slugForName = (slug || slugify(title) || "doc").toLowerCase()

      // 1) upload inline images (ถ้ามี) และ patch content_json
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

      // 2) หาค่า sort_order ล่าสุดใน section นี้ แล้วบวก 10 ต่อท้าย
      let sortOrder = 10
      const { data: maxRow, error: maxErr } = await supabase
        .from("doc_pages")
        .select("sort_order")
        .eq("section_id", sectionId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!maxErr && maxRow && typeof maxRow.sort_order === "number") {
        sortOrder = maxRow.sort_order + 10
      }

      // 3) insert row ใหม่
      const { error: insertErr } = await supabase.from("doc_pages").insert({
        section_id: sectionId,
        title,
        slug: slugForName,
        excerpt: excerpt || null,
        status,
        content_json: finalContent ?? null,
        sort_order: sortOrder,
      })

      if (insertErr) {
        setError(insertErr.message)
        setSaving(false)
        return
      }

      router.push("/admin/docs")
    } catch (err: any) {
      setError(err.message ?? "Unknown error")
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Documentation Page
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new docs page for your public documentation site.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* ซ้าย: ฟอร์ม */}
        <Card className="bg-card/90 border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Doc details</CardTitle>
            <CardDescription>
              Basic metadata and full rich content for this docs page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <Alert className="mb-2 bg-destructive/10 text-destructive border-none">
                  <TriangleAlertIcon className="h-4 w-4" />
                  <AlertTitle>Failed to create docs page</AlertTitle>
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
                    disabled={loadingSections}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingSections
                            ? "Loading sections..."
                            : "Select section"
                        }
                      />
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
                    Choose where this page will appear in the left docs sidebar.
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
                    placeholder="e.g. Basic OSPF Overview"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (!slug) {
                        setSlug(slugify(e.target.value))
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      placeholder="basic-ospf-overview"
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
                  placeholder="Short summary for this docs page…"
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Used in search results, previews, or cards.
                </p>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <Label>Content</Label>
                <p className="text-[11px] text-muted-foreground">
                  Full docs content. You can use headings, lists, code blocks, and images from your device (uploaded on save).
                </p>
                <RichProjectEditor
                  initialContent={null}
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
                  {saving ? "Creating…" : "Create docs page"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ขวา: Live preview ใช้ component เดิมของ Project */}
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
