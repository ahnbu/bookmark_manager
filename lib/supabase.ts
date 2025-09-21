import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DbBookmark {
  id: string
  name: string
  url: string
  // description?: string
  description?: string | null
  favicon?: string
  category_id: string
  order: number
  is_blacklisted?: boolean
  custom_favicon?: string
  is_favorite?: boolean
  is_hidden?: boolean
  created_at: string
  updated_at: string
}

export interface DbCategory {
  id: string
  name: string
  color?: string
  order: number
  is_hidden?: boolean
  created_at: string
  updated_at: string
}

export interface DbSettings {
  id: string
  layout_columns: number
  enable_masonry_grid: boolean
  theme: string
  show_url: boolean
  show_description: boolean
  created_at: string
  updated_at: string
}