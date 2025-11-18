"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { format } from 'date-fns'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    FolderGit2,
    PlusCircle,
    LayoutGrid,
    List,
    Filter,
    Search,
    SquarePen,
} from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

type ProjectStatus = "draft" | "in_progress" | "done" | "archived"

type ProjectItem = {
    id: string
    title: string
    description: string | null
    status: ProjectStatus
    tech_stack: string[] | null
    updated_at: string
    cover_image_url: string | null
    category: string | null
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

    // --- LOGIC ---
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("newest")
    const [category, setCategory] = useState("all")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

    // 🧠 (1) สร้าง State ใหม่ เพื่อ "เก็บ" Category ที่มีทั้งหมด
    const [availableCategories, setAvailableCategories] = useState<string[]>([])

    const router = useRouter()

    // --- Effect สำหรับ Debounce (รอ 300ms ค่อยค้นหา) ---
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 300)
        return () => clearTimeout(timerId)
    }, [searchTerm])


    // 🧠 (2) สร้าง Effect ใหม่: ทำงาน "ครั้งเดียว" ตอนโหลดหน้า
    // เพื่อ "สรุป" Category ทั้งหมดที่มีในตาราง
    useEffect(() => {
        const fetchCategories = async () => {
            // (ดึงแค่คอลัมน์ category มาก็พอ)
            const { data, error } = await supabase
                .from('projects')
                .select('category');

            if (data) {
                // 1. ดึง Category ทั้งหมด: ["react", "devops", "react", null, "nextjs"]
                const allCategories = data
                    .map(project => project.category)
                    .filter(Boolean) as string[]; // filter(Boolean) = กรอง null, undefined ออก

                // 2. "สรุป" (De-duplicate) ให้เหลือตัวเดียว: ["react", "devops", "nextjs"]
                const uniqueCategories = [...new Set(allCategories)];

                // 3. เรียงตามตัวอักษร
                uniqueCategories.sort();

                // 4. เก็บเข้า State
                setAvailableCategories(uniqueCategories);
            } else if (error) {
                console.error("Failed to fetch categories:", error.message);
            }
        };

        fetchCategories();
    }, []); // 👈 วงเล็บว่าง = ทำงานแค่ครั้งเดียวตอนโหลด


    // --- Effect สำหรับ Fetch ข้อมูล Projects (กรองข้อมูล) ---
    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true)
            setError(null)

            let query = supabase
                .from("projects")
                .select("id, title, description, status, tech_stack, updated_at, cover_image_url, category")

            if (debouncedSearchTerm) {
                query = query.ilike('title', `%${debouncedSearchTerm}%`)
            }
            if (category !== "all") {
                query = query.eq('category', category)
            }
            if (sortBy === "newest") {
                query = query.order("created_at", { ascending: false })
            } else if (sortBy === "popular") {
                query = query.order("updated_at", { ascending: false })
            }

            const { data, error } = await query

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
                    updated_at: row.updated_at,
                    cover_image_url: row.cover_image_url,
                    category: row.category,
                }))
            )
            setLoading(false)
        }

        fetchProjects()
    }, [debouncedSearchTerm, sortBy, category])

    return (
        <div className="space-y-6">

            {/* HEADER และ FILTER BAR */}
            <div className="flex flex-col gap-4">
                {/* แถวบน */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Projects
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage and track your DevOps, system, and documentation projects.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Button
                            type="button"
                            className="inline-flex items-center gap-2  text-white hover:bg-transparent  hover:bg-opacity-75  outline-2 outline-green-500"
                            onClick={() => router.push("/admin/projects/new")}
                        >
                            <PlusCircle className="h-4 w-4" />
                            New project
                        </Button>
                    </div>
                </div>

                {/* แถวล่าง: Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    {/* ฝั่งซ้าย: Dropdowns */}
                    <div className="flex items-center gap-2">
                        {/* (SortBy: เหมือนเดิม) */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 w-auto text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Sort: by newest</SelectItem>
                                <SelectItem value="popular">Sort: by popular</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* 🧠 (3) อัปเดต Dropdown Category ให้เป็น Dynamic */}
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-9 w-auto text-xs">
                                <SelectValue placeholder="Category: All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Category: All</SelectItem>

                                {/* สร้าง Item จาก State ที่เรา "สรุป" มา */}
                                {availableCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>
                                        {/* (แถม) ทำตัวอักษรตัวแรกให้เป็นตัวใหญ่ */}
                                        Category: {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ฝั่งขวา: Search, Toggle */}
                    <div className="flex items-center gap-2">

                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects..."
                                className="h-9 w-full md:w-[150px] lg:w-[250px] pl-9 text-xs"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <ToggleGroup
                            type="single"
                            value={viewMode}
                            onValueChange={(val) => val && setViewMode(val as "card" | "list")}
                            className="border border-border/60 rounded-md px-1 py-0.5"
                        >
                            <ToggleGroupItem value="card" aria-label="Card view" className={cn("h-8 w-8 ...")}>
                                <LayoutGrid className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="list" aria-label="List view" className={cn("h-8 w-8 ...")}>
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
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
                        <p className="text-sm font-medium">No projects found</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            Try adjusting your search or filters.
                        </p>
                    </CardContent>
                </Card>

                // CARD VIEW
            ) : viewMode === "card" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="bg-card/90 border border-border/60 flex flex-col overflow-hidden gap-1 py-0"
                        >
                            {/* ส่วนรูปภาพ */}
                            <div className="relative w-full aspect-video">
                                {project.cover_image_url ? (
                                    <Image
                                        src={project.cover_image_url}
                                        alt={project.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <FolderGit2 className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                )}

                            </div>

                            {/* ส่วนเนื้อหา */}
                            <div className="flex flex-col gap-2 flex-1 min-h-[130px] p-2  pb-0  ">
                                <div className="flex gap-2">
                                    <StatusBadge status={project.status} />
                                    {project.category && (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                                        </Badge>
                                    )}
                                </div>

                                <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
                                    {project.title}
                                </CardTitle>

                                <p className="text-xs text-muted-foreground line-clamp-3">
                                    {project.description || "No description provided yet."}
                                </p>

                                {project.tech_stack && project.tech_stack.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-auto pb-1   ">
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

                            {/* ส่วน Footer */}
                            <div className="flex items-center justify-between  border-t border-border/60 p-2">
                                <div className="flex items-center  gap-2 ">

                                    <   span className="text-[11px] text-muted-foreground/80">
                                        Updated: {format(new Date(project.updated_at.replace(' ', 'T')), 'dd MMM yyyy')}
                                    </span>


                                </div>

                                <Link href={`/admin/projects/${project.id}`} passHref>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        type="button"
                                    >
                                        <SquarePen className="  text-muted-foreground" />
                                        Edit
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>

            ) : (
                /* LIST VIEW */
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

// (ส่วน StatusBadge เหมือนเดิมเป๊ะ)
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
