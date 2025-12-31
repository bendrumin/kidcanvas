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
      }
      artworks: {
        Row: {
          id: string
          family_id: string
          child_id: string
          image_url: string
          thumbnail_url: string
          title: string
          created_date: string
          child_age_months: number
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
          created_date: string
          child_age_months: number
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
          created_date?: string
          child_age_months?: number
          tags?: string[]
          ai_tags?: string[]
          ai_description?: string | null
          is_favorite?: boolean
          uploaded_by?: string
          uploaded_at?: string
        }
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
  }
}

// Convenience types
export type Family = Database['public']['Tables']['families']['Row']
export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type FamilyInvite = Database['public']['Tables']['family_invites']['Row']
export type Child = Database['public']['Tables']['children']['Row']
export type Artwork = Database['public']['Tables']['artworks']['Row']
export type Collection = Database['public']['Tables']['collections']['Row']
export type ShareLink = Database['public']['Tables']['share_links']['Row']

// Extended types with relations
export type ArtworkWithChild = Artwork & {
  child: Child
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

