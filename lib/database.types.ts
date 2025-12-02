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
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string | null
          role: 'STUDENT' | 'ADMIN'
          student_id: string | null
          college_name: string | null
          branch: string | null
          graduation_year: number | null
          linkedin_url: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name?: string | null
          role?: 'STUDENT' | 'ADMIN'
          student_id?: string | null
          college_name?: string | null
          branch?: string | null
          graduation_year?: number | null
          linkedin_url?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          role?: 'STUDENT' | 'ADMIN'
          student_id?: string | null
          college_name?: string | null
          branch?: string | null
          graduation_year?: number | null
          linkedin_url?: string | null
          avatar_url?: string | null
        }
      }
      events: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          date: string
          time: string
          location: string
          organizer_id: string
          max_attendees: number | null
          image_url: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          date: string
          time: string
          location: string
          organizer_id: string
          max_attendees?: number | null
          image_url?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          date?: string
          time?: string
          location?: string
          organizer_id?: string
          max_attendees?: number | null
          image_url?: string | null
          is_active?: boolean
        }
      }
      event_attendees: {
        Row: {
          id: string
          created_at: string
          event_id: string
          user_id: string
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          user_id: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
        }
        Update: {
          id?: string
          created_at?: string
          event_id?: string
          user_id?: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
        }
      }
      marketplace_listings: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          price: number
          category: 'BAG' | 'CALCULATOR' | 'BOOKS' | 'ELECTRONICS' | 'OTHERS'
          condition: 'NEW' | 'LIKE_NEW' | 'USED'
          status: 'ACTIVE' | 'SOLD'
          seller_id: string
          buyer_id: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          price: number
          category: 'BAG' | 'CALCULATOR' | 'BOOKS' | 'ELECTRONICS' | 'OTHERS'
          condition: 'NEW' | 'LIKE_NEW' | 'USED'
          status?: 'ACTIVE' | 'SOLD'
          seller_id: string
          buyer_id?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          price?: number
          category?: 'BAG' | 'CALCULATOR' | 'BOOKS' | 'ELECTRONICS' | 'OTHERS'
          condition?: 'NEW' | 'LIKE_NEW' | 'USED'
          status?: 'ACTIVE' | 'SOLD'
          seller_id?: string
          buyer_id?: string | null
          image_url?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          title: string
          content: string
          type: 'HACKATHON' | 'GENERAL'
          author_id: string
          likes_count: number
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          content: string
          type: 'HACKATHON' | 'GENERAL'
          author_id: string
          likes_count?: number
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          content?: string
          type?: 'HACKATHON' | 'GENERAL'
          author_id?: string
          likes_count?: number
          image_url?: string | null
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