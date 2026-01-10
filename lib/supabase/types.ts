export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          created_by?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          role: 'owner' | 'parent' | 'member' | 'viewer'
          nickname: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          role: 'owner' | 'parent' | 'member' | 'viewer'
          nickname?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string
          role?: 'owner' | 'parent' | 'member' | 'viewer'
          nickname?: string | null
          joined_at?: string
        }
        Relationships: []
      }
      family_invites: {
        Row: {
          id: string
          family_id: string
          code: string
          role: 'parent' | 'member' | 'viewer'
          nickname: string | null
          invited_email: string | null
          expires_at: string
          used_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          code: string
          role: 'parent' | 'member' | 'viewer'
          nickname?: string | null
          invited_email?: string | null
          expires_at?: string
          used_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          code?: string
          role?: 'parent' | 'member' | 'viewer'
          nickname?: string | null
          invited_email?: string | null
          expires_at?: string
          used_at?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      children: {
        Row: {
          id: string
          family_id: string
          name: string
          birth_date: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          birth_date: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          birth_date?: string
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      artworks: {
        Row: {
          id: string
          family_id: string
          child_id: string
          image_url: string
          thumbnail_url: string
          title: string
          story: string | null
          moment_photo_url: string | null
          created_date: string
          child_age_months: number | null
          tags: string[]
          ai_tags: string[]
          ai_description: string | null
          is_favorite: boolean
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          family_id: string
          child_id: string
          image_url: string
          thumbnail_url: string
          title: string
          story?: string | null
          moment_photo_url?: string | null
          created_date: string
          child_age_months?: number | null
          tags?: string[]
          ai_tags?: string[]
          ai_description?: string | null
          is_favorite?: boolean
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          child_id?: string
          image_url?: string
          thumbnail_url?: string
          title?: string
          story?: string | null
          moment_photo_url?: string | null
          created_date?: string
          child_age_months?: number | null
          tags?: string[]
          ai_tags?: string[]
          ai_description?: string | null
          is_favorite?: boolean
          uploaded_by?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      artwork_reactions: {
        Row: {
          id: string
          artwork_id: string
          user_id: string
          emoji_type: '❤️' | '😍' | '🎨' | '👏' | '🌟'
          created_at: string
        }
        Insert: {
          id?: string
          artwork_id: string
          user_id: string
          emoji_type: '❤️' | '😍' | '🎨' | '👏' | '🌟'
          created_at?: string
        }
        Update: {
          id?: string
          artwork_id?: string
          user_id?: string
          emoji_type?: '❤️' | '😍' | '🎨' | '👏' | '🌟'
          created_at?: string
        }
        Relationships: []
      }
      artwork_comments: {
        Row: {
          id: string
          artwork_id: string
          user_id: string
          text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artwork_id: string
          user_id: string
          text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artwork_id?: string
          user_id?: string
          text?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          id: string
          family_id: string
          name: string
          cover_artwork_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          cover_artwork_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          cover_artwork_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      collection_artworks: {
        Row: {
          collection_id: string
          artwork_id: string
        }
        Insert: {
          collection_id: string
          artwork_id: string
        }
        Update: {
          collection_id?: string
          artwork_id?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          id: string
          family_id: string
          code: string
          type: 'artwork' | 'collection'
          resource_id: string
          password_hash: string | null
          expires_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          code: string
          type: 'artwork' | 'collection'
          resource_id: string
          password_hash?: string | null
          expires_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          code?: string
          type?: 'artwork' | 'collection'
          resource_id?: string
          password_hash?: string | null
          expires_at?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_id: 'free' | 'family' | 'pro'
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          billing_interval: 'month' | 'year' | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_id?: 'free' | 'family' | 'pro'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          billing_interval?: 'month' | 'year' | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_id?: 'free' | 'family' | 'pro'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          billing_interval?: 'month' | 'year' | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_family_for_user: {
        Args: {
          family_name: string
        }
        Returns: string
      }
      accept_family_invite: {
        Args: {
          invite_code: string
          member_nickname?: string | null
        }
        Returns: string
      }
      is_family_member: {
        Args: {
          family_uuid: string
        }
        Returns: boolean
      }
      get_family_role: {
        Args: {
          family_uuid: string
        }
        Returns: string
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
