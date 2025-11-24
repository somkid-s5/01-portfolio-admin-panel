"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { JSONContent } from "@tiptap/core"
import { ZodError } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { DocPageSchema } from "@/lib/schemas"
import { slugify } from "@/lib/utils"
import { ProjectBlogPreview } from "@/components/project-preview"
import { useImageUpload, TempImage } from "../hooks/useImageUpload"
import { DocFormState, DocSection, DocStatus } from "../types"

const RichProjectEditor = dynamic(
  () => import("@/components/project-editor").then((mod) => mod.RichProjectEditor),
  { ssr: false }
)

type DocFormProps = {
  mode: "create" | "edit"
  sections: DocSection[]
  initialValues: DocFormState
  loadingSections?: boolean
  saving?: boolean
  onCancel: () => void
  onSubmit: (payload: {
    section_id: string
    title: string
    slug: string
    excerpt: string | null
    status: DocStatus
    content_json: JSONContent | null
  }) => Promise<void>
}

export function DocForm({
  mode,
  sections,
  initialValues,
  loadingSections = false,
  saving = false,
  onCancel,
  onSubmit,
}: DocFormProps) {
  const [formState, setFormState] = useState<DocFormState>(initialValues)
  const [tempImages, setTempImages] = useState<TempImage[]>([])

  const { uploadAndPatchContent } = useImageUpload()

  const normalizedSlug = useMemo(
    () => formState.slug || slugify(formState.title),
    [formState.slug, formState.title]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const parsed = DocPageSchema.parse({
        section_id: formState.sectionId,
        title: formState.title.trim(),
        slug: slugify(normalizedSlug),
        excerpt: formState.excerpt,
        status: formState.status,
        content_json: formState.contentJson,
      })

      const finalContent = await uploadAndPatchContent(
        parsed.content_json ?? null,
        tempImages,
        parsed.slug
      )

      await onSubmit({
        ...parsed,
        excerpt: parsed.excerpt ? parsed.excerpt : null,
        content_json: finalContent,
      })
    } catch (err) {
      if (err instanceof ZodError) {
        toast.error(err.issues[0]?.message ?? "Validation failed")
        return
      }

      if (err instanceof Error) {
        toast.error(err.message)
        return
      }

      toast.error("Failed to submit form")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <Card className="bg-card/90 border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">
            {mode === "create" ? "Doc details" : "Edit doc details"}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Basic metadata and rich content for this docs page."
              : "Update metadata and content for this docs page."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Select
                  value={formState.sectionId}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, sectionId: value }))
                  }
                  disabled={loadingSections}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingSections ? "Loading sections..." : "Select section"
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
                  Choose where this page appears in the docs sidebar.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, status: value as DocStatus }))
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Basic OSPF Overview"
                  required
                  value={formState.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value
                    setFormState((prev) => ({
                      ...prev,
                      title: nextTitle,
                      slug: prev.slug ? prev.slug : slugify(nextTitle),
                    }))
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    placeholder="basic-ospf-overview"
                    value={formState.slug}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, slug: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        slug: slugify(prev.title),
                      }))
                    }
                  >
                    Auto
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Used for URLs. Final URL will be /docs/&lt;section&gt;/&lt;slug&gt;.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Short summary for this docs page..."
                rows={3}
                value={formState.excerpt}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, excerpt: e.target.value }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Used in search results, previews, or cards.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Content</Label>
              <p className="text-[11px] text-muted-foreground">
                Full docs content. Images from your device are uploaded on save.
              </p>
              <RichProjectEditor
                initialContent={formState.contentJson}
                onChange={(doc) =>
                  setFormState((prev) => ({ ...prev, contentJson: doc }))
                }
                onAddTempImage={(tempId, file) =>
                  setTempImages((prev) => [...prev, { id: tempId, file }])
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : mode === "create" ? "Create docs page" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ProjectBlogPreview
        title={formState.title || "Untitled docs page"}
        excerpt={formState.excerpt}
        status={formState.status}
        techStack=""
        coverImageUrl={null}
        contentJson={formState.contentJson}
      />
    </div>
  )
}
