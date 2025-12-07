export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      certs: {
        Row: {
          badge_image_url: string | null
          category: string | null
          cert_type: Database["public"]["Enums"]["cert_kind"]
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiry_date: string | null
          highlight: boolean
          id: string
          issue_date: string | null
          level: string | null
          name: string
          notes: string | null
          score: number | null
          status: string
          updated_at: string
          vendor: string
        }
        Insert: {
          badge_image_url?: string | null
          category?: string | null
          cert_type?: Database["public"]["Enums"]["cert_kind"]
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          highlight?: boolean
          id?: string
          issue_date?: string | null
          level?: string | null
          name: string
          notes?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          vendor: string
        }
        Update: {
          badge_image_url?: string | null
          category?: string | null
          cert_type?: Database["public"]["Enums"]["cert_kind"]
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          highlight?: boolean
          id?: string
          issue_date?: string | null
          level?: string | null
          name?: string
          notes?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      doc_pages: {
        Row: {
          content_json: Json | null
          created_at: string
          excerpt: string | null
          id: string
          section_id: string | null
          slug: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content_json?: Json | null
          created_at?: string
          excerpt?: string | null
          id?: string
          section_id?: string | null
          slug: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content_json?: Json | null
          created_at?: string
          excerpt?: string | null
          id?: string
          section_id?: string | null
          slug?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_pages_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "doc_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_sections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string | null
          content_md: string | null
          cover_image_url: string | null
          created_at: string
          demo_url: string | null
          description: string | null
          finished_at: string | null
          github_url: string | null
          id: string
          key_features: string[] | null
          published_at: string | null
          slug: string
          started_at: string | null
          status: string
          tech_stack: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content_md?: string | null
          cover_image_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          finished_at?: string | null
          github_url?: string | null
          id?: string
          key_features?: string[] | null
          published_at?: string | null
          slug: string
          started_at?: string | null
          status?: string
          tech_stack?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content_md?: string | null
          cover_image_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          finished_at?: string | null
          github_url?: string | null
          id?: string
          key_features?: string[] | null
          published_at?: string | null
          slug?: string
          started_at?: string | null
          status?: string
          tech_stack?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cert_kind: "exam" | "training" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cert_kind: ["exam", "training", "other"],
    },
  },
} as const
