"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { Plus, Trophy, Calendar, Filter, AlertTriangle } from "lucide-react";

type CertType = "exam" | "training" | "other";
type CertStatus = "planned" | "in_progress" | "passed" | "expired";

type CertCategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

type CertRow = {
  id: string;
  cert_type: CertType;
  name: string;
  vendor: string;
  category_id: string | null;
  level: string | null;
  status: CertStatus;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  score: number | null;
  highlight: boolean;
  badge_image_url: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

// ใช้ประเมิน expiry state สำหรับ UI
function getExpiryState(
  expiryDate: string | null,
  status: CertStatus
): "none" | "ok" | "soon" | "expired" {
  if (!expiryDate) return "none";
  const now = new Date();
  const exp = new Date(expiryDate);
  if (Number.isNaN(exp.getTime())) return "none";

  // ถ้า status = expired หรือวันหมดอายุอยู่ในอดีต
  if (status === "expired" || exp.getTime() < now.getTime()) {
    return "expired";
  }

  const diffMs = exp.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 60) {
    return "soon";
  }

  return "ok";
}

function statusBadgeVariant(status: CertStatus) {
  switch (status) {
    case "planned":
      return "outline";
    case "in_progress":
      return "secondary";
    case "passed":
      return "default";
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
}

function typeLabel(type: CertType) {
  switch (type) {
    case "exam":
      return "Exam";
    case "training":
      return "Training";
    case "other":
      return "Other";
    default:
      return type;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function CertificationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [certs, setCerts] = useState<CertRow[]>([]);
  const [categories, setCategories] = useState<CertCategoryRow[]>([]);

  // filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<CertType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<CertStatus | "all">("all");
  const [filterVendor, setFilterVendor] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // category management
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatSaving, setNewCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const [catRes, certRes] = await Promise.all([
        supabase
          .from("cert_categories")
          .select("id, name, slug")
          .order("sort_order", { ascending: true }),
        supabase
          .from("certs")
          .select(
            "id, cert_type, name, vendor, category_id, level, status, issue_date, expiry_date, credential_id, credential_url, score, highlight, badge_image_url"
          )
          .order("issue_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (catRes.error || certRes.error) {
        setError(
          catRes.error?.message ||
            certRes.error?.message ||
            "Failed to load certifications."
        );
        setLoading(false);
        return;
      }

      setCategories(catRes.data as CertCategoryRow[]);
      setCerts(certRes.data as CertRow[]);
      setLoading(false);
    };

    load();
  }, []);

  const vendors = useMemo(() => {
    const set = new Set<string>();
    certs.forEach((c) => set.add(c.vendor));
    return Array.from(set).sort();
  }, [certs]);

  const filteredCerts = useMemo(() => {
    return certs.filter((c) => {
      if (filterType !== "all" && c.cert_type !== filterType) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterVendor !== "all" && c.vendor !== filterVendor) return false;
      if (
        filterCategory !== "all" &&
        (c.category_id ?? "none") !== filterCategory
      )
        return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !(
            c.name.toLowerCase().includes(q) ||
            c.vendor.toLowerCase().includes(q) ||
            (c.level ?? "").toLowerCase().includes(q)
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [certs, filterType, filterStatus, filterVendor, filterCategory, search]);

  const getCategoryName = (id: string | null) => {
    if (!id) return "—";
    const cat = categories.find((c) => c.id === id);
    return cat?.name ?? "—";
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);

    const name = newCatName.trim();
    const slug = (newCatSlug || slugify(name)).trim();

    if (!name) {
      setCatError("Please enter category name.");
      return;
    }
    if (!slug) {
      setCatError("Please enter slug.");
      return;
    }

    setNewCatSaving(true);

    try {
      // หาค่า sort_order ถัดไปง่าย ๆ = max + 1
      const { data: existingCats, error: catLoadError } = await supabase
        .from("cert_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);

      if (catLoadError) {
        setCatError(catLoadError.message);
        setNewCatSaving(false);
        return;
      }

      const nextSort =
        existingCats && existingCats.length > 0
          ? (existingCats[0].sort_order ?? 0) + 1
          : 0;

      const { data: insertData, error: insertError } = await supabase
        .from("cert_categories")
        .insert({
          name,
          slug,
          sort_order: nextSort,
        })
        .select("id, name, slug, sort_order")
        .single();

      if (insertError) {
        setCatError(insertError.message);
        setNewCatSaving(false);
        return;
      }

      // อัปเดต state local ให้ list ขยายทันที
      setCategories((prev) =>
        [...prev, insertData as any].sort((a, b) => a.sort_order - b.sort_order)
      );

      // reset form
      setNewCatName("");
      setNewCatSlug("");
      setCatError(null);
      setNewCatSaving(false);
    } catch (err: any) {
      setCatError(err.message ?? "Unknown error");
      setNewCatSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Certifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your exams and training certificates in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Manage categories
              </Button>
            </DialogTrigger>

            {/* Dialog content อยู่ด้านล่างเดี๋ยวใส่ต่อ */}
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Manage certification categories</DialogTitle>
                <DialogDescription>
                  Group your certifications into buckets like Cloud, Network,
                  Security, Database, and more.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* list categories */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Existing categories
                  </p>
                  {categories.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No categories yet. Create your first one below.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto rounded-md border border-border/60">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/60">
                          <tr className="text-left">
                            <th className="px-2 py-1.5 w-[40%]">Name</th>
                            <th className="px-2 py-1.5 w-[40%]">Slug</th>
                            <th className="px-2 py-1.5 w-[20%] text-right">
                              Order
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories
                            .slice()
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((cat) => (
                              <tr
                                key={cat.id}
                                className="border-t border-border/40"
                              >
                                <td className="px-2 py-1.5 text-[11px]">
                                  {cat.name}
                                </td>
                                <td className="px-2 py-1.5 text-[11px] text-muted-foreground">
                                  {cat.slug}
                                </td>
                                <td className="px-2 py-1.5 text-[11px] text-right text-muted-foreground">
                                  {cat.sort_order ?? 0}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* add new category form */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <p className="text-xs font-medium text-muted-foreground">
                    Add new category
                  </p>
                  {catError && (
                    <p className="text-[11px] text-destructive">{catError}</p>
                  )}

                  <form className="space-y-2" onSubmit={handleCreateCategory}>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="catName">Name</Label>
                        <Input
                          id="catName"
                          className="h-8 text-xs"
                          placeholder="e.g. Cloud, Network, Security"
                          value={newCatName}
                          onChange={(e) => {
                            setNewCatName(e.target.value);
                            if (!newCatSlug) {
                              setNewCatSlug(slugify(e.target.value));
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="catSlug">Slug</Label>
                        <Input
                          id="catSlug"
                          className="h-8 text-xs"
                          placeholder="cloud, network, security"
                          value={newCatSlug}
                          onChange={(e) => setNewCatSlug(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter className="mt-2">
                      <Button type="submit" size="sm" disabled={newCatSaving}>
                        {newCatSaving ? "Saving…" : "Add category"}
                      </Button>
                    </DialogFooter>
                  </form>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            onClick={() => router.push("/admin/certifications/new")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add certification
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="bg-destructive/10 text-destructive border-none">
          <AlertTitle>Failed to load certifications</AlertTitle>
          <AlertDescription className="text-destructive/80">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters + Summary */}
      <Card className="bg-card/90 border border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Certification overview
              </CardTitle>
              <CardDescription>
                Filter by cert type, vendor, and status. Great for planning your
                learning roadmap.
              </CardDescription>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{certs.length} total</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                <span>Filters</span>
              </div>

              {/* cert type */}
              <Select
                value={filterType}
                onValueChange={(val) => setFilterType(val as any)}
              >
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* status */}
              <Select
                value={filterStatus}
                onValueChange={(val) => setFilterStatus(val as any)}
              >
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              {/* vendor */}
              <Select
                value={filterVendor}
                onValueChange={(val) => setFilterVendor(val)}
              >
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendors</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* category */}
              <Select
                value={filterCategory}
                onValueChange={(val) => setFilterCategory(val)}
              >
                <SelectTrigger className="h-8  w-40 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* search */}
            <div className="w-full md:w-60 ">
              <Input
                placeholder="Search name, vendor, level…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading certifications…
            </p>
          ) : filteredCerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No certifications match your filters yet.
            </p>
          ) : (
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[52px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue / Expiry</TableHead>
                    <TableHead className="text-right w-20">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCerts.map((cert) => {
                    const expiryState = getExpiryState(
                      cert.expiry_date,
                      cert.status
                    );

                    return (
                      <TableRow key={cert.id}>
                        {/* รูป / Badge */}
                        <TableCell>
                          <div className="w-9 h-9 rounded-md border border-border/60 bg-muted/40 overflow-hidden flex items-center justify-center">
                            {cert.badge_image_url ? (
                              <img
                                src={cert.badge_image_url}
                                alt={cert.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-muted-foreground px-1 text-center">
                                {cert.vendor.slice(0, 3).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* ชื่อ + level */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {cert.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {cert.level || ""}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">{cert.vendor}</TableCell>

                        <TableCell className="text-sm">
                          {getCategoryName(cert.category_id)}
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-2"
                          >
                            {typeLabel(cert.cert_type)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={statusBadgeVariant(cert.status)}
                            className="text-[10px] h-5 px-2 capitalize"
                          >
                            {cert.status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        {/* Issue / Expiry + warning */}
                        <TableCell className="text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span>{formatDate(cert.issue_date)}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-muted-foreground">
                                {formatDate(cert.expiry_date)}
                              </span>
                              {expiryState === "soon" && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 px-1.5 text-amber-500 border-amber-500/40"
                                >
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Soon
                                </Badge>
                              )}
                              {expiryState === "expired" && (
                                <Badge
                                  variant="destructive"
                                  className="text-[9px] h-4 px-1.5"
                                >
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Expired
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              router.push(`/admin/certifications/${cert.id}`)
                            }
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
