export interface Bookmark {
  id: string
  name: string
  url: string
  // description?: string
  description?: string | null 
  favicon?: string
  categoryId: string
  order: number
  createdAt: Date
  updatedAt: Date
  isBlacklisted?: boolean // 기본 파비콘으로 표시할지 여부
  customFavicon?: string // 사용자가 업로드한 커스텀 파비콘 (base64)
  isFavorite?: boolean // 즐겨찾기 여부
  isHidden?: boolean // 숨기기 여부
}

export interface Category {
  id: string
  name: string
  color?: string
  order: number
  isHidden?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  layoutColumns: 1 | 2 | 3
  enableMasonryGrid?: boolean
  theme?: 'light' | 'dark' | 'system'
  displayOptions?: {
    showUrl: boolean
    showDescription: boolean
    hiddenCategories?: string[] // netlify 빌드에러 해결 : Settings 인터페이스 내의 displayOptions 타입에 hiddenCategories 속성이 정의되어 있지 않는 문제 해결
  }
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