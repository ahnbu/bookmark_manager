import { create } from 'zustand'
import { Bookmark, Category } from '@/lib/types'
import { storage } from '@/lib/storage'

interface BookmarkStore {
  bookmarks: Bookmark[]
  categories: Category[]
  isLoading: boolean
  error: string | null

  // Bookmark actions
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void
  deleteBookmark: (id: string) => void
  moveBookmark: (id: string, newCategoryId: string, newOrder?: number) => void

  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  moveCategoryOrder: (id: string, newOrder: number) => void

  // Data loading
  loadData: () => void
  importBookmarks: (bookmarks: Bookmark[], categories?: Category[]) => void

  // Utilities
  getBookmarksByCategory: (categoryId: string) => Bookmark[]
  getCategoryById: (id: string) => Category | undefined
  getBookmarkById: (id: string) => Bookmark | undefined
}

export const useBookmarkStore = create<BookmarkStore>((set, get) => ({
  bookmarks: [],
  categories: [],
  isLoading: false,
  error: null,

  addBookmark: (bookmarkData) => {
    const now = new Date()
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      ...bookmarkData,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => {
      const newBookmarks = [...state.bookmarks, bookmark]
      storage.setBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    })
  },

  updateBookmark: (id, updates) => {
    set((state) => {
      const newBookmarks = state.bookmarks.map((bookmark) =>
        bookmark.id === id
          ? { ...bookmark, ...updates, updatedAt: new Date() }
          : bookmark
      )
      storage.setBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    })
  },

  deleteBookmark: (id) => {
    set((state) => {
      const newBookmarks = state.bookmarks.filter((bookmark) => bookmark.id !== id)
      storage.setBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    })
  },

  moveBookmark: (id, newCategoryId, newOrder) => {
    set((state) => {
      const bookmark = state.bookmarks.find(b => b.id === id)
      if (!bookmark) return state

      let newBookmarks = [...state.bookmarks]

      // 다른 카테고리로 이동하는 경우
      if (bookmark.categoryId !== newCategoryId) {
        const targetCategoryBookmarks = newBookmarks.filter(
          b => b.categoryId === newCategoryId && b.id !== id
        )
        const finalOrder = newOrder ?? targetCategoryBookmarks.length

        newBookmarks = newBookmarks.map(b =>
          b.id === id
            ? { ...b, categoryId: newCategoryId, order: finalOrder, updatedAt: new Date() }
            : b
        )
      } else if (newOrder !== undefined) {
        // 같은 카테고리 내에서 순서 변경
        const categoryBookmarks = newBookmarks
          .filter(b => b.categoryId === newCategoryId)
          .sort((a, b) => a.order - b.order)

        const currentIndex = categoryBookmarks.findIndex(b => b.id === id)
        const targetIndex = Math.min(newOrder, categoryBookmarks.length - 1)

        if (currentIndex !== targetIndex) {
          // 순서 재정렬
          const reorderedBookmarks = [...categoryBookmarks]
          const [movedBookmark] = reorderedBookmarks.splice(currentIndex, 1)
          reorderedBookmarks.splice(targetIndex, 0, movedBookmark)

          // 새로운 순서 적용
          reorderedBookmarks.forEach((bookmark, index) => {
            const bookmarkIndex = newBookmarks.findIndex(b => b.id === bookmark.id)
            if (bookmarkIndex !== -1) {
              newBookmarks[bookmarkIndex] = {
                ...newBookmarks[bookmarkIndex],
                order: index,
                updatedAt: new Date()
              }
            }
          })
        }
      }

      storage.setBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    })
  },

  addCategory: (categoryData) => {
    const now = new Date()
    const category: Category = {
      id: crypto.randomUUID(),
      ...categoryData,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => {
      const newCategories = [...state.categories, category]
      storage.setCategories(newCategories)
      return { categories: newCategories }
    })
  },

  updateCategory: (id, updates) => {
    set((state) => {
      const newCategories = state.categories.map((category) =>
        category.id === id
          ? { ...category, ...updates, updatedAt: new Date() }
          : category
      )
      storage.setCategories(newCategories)
      return { categories: newCategories }
    })
  },

  deleteCategory: (id) => {
    set((state) => {
      // 카테고리 삭제 시 해당 카테고리의 북마크들도 함께 삭제
      const newCategories = state.categories.filter((category) => category.id !== id)
      const newBookmarks = state.bookmarks.filter((bookmark) => bookmark.categoryId !== id)

      storage.setCategories(newCategories)
      storage.setBookmarks(newBookmarks)

      return { categories: newCategories, bookmarks: newBookmarks }
    })
  },

  moveCategoryOrder: (id, newOrder) => {
    set((state) => {
      const category = state.categories.find(c => c.id === id)
      if (!category) return state

      const sortedCategories = state.categories.sort((a, b) => a.order - b.order)
      const currentIndex = sortedCategories.findIndex(c => c.id === id)
      const targetIndex = Math.min(Math.max(newOrder, 0), sortedCategories.length - 1)

      if (currentIndex === targetIndex) return state

      // 순서 재정렬
      const reorderedCategories = [...sortedCategories]
      const [movedCategory] = reorderedCategories.splice(currentIndex, 1)
      reorderedCategories.splice(targetIndex, 0, movedCategory)

      // 새로운 순서 적용
      const updatedCategories = reorderedCategories.map((cat, index) => ({
        ...cat,
        order: index,
        updatedAt: new Date()
      }))

      storage.setCategories(updatedCategories)
      return { categories: updatedCategories }
    })
  },

  loadData: () => {
    set({ isLoading: true, error: null })
    try {
      const bookmarks = storage.getBookmarks()
      const categories = storage.getCategories()

      // 기본 카테고리가 없으면 생성
      if (categories.length === 0) {
        const defaultCategory: Category = {
          id: crypto.randomUUID(),
          name: '기본',
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        storage.setCategories([defaultCategory])
        set({ categories: [defaultCategory] })
      } else {
        set({ categories })
      }

      set({ bookmarks, isLoading: false })
    } catch (error) {
      set({ error: '데이터 로딩 중 오류가 발생했습니다.', isLoading: false })
    }
  },

  importBookmarks: (bookmarks, categories = []) => {
    set((state) => {
      const allCategories = [...state.categories, ...categories]
      const allBookmarks = [...state.bookmarks, ...bookmarks]

      storage.setCategories(allCategories)
      storage.setBookmarks(allBookmarks)

      return { categories: allCategories, bookmarks: allBookmarks }
    })
  },

  getBookmarksByCategory: (categoryId) => {
    const { bookmarks } = get()
    return bookmarks
      .filter((bookmark) => bookmark.categoryId === categoryId)
      .sort((a, b) => a.order - b.order)
  },

  getCategoryById: (id) => {
    const { categories } = get()
    return categories.find((category) => category.id === id)
  },

  getBookmarkById: (id) => {
    const { bookmarks } = get()
    return bookmarks.find((bookmark) => bookmark.id === id)
  },
}))