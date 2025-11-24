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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table"



import { Plus, Pencil, Trash2, FileText, Folder } from "lucide-react"
import { slugify } from "@/lib/utils"
import { DocPage, DocSection } from "./types"

export default function DocsAdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sections, setSections] = useState<DocSection[]>([])
  const [pages, setPages] = useState<DocPage[]>([])

  // modal state
  const [createSectionOpen, setCreateSectionOpen] = useState(false)
  const [createItemOpen, setCreateItemOpen] = useState(false)
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null)

  const [newSectionName, setNewSectionName] = useState("")
  const [newItemTitle, setNewItemTitle] = useState("")
  const [newItemSlug, setNewItemSlug] = useState("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      const [{ data: secData, error: secErr }, { data: pageData, error: pageErr }] =
        await Promise.all([
          supabase
            .from("doc_sections")
            .select("id, name, slug, description, sort_order")
            .order("sort_order", { ascending: true }),
          supabase
            .from("doc_pages")
            .select("id, section_id, title, slug, excerpt, status, sort_order")
            .order("sort_order", { ascending: true }),
        ])

      if (secErr || pageErr) {
        setError(secErr?.message || pageErr?.message || "Failed to load docs.")
        setLoading(false)
        return
      }

      setSections(
        (secData ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: "description" in row ? row.description : null,
          sort_order: "sort_order" in row ? row.sort_order : null,
        }))
      )
      setPages(
        (pageData ?? []).map((row) => ({
          id: row.id,
          section_id: row.section_id,
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          status: row.status,
          sort_order: row.sort_order,
        }))
      )
      setLoading(false)
    }

    load()
  }, [])

  const refresh = async () => {
    setLoading(true)
    setError(null)

    const [{ data: secData, error: secErr }, { data: pageData, error: pageErr }] =
      await Promise.all([
        supabase
          .from("doc_sections")
          .select("id, name, slug, description, sort_order")
          .order("sort_order", { ascending: true }),
        supabase
          .from("doc_pages")
          .select("id, section_id, title, slug, excerpt, status, sort_order")
          .order("sort_order", { ascending: true }),
      ])

    if (secErr || pageErr) {
      setError(secErr?.message || pageErr?.message || "Failed to reload docs.")
      setLoading(false)
      return
    }

    setSections(
      (secData ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: "description" in row ? row.description : null,
        sort_order: "sort_order" in row ? row.sort_order : null,
      }))
    )
    setPages(
      (pageData ?? []).map((row) => ({
        id: row.id,
        section_id: row.section_id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        status: row.status,
        sort_order: row.sort_order,
      }))
    )
    setLoading(false)
  }

  // ---------- create section ----------
  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return

    const slug = slugify(newSectionName)
    const sortOrder =
      (sections[sections.length - 1]?.sort_order ?? 0) + 10

    const { error } = await supabase.from("doc_sections").insert({
      name: newSectionName.trim(),
      slug,
      sort_order: sortOrder,
    })

    if (error) {
      setError(error.message)
      return
    }

    setNewSectionName("")
    setCreateSectionOpen(false)
    refresh()
  }

  // ---------- create item (page skeleton) ----------
  const handleCreateItem = async () => {
    if (!targetSectionId || !newItemTitle.trim()) return

    const slug = newItemSlug.trim()
      ? slugify(newItemSlug)
      : slugify(newItemTitle)

    const pagesInSection = pages.filter(
      (p) => p.section_id === targetSectionId
    )
    const sortOrder =
      (pagesInSection[pagesInSection.length - 1]?.sort_order ?? 0) + 10

    const { error } = await supabase.from("doc_pages").insert({
      section_id: targetSectionId,
      title: newItemTitle.trim(),
      slug,
      status: "draft",
      sort_order: sortOrder,
    })

    if (error) {
      setError(error.message)
      return
    }

    setNewItemTitle("")
    setNewItemSlug("")
    setCreateItemOpen(false)
    setTargetSectionId(null)
    refresh()
  }

  // ---------- delete section ----------
  const handleDeleteSection = async (sectionId: string) => {
    const confirmed = window.confirm(
      "Delete this section and all its pages?"
    )
    if (!confirmed) return

    const { error } = await supabase
      .from("doc_sections")
      .delete()
      .eq("id", sectionId)

    if (error) {
      setError(error.message)
      return
    }

    refresh()
  }

  // ---------- delete page ----------
  const handleDeletePage = async (pageId: string) => {
    const confirmed = window.confirm("Delete this doc page?")
    if (!confirmed) return

    const { error } = await supabase
      .from("doc_pages")
      .delete()
      .eq("id", pageId)

    if (error) {
      setError(error.message)
      return
    }

    refresh()
  }

  const pagesBySection = (sectionId: string) =>
    pages.filter((p) => p.section_id === sectionId)

  const sectionItemsCount = (sectionId: string) =>
    pagesBySection(sectionId).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Documentation Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your documentation sections and content for the public docs site.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateSectionOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add section
        </Button>
      </div>

      {error && (
        <Alert className="bg-destructive/10 text-destructive border-none">
          <AlertTitle>Failed to load docs</AlertTitle>
          <AlertDescription className="text-destructive/80">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* -------- STRUCTURE TAB -------- */}
        <TabsContent value="structure">
          <Card className="bg-card/90 border border-border/60">
            <CardHeader>
              <CardTitle className="text-base">
                Documentation structure
              </CardTitle>
              <CardDescription>
                Organize your sections and items. Drag-and-drop can be added later; for now use this page to manage sections and doc items.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="text-sm text-muted-foreground">
                  Loading structure…
                </div>
              )}

              {!loading && sections.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No sections yet. Click{" "}
                  <span className="font-medium text-foreground">
                    Add section
                  </span>{" "}
                  to create your first docs group.
                </div>
              )}

              {!loading &&
                sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-lg border border-border/70 bg-muted/30"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                          <Folder className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {section.name}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[11px] px-2 py-0 h-5"
                            >
                              {sectionItemsCount(section.id)}{" "}
                              {sectionItemsCount(section.id) === 1
                                ? "item"
                                : "items"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            /{section.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTargetSectionId(section.id)
                            setCreateItemOpen(true)
                          }}
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add item
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            // ภายหลังจะทำหน้า edit section แยก ถ้าต้องการ
                            const newName =
                              window.prompt(
                                "Rename section",
                                section.name
                              ) ?? ""
                            if (!newName.trim()) return
                            supabase
                              .from("doc_sections")
                              .update({
                                name: newName.trim(),
                                slug: slugify(newName),
                              })
                              .eq("id", section.id)
                              .then(() => refresh())
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* items in section */}
                    <div className="divide-y divide-border/60">
                      {pagesBySection(section.id).map((page) => (
                        <div
                          key={page.id}
                          className="flex items-center justify-between px-4 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border/60">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {page.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                /{section.slug}/{page.slug}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 px-2"
                            >
                              {page.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                router.push(`/admin/docs/${page.id}`)
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeletePage(page.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {pagesBySection(section.id).length === 0 && (
                        <div className="px-4 py-3 text-[12px] text-muted-foreground">
                          No items in this section yet. Use{" "}
                          <span className="font-medium text-foreground">
                            Add item
                          </span>{" "}
                          to create the first doc page.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------- CONTENT TAB (table overview) -------- */}
        <TabsContent value="content">
          <Card className="bg-card/90 border border-border/60">
            <CardHeader>
              <CardTitle className="text-base">
                All documentation pages
              </CardTitle>
              <CardDescription>
                Overview of all docs pages. Use this tab to jump into editing content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/admin/docs/new")}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  New page
                </Button>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">
                  Loading pages…
                </p>
              ) : pages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No docs pages created yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pages.map((page) => {
                      const section = sections.find(
                        (s) => s.id === page.section_id
                      )
                      return (
                        <TableRow key={page.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {page.title}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                /{section?.slug}/{page.slug}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {section?.name ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 px-2"
                            >
                              {page.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() =>
                                router.push(`/admin/docs/${page.id}`)
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* -------- DIALOG: CREATE SECTION -------- */}
      <Dialog
        open={createSectionOpen}
        onOpenChange={(open) => {
          setCreateSectionOpen(open)
          if (!open) setNewSectionName("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new section</DialogTitle>
            <DialogDescription>
              Create a new top-level section for your documentation sidebar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sectionName">Section title</Label>
              <Input
                id="sectionName"
                placeholder="e.g. Getting Started"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setCreateSectionOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSection}>Create section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------- DIALOG: CREATE ITEM / PAGE -------- */}
      <Dialog
        open={createItemOpen}
        onOpenChange={(open) => {
          setCreateItemOpen(open)
          if (!open) {
            setNewItemTitle("")
            setNewItemSlug("")
            setTargetSectionId(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new doc item</DialogTitle>
            <DialogDescription>
              Add a new documentation page under this section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="docTitle">Item title</Label>
              <Input
                id="docTitle"
                placeholder="e.g. Introduction"
                value={newItemTitle}
                onChange={(e) => {
                  setNewItemTitle(e.target.value)
                  if (!newItemSlug) {
                    setNewItemSlug(slugify(e.target.value))
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="docSlug">Slug</Label>
              <Input
                id="docSlug"
                placeholder="auto-generated if empty"
                value={newItemSlug}
                onChange={(e) => setNewItemSlug(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setCreateItemOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateItem}>Add item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
