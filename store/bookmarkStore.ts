import { create } from 'zustand'
import { Bookmark, Category } from '@/lib/types'
import { storage } from '@/lib/storage'
import { loadFaviconWithCache, forceRefreshFavicon } from '@/lib/faviconCache'
import {
  getBookmarks,
  getCategories,
  createBookmark,
  updateBookmark as dbUpdateBookmark,
  deleteBookmark as dbDeleteBookmark,
  createCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  updateMultipleBookmarks
} from '@/lib/database'

interface BookmarkStore {
  bookmarks: Bookmark[]
  categories: Category[]
  isLoading: boolean
  error: string | null

  // Bookmark actions
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateBookmark: (id: string, updates: Partial<Bookmark>) => Promise<void>
  deleteBookmark: (id: string) => Promise<void>
  moveBookmark: (id: string, newCategoryId: string, newOrder?: number) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  toggleBookmarkVisibility: (id: string) => Promise<void>

  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  duplicateCategory: (id: string) => Promise<void>
  moveCategoryOrder: (id: string, newOrder: number) => Promise<void>
  toggleCategoryVisibility: (id: string) => Promise<void>

  // Data loading
  loadData: () => Promise<void>
  importBookmarks: (bookmarks: Bookmark[], categories?: Category[], replaceMode?: boolean) => Promise<void>

  // Migration
  migrateFromLocalStorage: () => Promise<void>
  migrateFavicons: () => Promise<void>

  // Favicon management
  refreshFaviconsForCategory: (categoryId: string) => Promise<void>

  // Utilities
  getBookmarksByCategory: (categoryId: string) => Bookmark[]
  getHiddenBookmarksByCategory: (categoryId: string) => Bookmark[]
  getVisibleCategories: () => Category[]
  getFilteredCategories: (selectedFilters: string[]) => Category[]
  getCategoryById: (id: string) => Category | undefined
  getBookmarkById: (id: string) => Bookmark | undefined
}

