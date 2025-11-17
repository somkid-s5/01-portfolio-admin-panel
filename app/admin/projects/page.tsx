"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FolderGit2, PlusCircle, LayoutGrid, List } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"


type ProjectStatus = "draft" | "in_progress" | "done" | "archived"

type ProjectItem = {
    id: string
    title: string
    description: string | null
    status: ProjectStatus
    tech_stack: string[] | null
}

const statusLabel: Record<ProjectStatus, string> = {
    draft: "Draft",
    in_progress: "In progress",
    done: "Completed",
    archived: "Archived",
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<"card" | "list">("card")

    const router = useRouter()



    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from("projects")
                .select("id, title, description, status, tech_stack")
                .order("created_at", { ascending: false })

            if (error) {
                setError(error.message)
                setLoading(false)
                return
            }

            setProjects(
                (data || []).map((row) => ({
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    status: row.status as ProjectStatus,
                    tech_stack: row.tech_stack as string[] | null,
                }))
            )
            setLoading(false)
        }

        fetchProjects()
    }, [])

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Projects
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage and track your DevOps, system, and documentation projects.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* ปุ่มสลับมุมมอง */}
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(val) => val && setViewMode(val as "card" | "list")}
                        className="border border-border/60 rounded-md px-1 py-0.5"
                    >
                        <ToggleGroupItem
                            value="card"
                            aria-label="Card view"
                            className={cn(
                                "h-8 w-8 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="list"
                            aria-label="List view"
                            className={cn(
                                "h-8 w-8 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>

                    <Button
                        type="button"
                        className="inline-flex items-center gap-2"
                        onClick={() => router.push("/admin/projects/new")}
                    >
                        <PlusCircle className="h-4 w-4" />
                        New project
                    </Button>
                </div>
            </div>


            <Separator className="bg-border/60" />

            {/* Loading / Error / Empty / List */}
            {loading ? (
                <Card className="border-border/60 bg-card/80">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        Loading projects…
                    </CardContent>
                </Card>
            ) : error ? (
                <Card className="border-destructive/40 bg-destructive/10">
                    <CardContent className="py-4 text-sm text-destructive">
                        Failed to load projects: {error}
                    </CardContent>
                </Card>
            ) : projects.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-card/80">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <FolderGit2 className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium">No projects yet</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            Start by creating your first project to track what you&apos;re building.
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            className="inline-flex items-center gap-2"
                        >
                            <PlusCircle className="h-4 w-4" />
                            New project
                        </Button>
                    </CardContent>
                </Card>
            ) : viewMode === "card" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="bg-card/90 border border-border/60 flex flex-col"
                        >
                            <CardHeader className="space-y-2 pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-sm font-semibold leading-snug">
                                        {project.title}
                                    </CardTitle>
                                    <StatusBadge status={project.status} />
                                </div>
                                {project.tech_stack && project.tech_stack.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {project.tech_stack.map((tech) => (
                                            <Badge
                                                key={tech}
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0"
                                            >
                                                {tech}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-between text-xs text-muted-foreground">
                                <p className="line-clamp-3 mb-4">
                                    {project.description || "No description provided yet."}
                                </p>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground/80">
                                        ID: {project.id}
                                    </span>
                                    <Link href={`/admin/projects/${project.id}`} passHref>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-[11px]"
                                            type="button"
                                        >
                                            View / Edit
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                /* มุมมองแบบ list */
                <div className="space-y-2">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="bg-card/90 border border-border/60"
                        >
                            <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            {project.title}
                                        </span>
                                        <StatusBadge status={project.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {project.description || "No description provided yet."}
                                    </p>
                                    {project.tech_stack && project.tech_stack.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {project.tech_stack.map((tech) => (
                                                <Badge
                                                    key={tech}
                                                    variant="outline"
                                                    className="text-[10px] px-1.5 py-0"
                                                >
                                                    {tech}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Link href={`/admin/projects/${project.id}`} passHref>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        type="button"
                                    >
                                        View / Edit
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

type ProjectStatusProps = {
    status: ProjectStatus
}

function StatusBadge({ status }: ProjectStatusProps) {
    const color = {
        draft: "bg-muted text-muted-foreground",
        in_progress: "bg-primary/10 text-primary border-primary/40",
        done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
        archived: "bg-muted text-muted-foreground/80 border-muted-foreground/20",
    }[status]

    return (
        <Badge
            variant="outline"
            className={cn(
                "border px-2 py-0 text-[10px] font-medium rounded-full",
                color
            )}
        >
            {statusLabel[status]}
        </Badge>
    )
}
