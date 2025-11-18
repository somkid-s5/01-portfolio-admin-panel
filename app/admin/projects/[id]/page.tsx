"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

import {
  Card,
  CardHeader,
  CardTitle,
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
import { ProjectBlogPreview } from "@/components/project-preview" // ถ้าไฟล์ชื่อไม่ตรง ปรับ path ตามจริง

type ProjectStatus = "draft" | "in_progress" | "done" | "archived"

type ProjectRow = {
  id: string
  title: string
  slug: string
  description: string | null
  excerpt: string | null
  status: ProjectStatus
  tech_stack: string[] | null
  cover_image_url: string | null
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

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("draft")
  const [techStack, setTechStack] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [contentJson, setContentJson] = useState<any | null>(null)
  const [tempImages, setTempImages] = useState<TempImage[]>([])

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, title, slug, description, excerpt, status, tech_stack, cover_image_url, content_json"
        )
        .eq("id", projectId)
        .maybeSingle()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data) {
        setError("Project not found.")
        setLoading(false)
        return
      }

      const row = data as ProjectRow

      setTitle(row.title)
      setSlug(row.slug)
      setDescription(row.description ?? "")
      setExcerpt(row.excerpt ?? "")
      setStatus(row.status)
      setTechStack(
        row.tech_stack && Array.isArray(row.tech_stack)
          ? row.tech_stack.join(", ")
          : ""
      )
      setCoverImageUrl(row.cover_image_url ?? "")
      setCoverPreview(row.cover_image_url ?? null)
      setContentJson(row.content_json ?? null)

      setLoading(false)
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  async function uploadCoverIfNeeded(
    file: File | null,
    currentUrl: string,
    slugForName: string
  ): Promise<string | null> {
    // ถ้าไม่มีไฟล์ใหม่ → ใช้ค่าเดิม
    if (!file) return currentUrl || null

    const ext = file.name.split(".").pop() || "png"
    const fileName = `${slugForName}-cover.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-covers")
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data: publicUrlData } = supabase.storage
      .from("project-covers")
      .getPublicUrl(uploadData.path)

    return publicUrlData.publicUrl
  }

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

      // inline image ที่ยังเป็น temp (มี data-temp-id)
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

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("project-images")
            .upload(fileName, file, { upsert: true })

          if (uploadError) {
            throw new Error(uploadError.message)
          }

          const { data: publicUrlData } = supabase.storage
            .from("project-images")
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
      const slugForName = (slug || slugify(title) || "project").toLowerCase()

      // 1) อัปโหลด cover ถ้ามีไฟล์ใหม่
      let finalCoverUrl: string | null = null
      try {
        finalCoverUrl = await uploadCoverIfNeeded(
          coverFile,
          coverImageUrl,
          slugForName
        )
      } catch (err: any) {
        setError("Upload cover image failed: " + err.message)
        setSaving(false)
        return
      }

      // 2) อัปโหลด inline images + patch content_json
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

      // 3) update row
      const payload: Partial<ProjectRow> = {
        title,
        slug: slug || slugify(title),
        description: description || null,
        excerpt: excerpt || null,
        status,
        tech_stack: techStack
          ? techStack
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : null,
        cover_image_url: finalCoverUrl,
        content_json: finalContent ?? null,
      }

      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", projectId)

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }

      router.push("/admin/projects")
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
            Loading project…
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
            Edit Project
          </h1>
          <p className="text-sm text-muted-foreground">
            Update details, cover, and full article content for this project.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/projects")}
        >
          Back to list
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* ซ้าย: ฟอร์ม */}
        <Card className="bg-card/90 border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Project details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <Alert className="mb-2 bg-destructive/10 text-destructive border-none">
                  <TriangleAlertIcon className="h-4 w-4" />
                  <AlertTitle>Failed to update project</AlertTitle>
                  <AlertDescription className="text-destructive/80">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

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
                    Used for URLs and unique identifier.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as ProjectStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="done">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="techStack">Tech Stack</Label>
                  <Input
                    id="techStack"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    placeholder="Next.js, Supabase, shadcn/ui"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Separate with commas. Will be stored as JSON array.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="coverImageUrl">Cover image</Label>
                <Input
                  id="coverImageUrl"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://.../project-covers/admin-panel.png"
                />
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    id="coverFile"
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setCoverFile(file)
                      if (file) {
                        setCoverPreview(URL.createObjectURL(file))
                      } else {
                        setCoverPreview(coverImageUrl || null)
                      }
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  If you choose a file, it will be uploaded to Supabase when you save changes.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Content</Label>
                <p className="text-[11px] text-muted-foreground">
                  Full project article. Use headings, lists, code blocks, and images. Images from your device will be uploaded when you save.
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
                  onClick={() => router.push("/admin/projects")}
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
          title={title}
          excerpt={excerpt}
          status={status}
          techStack={techStack}
          coverImageUrl={coverPreview || coverImageUrl}
          contentJson={contentJson}
        />
      </div>
    </div>
  )
}
