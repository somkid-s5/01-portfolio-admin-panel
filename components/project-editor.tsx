"use client"

import { JSONContent } from "@tiptap/core"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"

import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  ImageIcon,
  LinkIcon,
} from "lucide-react"

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"

import ts from "highlight.js/lib/languages/typescript"
import js from "highlight.js/lib/languages/javascript"
import bash from "highlight.js/lib/languages/bash"
import json from "highlight.js/lib/languages/json"
import python from "highlight.js/lib/languages/python"

const lowlight = createLowlight(common)
lowlight.register("ts", ts)
lowlight.register("tsx", ts)
lowlight.register("js", js)
lowlight.register("bash", bash)
lowlight.register("json", json)
lowlight.register("python", python)

export type ProjectContentJSON = JSONContent | null

type RichProjectEditorProps = {
  initialContent?: ProjectContentJSON
  onChange: (doc: JSONContent) => void
  onAddTempImage?: (tempId: string, file: File) => void
}

type ImageAttrs = {
  src: string
  alt?: string
  ["data-temp-id"]?: string
}

export function RichProjectEditor({
  initialContent,
  onChange,
  onAddTempImage,
}: RichProjectEditorProps) {
  const fileInputId = "editor-image-input"
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        enableTabIndentation: true,
        languageClassPrefix: "language-",
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder:
          "Describe what this project is about, what you built, tech details, diagrams, screenshots...",
      }),
    ],
    content: initialContent || undefined,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class:
          "tiptap prose dark:prose-invert max-w-none min-h-[280px] px-4 py-3 text-sm focus:outline-none",
      },
    },
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div className="border border-border/60 rounded-md bg-card">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-border/60 bg-background/80">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleBold().run()
          }}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleItalic().run()
          }}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleBulletList().run()
          }}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleOrderedList().run()
          }}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleBlockquote().run()
          }}
        >
          <Quote className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleCodeBlock().run()
          }}
        >
          <Code className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            const prev = editor.getAttributes("link").href
            const url = window.prompt("Enter URL", prev)
            if (url === null) return
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run()
            } else {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run()
            }
          }}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault()
            const input = document.getElementById(
              fileInputId
            ) as HTMLInputElement | null
            input?.click()
          }}
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      <input
        id={fileInputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return

          const tempId = crypto.randomUUID()
          const objectUrl = URL.createObjectURL(file)
          const imageAttrs: ImageAttrs = {
            src: objectUrl,
            alt: file.name,
            ["data-temp-id"]: tempId,
          }

          editor.chain().focus().setImage(imageAttrs).run()
          onAddTempImage?.(tempId, file)
          e.target.value = ""
        }}
      />

      <EditorContent editor={editor} className="bg-card" />
    </div>
  )
}
