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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      artwork_comments: {
        Row: {
          artwork_id: string
          created_at: string | null
          id: string
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artwork_id: string
          created_at?: string | null
          id?: string
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artwork_id?: string
          created_at?: string | null
          id?: string
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_comments_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_reactions: {
        Row: {
          artwork_id: string
          created_at: string | null
          emoji_type: string
          id: string
          user_id: string
        }
        Insert: {
          artwork_id: string
          created_at?: string | null
          emoji_type: string
          id?: string
          user_id: string
        }
        Update: {
          artwork_id?: string
          created_at?: string | null
          emoji_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_reactions_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      artworks: {
        Row: {
          child_age_months: number | null
          child_id: string
          created_date: string
          description: string | null
          family_id: string
          id: string
          image_url: string
          is_favorite: boolean | null
          story: string | null
          tags: string[] | null
          thumbnail_url: string
          title: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          child_age_months?: number | null
          child_id: string
          created_date: string
          description?: string | null
          family_id: string
          id?: string
          image_url: string
          is_favorite?: boolean | null
          story?: string | null
          tags?: string[] | null
          thumbnail_url: string
          title: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          child_age_months?: number | null
          child_id?: string
          created_date?: string
          description?: string | null
          family_id?: string
          id?: string
          image_url?: string
          is_favorite?: boolean | null
          story?: string | null
          tags?: string[] | null
          thumbnail_url?: string
          title?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artworks_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artworks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar_color: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          family_id: string
          id: string
          name: string
        }
        Insert: {
          avatar_color?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          family_id: string
          id?: string
          name: string
        }
        Update: {
          avatar_color?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          family_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_artworks: {
        Row: {
          artwork_id: string
          collection_id: string
        }
        Insert: {
          artwork_id: string
          collection_id: string
        }
        Update: {
          artwork_id?: string
          collection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_artworks_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_artworks_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_artwork_id: string | null
          created_at: string | null
          family_id: string
          id: string
          name: string
        }
        Insert: {
          cover_artwork_id?: string | null
          created_at?: string | null
          family_id: string
          id?: string
          name: string
        }
        Update: {
          cover_artwork_id?: string | null
          created_at?: string | null
          family_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_cover_artwork_id_fkey"
            columns: ["cover_artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      family_invites: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          family_id: string
          id: string
          invited_email: string | null
          nickname: string | null
          role: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          family_id: string
          id?: string
          invited_email?: string | null
          nickname?: string | null
          role: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          family_id?: string
          id?: string
          invited_email?: string | null
          nickname?: string | null
          role?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          family_id: string
          id: string
          joined_at: string | null
          nickname: string | null
          role: string
          user_id: string
        }
        Insert: {
          family_id: string
          id?: string
          joined_at?: string | null
          nickname?: string | null
          role: string
          user_id: string
        }
        Update: {
          family_id?: string
          id?: string
          joined_at?: string | null
          nickname?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          family_id: string
          id: string
          password_hash: string | null
          resource_id: string
          type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          family_id: string
          id?: string
          password_hash?: string | null
          resource_id: string
          type: string
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          family_id?: string
          id?: string
          password_hash?: string | null
          resource_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_family_invite: {
        Args: { invite_code: string; member_nickname?: string }
        Returns: string
      }
      create_family_for_user: { Args: { family_name: string }; Returns: string }
      delete_my_account: { Args: never; Returns: undefined }
      get_artwork_reaction_counts: {
        Args: { artwork_uuid: string }
        Returns: {
          count: number
          emoji_type: string
        }[]
      }
      get_family_role: { Args: { family_uuid: string }; Returns: string }
      get_family_voice_stats: {
        Args: { family_uuid: string }
        Returns: {
          total_notes: number
          total_seconds: number
        }[]
      }
      get_user_subscription: {
        Args: { target_user_id: string }
        Returns: {
          current_period_end: string
          status: string
          tier: string
        }[]
      }
      is_family_member: { Args: { family_uuid: string }; Returns: boolean }
      user_has_reacted: {
        Args: { artwork_uuid: string; emoji: string }
        Returns: boolean
      }
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
  public: {
    Enums: {},
  },
} as const

// Convenience types
export type Family = Database['public']['Tables']['families']['Row']
export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type FamilyInvite = Database['public']['Tables']['family_invites']['Row']
export type Child = Database['public']['Tables']['children']['Row']
export type Artwork = Database['public']['Tables']['artworks']['Row']
export type Collection = Database['public']['Tables']['collections']['Row']
export type ArtworkReaction = Database['public']['Tables']['artwork_reactions']['Row']
export type ArtworkComment = Database['public']['Tables']['artwork_comments']['Row']
export type ShareLink = Database['public']['Tables']['share_links']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

// Extended types with relations
export type ArtworkWithChild = Artwork & {
  child: Child | null
}

export type FamilyMemberWithUser = FamilyMember & {
  user: {
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

// Collection with cover artwork
export type CollectionWithCover = Collection & {
  cover_artwork: {
    thumbnail_url: string
  } | null
}

// Family invite with family
export type FamilyInviteWithFamily = FamilyInvite & {
  families: Family | null
}

// Family member with family
export type FamilyMemberWithFamily = FamilyMember & {
  families: Family | null
}
