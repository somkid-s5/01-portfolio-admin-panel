"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { JSONContent } from "@tiptap/core"
import { toast } from "sonner"

import { supabase } from "@/lib/supabaseClient"
import { DocForm } from "../components/doc-form"
import { DocFormState, DocSection, DocStatus } from "../types"
import { slugify } from "@/lib/utils"

const initialFormState: DocFormState = {
  sectionId: "",
  title: "",
  slug: "",
  excerpt: "",
  status: "draft",
  contentJson: null,
}

export default function NewDocPage() {
  const router = useRouter()

  const [sections, setSections] = useState<DocSection[]>([])
  const [loadingSections, setLoadingSections] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadSections = async () => {
      setLoadingSections(true)

      const { data, error: queryError } = await supabase
        .from("doc_sections")
        .select("id, name, slug")
        .order("sort_order", { ascending: true })

      if (queryError) {
        toast.error(queryError.message)
        setLoadingSections(false)
        return
      }

      setSections(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
        }))
      )

      setLoadingSections(false)
    }

    loadSections()
  }, [])

  const handleCreate = async (payload: {
    section_id: string
    title: string
    slug: string
    excerpt: string | null
    status: DocStatus
    content_json: JSONContent | null
  }) => {
    setSaving(true)

    try {
      const slugForName = (payload.slug || slugify(payload.title)).toLowerCase()
      let sortOrder = 10

      const { data: maxRow, error: maxErr } = await supabase
        .from("doc_pages")
        .select("sort_order")
        .eq("section_id", payload.section_id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle<{ sort_order: number | null }>()

      if (maxErr && maxErr.code !== "PGRST116") {
        throw maxErr
      }

      if (maxRow?.sort_order !== undefined && maxRow.sort_order !== null) {
        sortOrder = maxRow.sort_order + 10
      }

      const { error: insertErr } = await supabase.from("doc_pages").insert({
        section_id: payload.section_id,
        title: payload.title,
        slug: slugForName,
        excerpt: payload.excerpt,
        status: payload.status,
        content_json: payload.content_json,
        sort_order: sortOrder,
      })

      if (insertErr) {
        throw insertErr
      }

      toast.success("Docs page created")
      router.push("/admin/docs")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create docs page"
      toast.error(message)
    } finally {
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

      <DocForm
        mode="create"
        sections={sections}
        initialValues={initialFormState}
        loadingSections={loadingSections}
        saving={saving}
        onCancel={() => router.push("/admin/docs")}
        onSubmit={handleCreate}
      />
    </div>
  )
}
