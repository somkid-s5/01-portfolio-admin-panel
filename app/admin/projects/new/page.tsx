"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
import { ProjectBlogPreview } from "@/components/ProjectPreview"

type ProjectStatus = "draft" | "in_progress" | "done" | "archived"

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

export default function NewProjectPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("draft")
  const [techStack, setTechStack] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [contentJson, setContentJson] = useState<any | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tempImages, setTempImages] = useState<TempImage[]>([])   // 👈 เพิ่ม





  const handleGenerateSlug = () => {
    if (!title) return
    setSlug(slugify(title))
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

      // เจอ image ที่มี temp id
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
            .from("project-images")                   // 👈 bucket ที่สร้างไว้
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

    // root node
    return await walk(rawContent)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1) เตรียม slug ไว้ใช้ตั้งชื่อไฟล์ ถ้ายังไม่มีใช้จาก title
      const slugForName = (slug || slugify(title) || "project").toLowerCase()

      // 2) อัปโหลด temp images + patch content_json
      let finalContent = contentJson
      try {
        finalContent = await uploadTempImagesAndPatchContent(
          contentJson,
          tempImages,
          slugForName
        )
      } catch (err: any) {
        setError("Upload inline images failed: " + err.message)
        setLoading(false)
        return
      }

      // 3) payload รวมทุกอย่าง
      const payload: any = {
        title,
        slug: slug || slugify(title),
        description: description || null,
        excerpt: excerpt || null,
        status,
        tech_stack: techStack
          ? techStack.split(",").map((t) => t.trim()).filter(Boolean)
          : null,
        cover_image_url: coverImageUrl || null,
        content_json: finalContent ?? null,
      }

      const { error } = await supabase.from("projects").insert(payload)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      router.push("/admin/projects")
    } catch (err: any) {
      setError(err.message ?? "Unknown error")
      setLoading(false)
    }
  }





  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Project
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new project entry for your portfolio, lab, or internal work.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="bg-card/90 border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Project details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <Alert className="mb-2 bg-destructive/10 text-destructive border-none">
                  <TriangleAlertIcon className="h-4 w-4" />
                  <AlertTitle>Failed to create project</AlertTitle>
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
                    placeholder="e.g. Admin Panel (SDO)"
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
                      placeholder="admin-panel-sdo"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={handleGenerateSlug}
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
                  placeholder="Short description about this project…"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Short summary shown in list/cards…"
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
                    placeholder="Next.js, Supabase, shadcn/ui"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
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
                  placeholder="https://.../project-covers/admin-panel.png"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    id="coverFile"
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) {
                        setCoverFile(null)
                        setCoverPreview(null)
                        return
                      }
                      setCoverFile(file)
                      setCoverPreview(URL.createObjectURL(file))
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  If you choose a file, it will be uploaded to Supabase when you create the project.
                  The public URL will be stored automatically.
                </p>
              </div>


              <div className="space-y-1.5">
                <Label>Content</Label>
                <p className="text-[11px] text-muted-foreground">
                  Full project article. You can use headings, lists, code blocks and images (via URL).
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
                  onClick={() => router.push("/admin/projects")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating…" : "Create project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
