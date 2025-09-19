import { Bookmark, Category, Settings } from './types'

const STORAGE_KEYS = {
  BOOKMARKS: 'bookmarks',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
} as const

export const storage = {
  // Bookmarks
  getBookmarks: (): Bookmark[] => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS)
      if (!data) return []
      const bookmarks = JSON.parse(data)
      return bookmarks.map((bookmark: any) => ({
        ...bookmark,
        createdAt: new Date(bookmark.createdAt),
        updatedAt: new Date(bookmark.updatedAt),
      }))
    } catch (error) {
      console.error('Failed to get bookmarks:', error)
      return []
    }
  },

  setBookmarks: (bookmarks: Bookmark[]): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks))
    } catch (error) {
      console.error('Failed to save bookmarks:', error)
    }
  },

  // Categories
  getCategories: (): Category[] => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
      if (!data) return []
      const categories = JSON.parse(data)
      return categories.map((category: any) => ({
        ...category,
        createdAt: new Date(category.createdAt),
        updatedAt: new Date(category.updatedAt),
      }))
    } catch (error) {
      console.error('Failed to get categories:', error)
      return []
    }
  },

  setCategories: (categories: Category[]): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
    } catch (error) {
      console.error('Failed to save categories:', error)
    }
  },

  // Settings
  getSettings: (): Settings => {
    if (typeof window === 'undefined') return { layoutColumns: 2 }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (!data) return { layoutColumns: 2 }
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to get settings:', error)
      return { layoutColumns: 2 }
    }
  },

  setSettings: (settings: Settings): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  },

  // Clear all data
  clearAll: (): void => {
    if (typeof window === 'undefined') return
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Failed to clear storage:', error)
    }
  },
}