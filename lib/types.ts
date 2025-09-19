export interface Bookmark {
  id: string
  name: string
  url: string
  description?: string
  favicon?: string
  categoryId: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  color?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  layoutColumns: 1 | 2 | 3
  theme?: 'light' | 'dark' | 'system'
}

export interface BookmarkImport {
  title: string
  url: string
  children?: BookmarkImport[]
  type?: 'bookmark' | 'folder'
}

export interface DragEndEvent {
  active: {
    id: string
    data: {
      current?: {
        type: 'bookmark' | 'category'
        categoryId?: string
      }
    }
  }
  over: {
    id: string
    data: {
      current?: {
        type: 'bookmark' | 'category'
        categoryId?: string
      }
    }
  } | null
}