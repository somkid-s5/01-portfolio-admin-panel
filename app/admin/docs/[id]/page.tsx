"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { JSONContent } from "@tiptap/core";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { slugify } from "@/lib/utils";
import { DocForm } from "../components/doc-form";
import { DocFormState, DocSection, DocStatus } from "../types";

export default function EditDocPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [sections, setSections] = useState<DocSection[]>([]);
  const [initialValues, setInitialValues] = useState<DocFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [secRes, docRes] = await Promise.all([
        db
          .from("doc_sections")
          .select("id, name, slug")
          .order("sort_order", { ascending: true }),
        db
          .from("doc_pages")
          .select("id, section_id, title, slug, excerpt, status, content_json")
          .eq("id", docId)
          .maybeSingle(),
      ]);

      if (secRes.error) {
        toast.error(secRes.error.message);
        setLoading(false);
        return;
      }
      if (docRes.error) {
        toast.error(docRes.error.message);
        setLoading(false);
        return;
      }
      if (!docRes.data) {
        toast.error("Docs page not found.");
        setLoading(false);
        return;
      }

      setSections(
        (secRes.data ?? []).map((row: unknown) => {
          const r = row as { id: string; name: string; slug: string };
          return {
            id: r.id,
            name: r.name,
            slug: r.slug,
          };
        })
      );

      setInitialValues({
        sectionId: docRes.data.section_id,
        title: docRes.data.title,
        slug: docRes.data.slug,
        excerpt: docRes.data.excerpt ?? "",
        status: docRes.data.status,
        contentJson: (docRes.data.content_json as JSONContent | null) ?? null,
      });

      setLoading(false);
    };

    if (docId) {
      load();
    }
  }, [docId, db]);

  const handleUpdate = async (payload: {
    section_id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    status: DocStatus;
    content_json: JSONContent | null;
  }) => {
    setSaving(true);

    try {
      const slugForName = (
        payload.slug || slugify(payload.title)
      ).toLowerCase();

      const { error: updateErr } = await db
        .from("doc_pages")
        .update({
          section_id: payload.section_id,
          title: payload.title,
          slug: slugForName,
          excerpt: payload.excerpt,
          status: payload.status,
          content_json: payload.content_json,
        })
        .eq("id", docId);

      if (updateErr) {
        throw updateErr;
      }

      toast.success("Docs page updated");
      router.push("/admin/docs");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update docs page";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !initialValues) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-6 w-40 bg-muted animate-pulse rounded-md" />
        <div className="h-[320px] bg-muted/40 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Documentation Page
          </h1>
          <p className="text-sm text-muted-foreground">
            Update metadata and rich content for this docs page.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/docs")}
        >
          Back to docs
        </Button>
      </div>

      <DocForm
        mode="edit"
        sections={sections}
        initialValues={initialValues}
        loadingSections={false}
        saving={saving}
        onCancel={() => router.push("/admin/docs")}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
