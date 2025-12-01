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
      attendances: {
        Row: {
          certificate_url: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          event_id: string
          id: string
          selfie_url: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          event_id: string
          id?: string
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          event_id?: string
          id?: string
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_image_url: string | null
          created_at: string
          created_by_id: string
          description: string
          end_time: string
          id: string
          latitude: number | null
          location_name: string
          longitude: number | null
          radius_meters: number
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          created_by_id: string
          description: string
          end_time: string
          id?: string
          latitude?: number | null
          location_name: string
          longitude?: number | null
          radius_meters?: number
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          created_by_id?: string
          description?: string
          end_time?: string
          id?: string
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          radius_meters?: number
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_posts: {
        Row: {
          content: string
          created_at: string
          event_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_post_templates: {
        Row: {
          base_text: string
          created_at: string
          id: string
          type: Database["public"]["Enums"]["post_type"]
          user_id: string
        }
        Insert: {
          base_text: string
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["post_type"]
          user_id: string
        }
        Update: {
          base_text?: string
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["post_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_post_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          buyer_id: string | null
          category: Database["public"]["Enums"]["listing_category"]
          condition: Database["public"]["Enums"]["listing_condition"]
          created_at: string
          description: string
          expected_price: number
          id: string
          images: string[] | null
          original_price: number
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          category: Database["public"]["Enums"]["listing_category"]
          condition: Database["public"]["Enums"]["listing_condition"]
          created_at?: string
          description: string
          expected_price: number
          id?: string
          images?: string[] | null
          original_price: number
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          category?: Database["public"]["Enums"]["listing_category"]
          condition?: Database["public"]["Enums"]["listing_condition"]
          created_at?: string
          description?: string
          expected_price?: number
          id?: string
          images?: string[] | null
          original_price?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          branch: string | null
          college: string | null
          created_at: string
          email: string
          id: string
          linkedin_url: string | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          year: number | null
        }
        Insert: {
          bio?: string | null
          branch?: string | null
          college?: string | null
          created_at?: string
          email: string
          id: string
          linkedin_url?: string | null
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          year?: number | null
        }
        Update: {
          bio?: string | null
          branch?: string | null
          college?: string | null
          created_at?: string
          email?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          status: Database["public"]["Enums"]["transaction_status"]
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "STUDENT" | "ADMIN"
      attendance_status: "pending" | "approved" | "rejected"
      listing_category:
        | "bag"
        | "calculator"
        | "books"
        | "electronics"
        | "others"
      listing_condition: "new" | "like_new" | "used"
      listing_status: "active" | "sold"
      post_type: "hackathon" | "event" | "project" | "achievement"
      transaction_status: "pending" | "paid" | "failed"
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
      app_role: ["STUDENT", "ADMIN"],
      attendance_status: ["pending", "approved", "rejected"],
      listing_category: ["bag", "calculator", "books", "electronics", "others"],
      listing_condition: ["new", "like_new", "used"],
      listing_status: ["active", "sold"],
      post_type: ["hackathon", "event", "project", "achievement"],
      transaction_status: ["pending", "paid", "failed"],
    },
  },
} as const
