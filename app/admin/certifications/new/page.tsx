"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { TriangleAlertIcon } from "lucide-react";

type CertType = "exam" | "training" | "other";
type CertStatus = "planned" | "in_progress" | "passed" | "expired";

type CertCategoryRow = {
  id: string;
  name: string;
  slug: string;
};

export default function NewCertificationPage() {
  const router = useRouter();

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CertCategoryRow[]>([]);

  // form state
  const [certType, setCertType] = useState<CertType>("exam");
  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState<CertStatus>("planned");
  const [issueDate, setIssueDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [credentialId, setCredentialId] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [score, setScore] = useState<string>("");
  const [highlight, setHighlight] = useState(false);
  const [notes, setNotes] = useState("");

  const [badgeFile, setBadgeFile] = useState<File | null>(null);
  const [badgePreview, setBadgePreview] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      setError(null);

      const { data, error } = await supabase
        .from("cert_categories")
        .select("id, name, slug")
        .order("sort_order", { ascending: true });

      if (error) {
        setError(error.message);
        setLoadingCategories(false);
        return;
      }

      setCategories(data as CertCategoryRow[]);
      setLoadingCategories(false);
    };

    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!name.trim()) {
        setError("Please enter certification name.");
        setSaving(false);
        return;
      }
      if (!vendor.trim()) {
        setError("Please enter vendor / organization.");
        setSaving(false);
        return;
      }

      // 1) ถ้ามีไฟล์รูป ให้ upload ไป storage ก่อน
      let badgeImageUrl: string | null = null;

      if (badgeFile) {
        const fileExt = badgeFile.name.split(".").pop() || "png";
        const safeName = slugify(name || "cert");
        const fileName = `badge-${safeName}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("cert-images") // 🟢 ชื่อ bucket
          .upload(fileName, badgeFile, {
            upsert: true,
          });

        if (uploadError) {
          setError("Upload badge image failed: " + uploadError.message);
          setSaving(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("cert-images")
          .getPublicUrl(uploadData.path);

        badgeImageUrl = publicUrlData.publicUrl;
      }

      // 2) สร้าง payload
      const payload: any = {
        cert_type: certType,
        name: name.trim(),
        vendor: vendor.trim(),
        category_id: categoryId || null,
        level: level || null,
        status,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        credential_id: credentialId || null,
        credential_url: credentialUrl || null,
        score: score ? Number(score) : null,
        highlight,
        notes: notes || null,
        badge_image_url: badgeImageUrl,
      };

      const { error } = await supabase.from("certs").insert(payload);

      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }

      router.push("/admin/certifications");
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
      setSaving(false);
    }
  };

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            New certification
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a new certification entry from exams or training.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/certifications")}
        >
          Back to list
        </Button>
      </div>

      <Card className="bg-card/90 border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Certification details</CardTitle>
          <CardDescription>
            Track both real exam certificates and training / course completions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <Alert className="mb-2 bg-destructive/10 text-destructive border-none">
                <TriangleAlertIcon className="h-4 w-4" />
                <AlertTitle>Failed to create certification</AlertTitle>
                <AlertDescription className="text-destructive/80">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Type + Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={certType}
                  onValueChange={(val) => setCertType(val as CertType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="training">Training / Course</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Use <span className="font-medium">Exam</span> for real
                  certification exams, and{" "}
                  <span className="font-medium">Training</span> for courses or
                  workshops.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as CertStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Helps you plan what to study next and monitor expirations.
                </p>
              </div>
            </div>

            {/* Name + Vendor */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Certification name</Label>
                <Input
                  id="name"
                  placeholder="e.g. CCNP ENCOR, OCI Foundations, ISC2 CC"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendor">Vendor / Organization</Label>
                <Input
                  id="vendor"
                  placeholder="Cisco, Oracle, ISC2, CompTIA, Microsoft..."
                  required
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                />
              </div>
            </div>

            {/* Category + Level */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={categoryId || "none"}
                  onValueChange={(val) => {
                    if (val === "none") {
                      setCategoryId("");
                    } else {
                      setCategoryId(val);
                    }
                  }}
                  disabled={loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingCategories
                          ? "Loading categories..."
                          : "Select category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-muted-foreground">
                  For example: Network, Cloud, Security, Database, System...
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="level">Level (optional)</Label>
                <Input
                  id="level"
                  placeholder="Foundations, Associate, Professional, Expert..."
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="issue">Issue date</Label>
                <Input
                  id="issue"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expiry">Expiry date (optional)</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Credential info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="credId">Credential ID (optional)</Label>
                <Input
                  id="credId"
                  placeholder="e.g. Certificate ID / Candidate ID"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="credUrl">Credential URL (optional)</Label>
                <Input
                  id="credUrl"
                  placeholder="https://..."
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Badge image */}
            <div className="space-y-1.5">
              <Label>Badge image (optional)</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md border border-dashed border-border/60 flex items-center justify-center overflow-hidden bg-muted/30">
                  {badgePreview ? (
                    // ถ้าอยากใช้ <Image /> ของ next ก็ได้ แต่ขอแบบง่ายก่อน
                    <img
                      src={badgePreview}
                      alt="Badge preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-muted-foreground text-center px-1">
                      No image
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Input
                    type="file"
                    accept="image/*"
                    className="h-8"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setBadgeFile(null);
                        setBadgePreview(null);
                        return;
                      }
                      setBadgeFile(file);
                      setBadgePreview(URL.createObjectURL(file));
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Optional. Upload certification badge/logo. Image will be
                    uploaded on save.
                  </p>
                </div>
              </div>
            </div>

            {/* Score + Highlight */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="score">Score (optional)</Label>
                <Input
                  id="score"
                  type="number"
                  min={0}
                  max={1000}
                  placeholder="e.g. 820"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between space-y-0 rounded-md border border-border/60 px-3 py-2.5">
                <div className="space-y-0.5">
                  <Label>Highlight in portfolio</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Mark this as a key certification to show in your public
                    profile later.
                  </p>
                </div>
                <Switch checked={highlight} onCheckedChange={setHighlight} />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Notes about this certification, attempts, next plan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/certifications")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create certification"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
