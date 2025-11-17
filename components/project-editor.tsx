"use client"

import { useEditor, EditorContent } from "@tiptap/react" // <-- กล่องหลัก (Core) มีแค่นี้

import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"

import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
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
import { common, createLowlight } from 'lowlight'


// เลือกภาษาที่อยากให้มีสี
import ts from "highlight.js/lib/languages/typescript"
import js from "highlight.js/lib/languages/javascript"
import bash from "highlight.js/lib/languages/bash"
import json from "highlight.js/lib/languages/json"
import python from "highlight.js/lib/languages/python"


const lowlight = createLowlight(common)
// register ภาษาให้ lowlight
lowlight.register("ts", ts)
lowlight.register("tsx", ts)
lowlight.register("js", js)
lowlight.register("bash", bash)
lowlight.register("json", json)
lowlight.register("python", python)


export type ProjectContentJSON = any

type RichProjectEditorProps = {
    initialContent?: ProjectContentJSON | null
    onChange: (doc: ProjectContentJSON) => void
}

export function RichProjectEditor({
    initialContent,
    onChange,
}: RichProjectEditorProps) {
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
                languageClassPrefix: 'language-',
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
                    "Describe what this project is about, what you built, tech details, diagrams, screenshots…",
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

    const setLink = () => {
        const prev = editor.getAttributes("link").href
        const url = window.prompt("Enter URL", prev)

        if (url === null) return
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }

    const insertImage = () => {
        const url = window.prompt("Image URL")

        if (!url) return
        editor.chain().focus().setImage({ src: url }).run()
    }

    return (
        <div className="border border-border/60 rounded-md bg-card">
            {/* Top toolbar */}
            {/* <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/60 bg-background/80">
                <ToggleGroup type="multiple" className="flex">
                    <ToggleGroupItem
                        value="bold"
                        aria-label="Bold"
                        className={cn(
                            "h-8 w-8",
                            editor.isActive("bold") && "bg-primary/10 text-primary"
                        )}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold className="h-3.5 w-3.5" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="italic"
                        aria-label="Italic"
                        className={cn(
                            "h-8 w-8",
                            editor.isActive("italic") && "bg-primary/10 text-primary"
                        )}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic className="h-3.5 w-3.5" />
                    </ToggleGroupItem>
                </ToggleGroup>

                <ToggleGroup type="single" className="flex">
                    <ToggleGroupItem
                        value="h1"
                        aria-label="Heading 1"
                        className={cn(
                            "h-8 w-8",
                            editor.isActive("heading", { level: 1 }) &&
                            "bg-primary/10 text-primary"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 1 })
                                .run()
                        }
                    >
                        <Heading1 className="h-3.5 w-3.5" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="h2"
                        aria-label="Heading 2"
                        className={cn(
                            "h-8 w-8",
                            editor.isActive("heading", { level: 2 }) &&
                            "bg-primary/10 text-primary"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                        }
                    >
                        <Heading2 className="h-3.5 w-3.5" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="h3"
                        aria-label="Heading 3"
                        className={cn(
                            "h-8 w-8",
                            editor.isActive("heading", { level: 3 }) &&
                            "bg-primary/10 text-primary"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 3 })
                                .run()
                        }
                    >
                        <Heading3 className="h-3.5 w-3.5" />
                    </ToggleGroupItem>
                </ToggleGroup>

                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                    >
                        <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                        }
                    >
                        <ListOrdered className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                        }
                    >
                        <Quote className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                            editor.chain().focus().toggleCodeBlock().run()
                        }
                    >
                        <Code className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={setLink}
                    >
                        <LinkIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={insertImage}
                    >
                        <ImageIcon className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div> */}
            {/* Top toolbar (simple buttons, ไม่ใช้ ToggleGroup) */}
            <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-border/60 bg-background/80">
                {/* Bold / Italic */}
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

                {/* Headings */}
                <Button
                    type="button"
                    variant={
                        editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"
                    }
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
                    variant={
                        editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
                    }
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
                    variant={
                        editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
                    }
                    size="icon"
                    className="h-8 w-8"
                    onMouseDown={(e) => {
                        e.preventDefault()
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }}
                >
                    <Heading3 className="h-3.5 w-3.5" />
                </Button>

                {/* Lists */}
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

                {/* Quote / Code block */}
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

                {/* Link / Image */}
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
                        const url = window.prompt("Image URL")
                        if (!url) return
                        editor.chain().focus().setImage({ src: url }).run()
                    }}
                >
                    <ImageIcon className="h-3.5 w-3.5" />
                </Button>
            </div>


            {/* Floating / Bubble menus ให้ฟีล Medium */}
            {/* <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                <div className="flex items-center gap-1 rounded-md border border-border bg-background px-1 py-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-7 w-7",
                            editor.isActive("bold") && "bg-primary/10 text-primary"
                        )}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-7 w-7",
                            editor.isActive("italic") && "bg-primary/10 text-primary"
                        )}
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                    >
                        <Italic className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={setLink}
                    >
                        <LinkIcon className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </BubbleMenu>

            <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
                <div className="flex items-center gap-1 rounded-md border border-border bg-background px-1 py-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                        }
                    >
                        <Heading2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                    >
                        <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={insertImage}
                    >
                        <ImageIcon className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </FloatingMenu> */}

            <EditorContent editor={editor} className="bg-card" />
        </div>
    )
}
