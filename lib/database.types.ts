export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      doc_sections: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          sort_order?: number | null
        }
      }
      doc_pages: {
        Row: {
          id: string
          section_id: string
          title: string
          slug: string
          excerpt: string | null
          status: "draft" | "published" | "archived"
          content_json: Json | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          section_id: string
          title: string
          slug: string
          excerpt?: string | null
          status?: "draft" | "published" | "archived"
          content_json?: Json | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          section_id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          status?: "draft" | "published" | "archived"
          content_json?: Json | null
          sort_order?: number | null
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          status: "draft" | "in_progress" | "done" | "archived"
          tech_stack: string[] | null
          category: string | null
          cover_image_url: string | null
          demo_url: string | null
          github_url: string | null
          key_features: string[]
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          status?: "draft" | "in_progress" | "done" | "archived"
          tech_stack?: string[] | null
          category?: string | null
          cover_image_url?: string | null
          demo_url?: string | null
          github_url?: string | null
          key_features?: string[]
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          status?: "draft" | "in_progress" | "done" | "archived"
          tech_stack?: string[] | null
          category?: string | null
          cover_image_url?: string | null
          demo_url?: string | null
          github_url?: string | null
          key_features?: string[]
        }
      }
      cert_categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
      }
      certs: {
        Row: {
          id: string
          cert_type: "exam" | "training" | "other"
          name: string
          vendor: string
          category_id: string | null
          level: string | null
          status: "planned" | "in_progress" | "passed" | "expired"
          issue_date: string | null
          expiry_date: string | null
          credential_id: string | null
          credential_url: string | null
          score: number | null
          highlight: boolean
          notes: string | null
          badge_image_url: string | null
        }
        Insert: {
          id?: string
          cert_type: "exam" | "training" | "other"
          name: string
          vendor: string
          category_id?: string | null
          level?: string | null
          status?: "planned" | "in_progress" | "passed" | "expired"
          issue_date?: string | null
          expiry_date?: string | null
          credential_id?: string | null
          credential_url?: string | null
          score?: number | null
          highlight?: boolean
          notes?: string | null
          badge_image_url?: string | null
        }
        Update: {
          id?: string
          cert_type?: "exam" | "training" | "other"
          name?: string
          vendor?: string
          category_id?: string | null
          level?: string | null
          status?: "planned" | "in_progress" | "passed" | "expired"
          issue_date?: string | null
          expiry_date?: string | null
          credential_id?: string | null
          credential_url?: string | null
          score?: number | null
          highlight?: boolean
          notes?: string | null
          badge_image_url?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
