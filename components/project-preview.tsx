"use client"

import { useEffect } from "react"
import { JSONContent } from "@tiptap/core"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"

type ProjectBlogPreviewProps = {
  title: string
  excerpt: string
  status: string
  techStack: string
  coverImageUrl?: string | null
  contentJson: JSONContent | null
}

export function ProjectBlogPreview({
  title,
  excerpt,
  status,
  techStack,
  coverImageUrl,
  contentJson,
}: ProjectBlogPreviewProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
      }),
      TiptapImage.configure({
        inline: false,
      }),
    ],
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none text-sm leading-relaxed [&_p]:mb-2 [&_h2]:mt-4 [&_h2]:mb-2",
      },
    },
  })

  // อัปเดต content ทุกครั้งที่ contentJson เปลี่ยน
  useEffect(() => {
    if (!editor) return
    if (contentJson) {
      editor.commands.setContent(contentJson)
    } else {
      editor.commands.clearContent()
    }
  }, [editor, contentJson])

  const chips = techStack
    ? techStack.split(",").map((t) => t.trim()).filter(Boolean)
    : []

  const statusLabel =
    status === "draft"
      ? "Draft"
      : status === "in_progress"
      ? "In progress"
      : status === "done"
      ? "Completed"
      : status === "published"
      ? "Published"
      : status === "archived"
      ? "Archived"
      : "Draft"

  return (
    <Card className="h-fit bg-card border border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Live preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cover */}
        <div className="aspect-[16/9] w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={title || "Project cover"}
              width={640}
              height={360}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Cover image preview
            </span>
          )}
        </div>

        {/* Meta + Title */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">
              {title || "Project title"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {excerpt ||
                "Short summary of your project will appear here before the full article."}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] mt-0.5">
            {statusLabel}
          </Badge>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chips.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="text-[10px] px-1.5 py-0"
              >
                {t}
              </Badge>
            ))}
          </div>
        )}

        {/* Blog content preview */}
        <div className="border-t border-border/60 pt-3">
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Start writing content to see a live preview here.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
