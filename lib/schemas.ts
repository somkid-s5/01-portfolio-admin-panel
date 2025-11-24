import { JSONContent } from "@tiptap/core"
import { z } from "zod"

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const DocStatusSchema = z.enum(["draft", "published", "archived"])

export const DocPageSchema = z.object({
  section_id: z.string().min(1, "Section is required"),
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(slugPattern, "Only lowercase letters, numbers, and hyphens are allowed"),
  excerpt: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? val : "")),
  status: DocStatusSchema,
  content_json: z
    .custom<JSONContent | null>(
      (val) => val === null || typeof val === "object",
      "Content must be valid JSON"
    )
    .nullable(),
})

export type DocPageInput = z.infer<typeof DocPageSchema>

export const ProjectStatusSchema = z.enum([
  "draft",
  "in_progress",
  "done",
  "archived",
])

export const ProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(slugPattern, "Only lowercase letters, numbers, and hyphens are allowed"),
  description: z.string().trim().optional(),
  status: ProjectStatusSchema,
  tech_stack: z.array(z.string().trim()).optional(),
  category: z.string().trim().optional(),
  cover_image_url: z.string().url().optional().or(z.literal("")).optional(),
  demo_url: z.string().url().optional().or(z.literal("")).optional(),
  github_url: z.string().url().optional().or(z.literal("")).optional(),
  key_features: z.array(z.string().trim()).optional(),
})

export type ProjectInput = z.infer<typeof ProjectSchema>