export const useBookmarkStore = create<BookmarkStore>((set, get) => ({
  bookmarks: [],
  categories: [],
  isLoading: false,
  error: null,

  addBookmark: async (bookmarkData) => {
    try {
      const bookmark = await createBookmark(bookmarkData)
      set((state) => ({
        bookmarks: [...state.bookmarks, bookmark]
      }))
    } catch (error) {
      console.error('Failed to add bookmark:', error)
      set({ error: '북마크 추가에 실패했습니다.' })
    }
  },

  // updateBookmark: async (id, updates) => {
  //   try {
  //     const updatedBookmark = await dbUpdateBookmark(id, updates)
  //     set((state) => ({
  //       bookmarks: state.bookmarks.map((bookmark) =>
  //         bookmark.id === id ? updatedBookmark : bookmark
  //       )
  //     }))
  //   } catch (error) {
  //     console.error('Failed to update bookmark:', error)
  //     set({ error: '북마크 수정에 실패했습니다.' })
  //   }
  // },

  updateBookmark: async (id, updates) => {
    const originalBookmarks = get().bookmarks;
    const originalBookmark = originalBookmarks.find(b => b.id === id);

    if (!originalBookmark) {
      console.error('❌ 북마크를 찾을 수 없습니다:', id);
      set({ error: '업데이트할 북마크를 찾을 수 없습니다.' });
      return;
    }

    // 1. 낙관적 UI 업데이트 (사용자 경험 향상을 위해 즉시 반영)
    // console.log(`🔄 북마크 ${id} 낙관적 업데이트 시작...`);
    set((state) => ({
      bookmarks: state.bookmarks.map((bookmark) =>
        bookmark.id === id
          ? { ...bookmark, ...updates }
          : bookmark
      )
    }));

    try {
      // 2. DB 업데이트 (await 추가로 실제 완료까지 대기)
      // console.log(`📝 북마크 ${id} DB 업데이트 중...`);
      const updatedBookmark = await dbUpdateBookmark(id, updates);

      // 3. DB 업데이트 성공 시 정확한 데이터로 다시 업데이트
      set((state) => ({
        bookmarks: state.bookmarks.map((bookmark) =>
          bookmark.id === id ? updatedBookmark : bookmark
        )
      }));

      // console.log(`✅ 북마크 ${id} 업데이트 완료`);
    } catch (error) {
      console.error(`❌ 북마크 ${id} DB 업데이트 실패, UI 롤백 중:`, error);

      // 4. 실패 시 원래 상태로 롤백
      set({
        bookmarks: originalBookmarks,
        error: '북마크 수정에 실패했습니다. 변경사항이 취소되었습니다.'
      });

      // SyntaxError 특별 처리
      if (error instanceof SyntaxError) {
        console.error('📍 북마크 업데이트 중 SyntaxError 발생:', {
          bookmarkId: id,
          updates: updates,
          error: error.message,
          stack: error.stack
        });
        set({ error: '데이터 형식 오류로 북마크 수정에 실패했습니다.' });
      }
    }
  },

  deleteBookmark: async (id) => {
    try {
      await dbDeleteBookmark(id)
      set((state) => ({
        bookmarks: state.bookmarks.filter((bookmark) => bookmark.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
      set({ error: '북마크 삭제에 실패했습니다.' })
    }
  },

  moveBookmark: async (id, newCategoryId, newOrder) => {
    try {
      const { bookmarks } = get()
      const bookmark = bookmarks.find(b => b.id === id)
      if (!bookmark) return

      let updates: Partial<Bookmark> = {}

      // 다른 카테고리로 이동하는 경우
      if (bookmark.categoryId !== newCategoryId) {
        const targetCategoryBookmarks = bookmarks.filter(
          b => b.categoryId === newCategoryId && b.id !== id
        )
        const finalOrder = newOrder ?? targetCategoryBookmarks.length
        updates = { categoryId: newCategoryId, order: finalOrder }
      } else if (newOrder !== undefined) {
        // 같은 카테고리 내에서 순서 변경
        const categoryBookmarks = bookmarks
          .filter(b => b.categoryId === newCategoryId)
          .sort((a, b) => a.order - b.order)

        const currentIndex = categoryBookmarks.findIndex(b => b.id === id)
        const targetIndex = Math.min(newOrder, categoryBookmarks.length - 1)

        if (currentIndex !== targetIndex) {
          // 순서 재정렬을 위한 일괄 업데이트
          const reorderedBookmarks = [...categoryBookmarks]
          const [movedBookmark] = reorderedBookmarks.splice(currentIndex, 1)
          reorderedBookmarks.splice(targetIndex, 0, movedBookmark)

          const bulkUpdates = reorderedBookmarks.map((bookmark, index) => ({
            id: bookmark.id,
            updates: { order: index }
          }))

          await updateMultipleBookmarks(bulkUpdates)

          // 상태 업데이트
          set((state) => ({
            bookmarks: state.bookmarks.map((bookmark) => {
              const update = bulkUpdates.find(u => u.id === bookmark.id)
              return update ? { ...bookmark, order: update.updates.order! } : bookmark
            })
          }))
          return
        }
      }

      if (Object.keys(updates).length > 0) {
        await get().updateBookmark(id, updates)
      }
    } catch (error) {
      console.error('Failed to move bookmark:', error)
      set({ error: '북마크 이동에 실패했습니다.' })
    }
  },

  toggleFavorite: async (id) => {
    try {
      const { bookmarks } = get()
      const bookmark = bookmarks.find(b => b.id === id)
      if (!bookmark) return

      const newIsFavorite = !bookmark.isFavorite
      await get().updateBookmark(id, { isFavorite: newIsFavorite })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      set({ error: '즐겨찾기 변경에 실패했습니다.' })
    }
  },

  toggleBookmarkVisibility: async (id) => {
    try {
      const { bookmarks } = get()
      const bookmark = bookmarks.find(b => b.id === id)
      if (!bookmark) return

      const newIsHidden = !bookmark.isHidden
      await get().updateBookmark(id, { isHidden: newIsHidden })
    } catch (error) {
      console.error('Failed to toggle bookmark visibility:', error)
      set({ error: '북마크 숨기기 변경에 실패했습니다.' })
    }
  },

  addCategory: async (categoryData) => {
    try {
      const category = await createCategory(categoryData)
      set((state) => ({
        categories: [...state.categories, category]
      }))
    } catch (error) {
      console.error('Failed to add category:', error)
      set({ error: '카테고리 추가에 실패했습니다.' })
    }
  },

  updateCategory: async (id, updates) => {
    try {
      const updatedCategory = await dbUpdateCategory(id, updates)
      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id ? updatedCategory : category
        )
      }))
    } catch (error) {
      console.error('Failed to update category:', error)
      set({ error: '카테고리 수정에 실패했습니다.' })
    }
  },

  deleteCategory: async (id) => {
    try {
      await dbDeleteCategory(id)
      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
        bookmarks: state.bookmarks.filter((bookmark) => bookmark.categoryId !== id)
      }))
    } catch (error) {
      console.error('Failed to delete category:', error)
      set({ error: '카테고리 삭제에 실패했습니다.' })
    }
  },

  duplicateCategory: async (id) => {
    try {
      const { categories, bookmarks } = get()
      const originalCategory = categories.find((category) => category.id === id)
      if (!originalCategory) return

      // 카테고리 복제
      const duplicatedCategory = await createCategory({
        name: `${originalCategory.name} (복사본)`,
        order: categories.length,
        color: originalCategory.color,
      })

      // 해당 카테고리의 북마크들도 복제
      const originalBookmarks = bookmarks.filter((bookmark) => bookmark.categoryId === id)
      const duplicatedBookmarks = await Promise.all(
        originalBookmarks.map(async (bookmark) => {
          const { id: _, createdAt, updatedAt, ...bookmarkData } = bookmark
          return await createBookmark({
            ...bookmarkData,
            categoryId: duplicatedCategory.id,
          })
        })
      )

      set((state) => ({
        categories: [...state.categories, duplicatedCategory],
        bookmarks: [...state.bookmarks, ...duplicatedBookmarks]
      }))
    } catch (error) {
      console.error('Failed to duplicate category:', error)
      set({ error: '카테고리 복제에 실패했습니다.' })
    }
  },

  moveCategoryOrder: async (id, newOrder) => {
    try {
      const { categories } = get()
      const category = categories.find(c => c.id === id)
      if (!category) return

      const sortedCategories = categories.sort((a, b) => a.order - b.order)
      const currentIndex = sortedCategories.findIndex(c => c.id === id)
      const targetIndex = Math.min(Math.max(newOrder, 0), sortedCategories.length - 1)

      if (currentIndex === targetIndex) return

      // 순서 재정렬
      const reorderedCategories = [...sortedCategories]
      const [movedCategory] = reorderedCategories.splice(currentIndex, 1)
      reorderedCategories.splice(targetIndex, 0, movedCategory)

      // 모든 카테고리의 순서를 업데이트
      const updates = reorderedCategories.map((cat, index) => ({
        id: cat.id,
        updates: { order: index }
      }))

      await Promise.all(updates.map(({ id, updates }) => dbUpdateCategory(id, updates)))

      // 상태 업데이트
      set((state) => ({
        categories: state.categories.map((cat) => {
          const update = updates.find(u => u.id === cat.id)
          return update ? { ...cat, order: update.updates.order! } : cat
        })
      }))
    } catch (error) {
      console.error('Failed to move category:', error)
      set({ error: '카테고리 순서 변경에 실패했습니다.' })
    }
  },

  toggleCategoryVisibility: async (id) => {
    try {
      const { categories } = get()
      const category = categories.find(c => c.id === id)
      if (!category) return

      const newIsHidden = !category.isHidden
      await get().updateCategory(id, { isHidden: newIsHidden })
    } catch (error) {
      console.error('Failed to toggle category visibility:', error)
      set({ error: '카테고리 숨기기 변경에 실패했습니다.' })
    }
  },

  loadData: async () => {
    set({ isLoading: true, error: null })
    try {
      // console.log('🔄 데이터 로딩 시작...')

      // 개별적으로 로드하여 어느 부분에서 오류가 발생하는지 추적
      let bookmarks: Bookmark[] = []
      let categories: Category[] = []

      try {
        // console.log('📚 북마크 데이터 로딩 중...')
        bookmarks = await getBookmarks()
        // console.log(`✅ 북마크 ${bookmarks.length}개 로딩 완료`)

        // 각 북마크의 데이터 무결성 검사
        bookmarks.forEach((bookmark, index) => {
          try {
            // JSON 문자열이 포함된 필드가 있다면 파싱 테스트
            if (bookmark.name && typeof bookmark.name === 'string') {
              // name에 특수문자나 제어문자가 있는지 확인
              if (bookmark.name.includes('\u0000') || bookmark.name.includes('\ufffd')) {
                console.warn(`⚠️ 북마크 ${bookmark.id}의 name에 잘못된 문자 발견:`, bookmark.name)
              }
            }
          } catch (bookmarkError) {
            console.error(`❌ 북마크 ${bookmark.id} (인덱스: ${index}) 데이터 검증 실패:`, bookmarkError, bookmark)
          }
        })
      } catch (bookmarkError) {
        console.error('❌ 북마크 로딩 실패:', bookmarkError)
        if (bookmarkError instanceof SyntaxError) {
          console.error('📍 북마크 데이터에서 SyntaxError 발생. 손상된 JSON 데이터가 있을 수 있습니다.')
        }
        // 북마크 로딩이 실패해도 카테고리는 로드 시도
      }

      try {
        // console.log('📁 카테고리 데이터 로딩 중...')
        categories = await getCategories()
        // console.log(`✅ 카테고리 ${categories.length}개 로딩 완료`)

        // 각 카테고리의 데이터 무결성 검사
        categories.forEach((category, index) => {
          try {
            if (category.name && typeof category.name === 'string') {
              if (category.name.includes('\u0000') || category.name.includes('\ufffd')) {
                console.warn(`⚠️ 카테고리 ${category.id}의 name에 잘못된 문자 발견:`, category.name)
              }
            }
          } catch (categoryError) {
            console.error(`❌ 카테고리 ${category.id} (인덱스: ${index}) 데이터 검증 실패:`, categoryError, category)
          }
        })
      } catch (categoryError) {
        console.error('❌ 카테고리 로딩 실패:', categoryError)
        if (categoryError instanceof SyntaxError) {
          console.error('📍 카테고리 데이터에서 SyntaxError 발생. 손상된 JSON 데이터가 있을 수 있습니다.')
        }
      }

      // 기본 카테고리가 없으면 생성
      let finalCategories = categories
      if (categories.length === 0) {
        // console.log('📝 기본 카테고리 생성 중...')
        try {
          const defaultCategory = await createCategory({
            name: '기본',
            order: 0,
          })
          finalCategories = [defaultCategory]
          // console.log('✅ 기본 카테고리 생성 완료')
        } catch (defaultCategoryError) {
          console.error('❌ 기본 카테고리 생성 실패:', defaultCategoryError)
        }
      }

      console.log(`🎉 데이터 로딩 완료 - 북마크: ${bookmarks.length}, 카테고리: ${finalCategories.length}`)

      set({
        bookmarks,
        categories: finalCategories,
        isLoading: false
      })
    } catch (error) {
      console.error('💥 loadData 전체 실패:', error)
      if (error instanceof SyntaxError) {
        console.error('📍 SyntaxError 상세 정보:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      }
      set({ error: '데이터 로딩 중 심각한 오류가 발생했습니다. 브라우저 개발자 도구 콘솔을 확인해주세요.', isLoading: false })
    }
  },

  importBookmarks: async (bookmarks, categories = [], replaceMode = false) => {
    try {
      set({ isLoading: true })

      // replace 모드일 때 기존 데이터 삭제
      if (replaceMode) {
        const { bookmarks: existingBookmarks, categories: existingCategories } = get()

        // 기존 북마크와 카테고리 삭제
        await Promise.all([
          ...existingBookmarks.map(bookmark => dbDeleteBookmark(bookmark.id)),
          ...existingCategories.map(category => dbDeleteCategory(category.id))
        ])

        set({ bookmarks: [], categories: [] })
      }

      // 카테고리 ID 매핑 테이블 생성
      const categoryIdMap: Record<string, string> = {}

      // 카테고리 먼저 생성
      const createdCategories = await Promise.all(
        categories.map(async (category) => {
          const { id: oldId, createdAt, updatedAt, ...categoryData } = category
          const newCategory = await createCategory(categoryData)
          categoryIdMap[oldId] = newCategory.id
          return newCategory
        })
      )

      // 북마크 생성 시 카테고리 ID 매핑 적용
      const createdBookmarks = await Promise.all(
        bookmarks.map(async (bookmark) => {
          const { id: _, createdAt, updatedAt, categoryId: oldCategoryId, ...bookmarkData } = bookmark
          const newCategoryId = categoryIdMap[oldCategoryId] || oldCategoryId
          return await createBookmark({
            ...bookmarkData,
            categoryId: newCategoryId,
          })
        })
      )

      set((state) => ({
        categories: replaceMode ? createdCategories : [...state.categories, ...createdCategories],
        bookmarks: replaceMode ? createdBookmarks : [...state.bookmarks, ...createdBookmarks],
        isLoading: false
      }))
    } catch (error) {
      console.error('Failed to import bookmarks:', error)
      set({ error: '북마크 가져오기에 실패했습니다.', isLoading: false })
    }
  },

  migrateFromLocalStorage: async () => {
    try {
      set({ isLoading: true })

      // LocalStorage에서 데이터 읽기
      const localBookmarks = storage.getBookmarks()
      const localCategories = storage.getCategories()

      if (localBookmarks.length === 0 && localCategories.length === 0) {
        set({ isLoading: false })
        return
      }

      // 카테고리 먼저 마이그레이션
      const categoryIdMap: Record<string, string> = {}
      const createdCategories = await Promise.all(
        localCategories.map(async (category) => {
          const { id: oldId, createdAt, updatedAt, ...categoryData } = category
          const newCategory = await createCategory(categoryData)
          categoryIdMap[oldId] = newCategory.id
          return newCategory
        })
      )

      // 북마크 마이그레이션 (카테고리 ID 매핑)
      const createdBookmarks = await Promise.all(
        localBookmarks.map(async (bookmark) => {
          const { id: _, createdAt, updatedAt, categoryId: oldCategoryId, ...bookmarkData } = bookmark
          const newCategoryId = categoryIdMap[oldCategoryId] || oldCategoryId
          return await createBookmark({
            ...bookmarkData,
            categoryId: newCategoryId,
          })
        })
      )

      set({
        categories: createdCategories,
        bookmarks: createdBookmarks,
        isLoading: false
      })

      // LocalStorage 클리어 (선택사항)
      // storage.clearAll()
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error)
      set({ error: '로컬 데이터 마이그레이션에 실패했습니다.', isLoading: false })
    }
  },

  migrateFavicons: async () => {
    try {
      // console.log('🔄 Favicon 마이그레이션 시작...')
      const { bookmarks } = get()
      const bookmarksToUpdate: Array<{ id: string; favicon: string | undefined }> = []

      // console.log(`📊 총 ${bookmarks.length}개 북마크 검사 중...`)

      // 기존 favicon URL을 가진 북마크들을 캐시 시스템으로 마이그레이션
      for (const [index, bookmark] of bookmarks.entries()) {
        try {
          // 북마크 데이터 무결성 검사
          if (!bookmark.id || typeof bookmark.id !== 'string') {
            console.warn(`⚠️ 북마크 인덱스 ${index}에 잘못된 ID:`, bookmark)
            continue
          }

          if (!bookmark.url || typeof bookmark.url !== 'string') {
            console.warn(`⚠️ 북마크 ${bookmark.id}에 잘못된 URL:`, bookmark.url)
            continue
          }

          // URL에 특수문자나 제어문자가 있는지 확인
          if (bookmark.url.includes('\u0000') || bookmark.url.includes('\ufffd')) {
            console.warn(`⚠️ 북마크 ${bookmark.id}의 URL에 잘못된 문자 발견:`, bookmark.url)
            continue
          }

          if (bookmark.favicon && bookmark.favicon.startsWith('http')) {
            // console.log(`🔄 북마크 ${bookmark.id} favicon 마이그레이션 중... (${index + 1}/${bookmarks.length})`)
            try {
              // 기존 URL 방식의 favicon을 캐시 시스템으로 변환
              const cachedFavicon = await loadFaviconWithCache(bookmark.url)
              bookmarksToUpdate.push({
                id: bookmark.id,
                favicon: cachedFavicon || undefined
              })
              // console.log(`✅ 북마크 ${bookmark.id} favicon 마이그레이션 성공`)
            } catch (faviconError) {
              console.warn(`⚠️ 북마크 ${bookmark.id} favicon 마이그레이션 실패:`, faviconError)
              // 실패한 경우 undefined로 설정
              bookmarksToUpdate.push({
                id: bookmark.id,
                favicon: undefined
              })
            }
          }
        } catch (bookmarkProcessError) {
          console.error(`❌ 북마크 ${bookmark?.id || index} 처리 중 오류:`, bookmarkProcessError, bookmark)
          if (bookmarkProcessError instanceof SyntaxError) {
            console.error('📍 북마크 처리 중 SyntaxError 발생:', {
              bookmarkId: bookmark?.id,
              error: bookmarkProcessError.message,
              bookmark: bookmark
            })
          }
        }
      }

      // 업데이트가 필요한 북마크들을 일괄 업데이트
      if (bookmarksToUpdate.length > 0) {
        // console.log(`📝 ${bookmarksToUpdate.length}개 북마크 일괄 업데이트 중...`)
        try {
          const updates = bookmarksToUpdate.map(({ id, favicon }) => ({
            id,
            updates: { favicon }
          }))

          await updateMultipleBookmarks(updates)

          set((state) => ({
            bookmarks: state.bookmarks.map((bookmark) => {
              const update = bookmarksToUpdate.find(u => u.id === bookmark.id)
              return update ? { ...bookmark, favicon: update.favicon } : bookmark
            })
          }))

          // console.log(`✅ Favicon 마이그레이션 완료 - ${bookmarksToUpdate.length}개 업데이트됨`)
        } catch (updateError) {
          console.error('❌ 북마크 일괄 업데이트 실패:', updateError)
          if (updateError instanceof SyntaxError) {
            console.error('📍 북마크 업데이트 중 SyntaxError 발생:', updateError.message)
          }
        }
      } else {
        // console.log('ℹ️ 마이그레이션할 favicon이 없습니다.')
      }
    } catch (error) {
      console.error('💥 migrateFavicons 전체 실패:', error)
      if (error instanceof SyntaxError) {
        console.error('📍 SyntaxError 상세 정보:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      }
    }
  },

  refreshFaviconsForCategory: async (categoryId: string) => {
    const { getBookmarksByCategory } = get()
    const targetBookmarks = getBookmarksByCategory(categoryId)

    if (targetBookmarks.length === 0) {
      console.log(`ℹ️ 카테고리 ${categoryId}에 새로고침할 북마크가 없습니다.`)
      return
    }

    // console.log(`🔄 카테고리 ${categoryId}의 파비콘 ${targetBookmarks.length}개 새로고침 시작...`)

    try {
      // 각 북마크에 대해 강제 새로고침 실행
      const refreshPromises = targetBookmarks.map(async (bookmark) => {
        try {
          // console.log(`🔄 북마크 ${bookmark.name} 파비콘 새로고침 중...`)
          const newFavicon = await forceRefreshFavicon(bookmark.url)
          return {
            id: bookmark.id,
            updates: { favicon: newFavicon || undefined }
          }
        } catch (error) {
          console.warn(`⚠️ 북마크 ${bookmark.name} 파비콘 새로고침 실패:`, error)
          return {
            id: bookmark.id,
            updates: { favicon: undefined }
          }
        }
      })

      const updates = await Promise.all(refreshPromises)

      // DB에 일괄 업데이트
      // console.log(`📝 ${updates.length}개 북마크 파비콘 DB 업데이트 중...`)
      await updateMultipleBookmarks(updates)

      // Zustand 상태 업데이트 (UI 리렌더링 트리거)
      set((state) => ({
        bookmarks: state.bookmarks.map((bookmark) => {
          const update = updates.find(u => u.id === bookmark.id)
          return update ? { ...bookmark, ...update.updates } : bookmark
        })
      }))

      // console.log(`✅ 카테고리 ${categoryId} 파비콘 새로고침 완료!`)
    } catch (error) {
      console.error(`❌ 카테고리 ${categoryId} 파비콘 새로고침 실패:`, error)
      set({ error: '파비콘 새로고침에 실패했습니다.' })

      if (error instanceof SyntaxError) {
        console.error('📍 파비콘 새로고침 중 SyntaxError 발생:', {
          categoryId: categoryId,
          error: error.message,
          stack: error.stack
        })
      }
    }
  },

  getBookmarksByCategory: (categoryId) => {
    const { bookmarks } = get()
    return bookmarks
      .filter((bookmark) => bookmark.categoryId === categoryId && !bookmark.isHidden)
      .sort((a, b) => {
        // 즐겨찾기 우선 정렬
        const aIsFavorite = a.isFavorite || false
        const bIsFavorite = b.isFavorite || false

        if (aIsFavorite && !bIsFavorite) return -1
        if (!aIsFavorite && bIsFavorite) return 1

        // 같은 즐겨찾기 상태면 order로 정렬
        return a.order - b.order
      })
  },

  getHiddenBookmarksByCategory: (categoryId) => {
    const { bookmarks } = get()
    return bookmarks
      .filter((bookmark) => bookmark.categoryId === categoryId && bookmark.isHidden)
      .sort((a, b) => a.order - b.order)
  },

  getVisibleCategories: () => {
    const { categories } = get()
    return categories
      .filter((category) => !category.isHidden)
      .sort((a, b) => a.order - b.order)
  },

  getFilteredCategories: (selectedFilters) => {
    const { categories } = get()
    const visibleCategories = categories
      .filter((category) => !category.isHidden)
      .sort((a, b) => a.order - b.order)

    if (selectedFilters.length === 0) {
      return visibleCategories
    }

    return visibleCategories.filter((category) =>
      selectedFilters.includes(category.id)
    )
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