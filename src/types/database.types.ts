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
      downloads: {
        Row: {
          downloaded_at: string | null
          font_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          downloaded_at?: string | null
          font_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          downloaded_at?: string | null
          font_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_font_id_fkey"
            columns: ["font_id"]
            isOneToOne: false
            referencedRelation: "fonts"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          font_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          font_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          font_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_font_id_fkey"
            columns: ["font_id"]
            isOneToOne: false
            referencedRelation: "fonts"
            referencedColumns: ["id"]
          },
        ]
      }
      font_variants: {
        Row: {
          created_at: string
          font_id: string
          id: string
          order_index: number | null
          otf_url: string | null
          file_size_otf: number | null
          ttf_url: string | null
          file_size_ttf: number | null
          variant_name: string
          woff2_url: string | null
          file_size_woff2: number | null
          woff_url: string | null
          file_size_woff: number | null
        }
        Insert: {
          created_at?: string
          font_id: string
          id?: string
          order_index?: number | null
          otf_url?: string | null
          file_size_otf?: number | null
          ttf_url?: string | null
          file_size_ttf?: number | null
          variant_name: string
          woff2_url?: string | null
          file_size_woff2?: number | null
          woff_url?: string | null
          file_size_woff?: number | null
        }
        Update: {
          created_at?: string
          font_id?: string
          id?: string
          order_index?: number | null
          otf_url?: string | null
          file_size_otf?: number | null
          ttf_url?: string | null
          file_size_ttf?: number | null
          variant_name?: string
          woff2_url?: string | null
          file_size_woff2?: number | null
          woff_url?: string | null
          file_size_woff?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "font_variants_font_id_fkey"
            columns: ["font_id"]
            isOneToOne: false
            referencedRelation: "fonts"
            referencedColumns: ["id"]
          },
        ]
      }
      fonts: {
        Row: {
          category: string
          commercial_use: boolean | null
          created_at: string | null
          description: string | null
          designer: string
          downloads: number | null
          downloads_7d: number | null
          favorites_count: number | null
          file_size_woff2: number | null
          file_size_ttf: number | null
          file_size_otf: number | null
          file_size_woff: number | null
          glyph_count: number | null
          has_italic: boolean | null
          id: string
          is_featured: boolean | null
          is_trending: boolean | null
          is_editors_pick: boolean | null
          is_published: boolean | null
          license_type: string
          name: string
          preview_image_url: string | null
          slug: string
          tags: string[] | null
          updated_at: string | null
          weights: number[] | null
          woff2_url: string
          woff_url: string | null
          ttf_url: string | null
          otf_url: string | null
          zip_url: string
          gallery_images: string[] | null
          file_size_image_preview: number | null
          gallery_image_sizes: number[] | null
          uploaded_by: string
        }
        Insert: {
          category: string
          commercial_use?: boolean | null
          created_at?: string | null
          description?: string | null
          designer: string
          downloads?: number | null
          downloads_7d?: number | null
          favorites_count?: number | null
          file_size_woff2?: number | null
          file_size_ttf?: number | null
          file_size_otf?: number | null
          file_size_woff?: number | null
          glyph_count?: number | null
          has_italic?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_editors_pick?: boolean | null
          is_published?: boolean | null
          license_type: string
          name: string
          preview_image_url?: string | null
          slug: string
          tags?: string[] | null
          updated_at?: string | null
          weights?: number[] | null
          woff2_url: string
          zip_url: string
          gallery_images: string[] | null
        }
        Update: {
          category?: string
          commercial_use?: boolean | null
          created_at?: string | null
          description?: string | null
          designer?: string
          downloads?: number | null
          downloads_7d?: number | null
          favorites_count?: number | null
          file_size_woff2?: number | null
          file_size_ttf?: number | null
          file_size_otf?: number | null
          file_size_woff?: number | null
          glyph_count?: number | null
          has_italic?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_editors_pick?: boolean | null
          is_published?: boolean | null
          license_type?: string
          name?: string
          preview_image_url?: string | null
          slug?: string
          tags?: string[] | null
          updated_at?: string | null
          weights?: number[] | null
          woff2_url?: string
          zip_url?: string
          gallery_images?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
          username: string | null
          role: 'user' | 'member' | 'admin'
          membership_status: 'none' | 'pending' | 'approved' | 'rejected'
          website: string | null
          behance: string | null
          twitter: string | null
          instagram: string | null
          linkedin: string | null
          paypal_me: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          updated_at?: string | null
          role?: 'user' | 'member' | 'admin'
          membership_status?: 'none' | 'pending' | 'approved' | 'rejected'
          website?: string | null
          behance?: string | null
          twitter?: string | null
          instagram?: string | null
          linkedin?: string | null
          paypal_me?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
          role?: 'user' | 'member' | 'admin'
          membership_status?: 'none' | 'pending' | 'approved' | 'rejected'
          website?: string | null
          behance?: string | null
          twitter?: string | null
          instagram?: string | null
          linkedin?: string | null
          paypal_me?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_fonts: {
        Args: {
          query?: string
          filter_category?: string
          sort_by?: string
        }
        Returns: {
          font_data: Json
        }[]
      }
      update_downloads_count: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      update_favorites_count: {
        Args: Record<PropertyKey, never>
        Returns: unknown
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
