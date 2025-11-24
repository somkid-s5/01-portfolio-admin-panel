import { JSONContent } from "@tiptap/core"

export type DocStatus = "draft" | "published" | "archived"

export type DocSection = {
  id: string
  name: string
  slug: string
  description?: string | null
  sort_order?: number | null
}

export type DocPage = {
  id: string
  section_id: string
  title: string
  slug: string
  excerpt: string | null
  status: DocStatus
  content_json?: JSONContent | null
  sort_order?: number | null
}

export type DocFormState = {
  sectionId: string
  title: string
  slug: string
  excerpt: string
  status: DocStatus
  contentJson: JSONContent | null
}
