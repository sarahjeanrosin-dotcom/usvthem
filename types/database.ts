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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      battle_cards: {
        Row: {
          competitor_ids: string[]
          created_at: string
          decision_maker: string
          generated_content: Json
          id: string
          pdf_url: string | null
          product_category: string
          source_citations: Json
          user_id: string
          vertical: string
        }
        Insert: {
          competitor_ids: string[]
          created_at?: string
          decision_maker: string
          generated_content?: Json
          id?: string
          pdf_url?: string | null
          product_category: string
          source_citations?: Json
          user_id: string
          vertical: string
        }
        Update: {
          competitor_ids?: string[]
          created_at?: string
          decision_maker?: string
          generated_content?: Json
          id?: string
          pdf_url?: string | null
          product_category?: string
          source_citations?: Json
          user_id?: string
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          active: boolean
          created_at: string
          doc_count: number
          documentation_urls: Json
          help_center_url: string | null
          id: string
          is_genea: boolean
          last_refresh_at: string | null
          logo_url: string | null
          name: string
          notes: string | null
          product_news_urls: Json
          refresh_error: string | null
          refresh_status: string | null
          release_notes_urls: Json
          serper_terms: Json
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          doc_count?: number
          documentation_urls?: Json
          help_center_url?: string | null
          id?: string
          is_genea?: boolean
          last_refresh_at?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          product_news_urls?: Json
          refresh_error?: string | null
          refresh_status?: string | null
          release_notes_urls?: Json
          serper_terms?: Json
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          doc_count?: number
          documentation_urls?: Json
          help_center_url?: string | null
          id?: string
          is_genea?: boolean
          last_refresh_at?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          product_news_urls?: Json
          refresh_error?: string | null
          refresh_status?: string | null
          release_notes_urls?: Json
          serper_terms?: Json
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          competitor_id: string
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          source_url: string
          token_count: number | null
        }
        Insert: {
          competitor_id: string
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source_url: string
          token_count?: number | null
        }
        Update: {
          competitor_id?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source_url?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          can_create_battlecards: boolean
          can_edit_them: boolean
          can_edit_us: boolean
          can_manage_users: boolean
          can_view_history: boolean
          created_at: string
          id: string
        }
        Insert: {
          can_create_battlecards?: boolean
          can_edit_them?: boolean
          can_edit_us?: boolean
          can_manage_users?: boolean
          can_view_history?: boolean
          created_at?: string
          id: string
        }
        Update: {
          can_create_battlecards?: boolean
          can_edit_them?: boolean
          can_edit_us?: boolean
          can_manage_users?: boolean
          can_view_history?: boolean
          created_at?: string
          id?: string
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
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
