export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ListingType = 'good' | 'service'
export type ListingStatus = 'active' | 'sold' | 'closed' | 'removed'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export type Category =
  | 'textbooks'
  | 'furniture'
  | 'electronics'
  | 'clothing'
  | 'winter_gear'
  | 'other_goods'
  | 'tutoring'
  | 'moving'
  | 'cleaning'
  | 'snow_shovelling'
  | 'other_services'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          program: string | null
          year: string | null
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          program?: string | null
          year?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          program?: string | null
          year?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          seller_id: string
          title: string
          description: string
          price: number | null
          listing_type: ListingType
          category: Category
          status: ListingStatus
          location: string | null
          images: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          description: string
          price?: number | null
          listing_type: ListingType
          category: Category
          status?: ListingStatus
          location?: string | null
          images?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          description?: string
          price?: number | null
          listing_type?: ListingType
          category?: Category
          status?: ListingStatus
          location?: string | null
          images?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'listings_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          listing_id: string | null
          buyer_id: string
          seller_id: string
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id?: string | null
          buyer_id: string
          seller_id: string
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          last_message_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'conversations_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          reviewee_id: string
          listing_id: string
          rating: number
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          reviewee_id: string
          listing_id: string
          rating: number
          content?: string | null
          created_at?: string
        }
        Update: {
          content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_reviewer_id_fkey'
            columns: ['reviewer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_reviewee_id_fkey'
            columns: ['reviewee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          listing_id: string | null
          reported_user_id: string | null
          reason: string
          status: ReportStatus
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          listing_id?: string | null
          reported_user_id?: string | null
          reason: string
          status?: ReportStatus
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          status?: ReportStatus
          admin_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_reported_user_id_fkey'
            columns: ['reported_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}
