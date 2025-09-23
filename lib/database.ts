import { supabase, DbBookmark, DbCategory, DbSettings } from './supabase'
import { Bookmark, Category, Settings } from './types'

// Safe string sanitizer
const sanitizeString = (value: any, fallback: string = ''): string => {
  if (typeof value !== 'string') return fallback

  // 제어문자와 잘못된 문자 제거
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFD]/g, '')
    .trim()
}

// Safe URL validator
const sanitizeUrl = (value: any): string => {
  const cleaned = sanitizeString(value)
  if (!cleaned) return ''

  try {
    // URL 유효성 검사
    new URL(cleaned)
    return cleaned
  } catch {
    console.warn('⚠️ 잘못된 URL 형식:', value)
    return cleaned // URL이 잘못되어도 문자열로는 유지
  }
}

// Type converters
const dbBookmarkToBookmark = (dbBookmark: DbBookmark): Bookmark => {
  try {
    return {
      id: sanitizeString(dbBookmark.id),
      name: sanitizeString(dbBookmark.name),
      url: sanitizeUrl(dbBookmark.url),
      description: sanitizeString(dbBookmark.description),
      favicon: dbBookmark.favicon ? sanitizeString(dbBookmark.favicon) : undefined,
      categoryId: sanitizeString(dbBookmark.category_id),
      order: typeof dbBookmark.order === 'number' ? dbBookmark.order : 0,
      isBlacklisted: Boolean(dbBookmark.is_blacklisted),
      customFavicon: dbBookmark.custom_favicon ? sanitizeString(dbBookmark.custom_favicon) : undefined,
      isFavorite: Boolean(dbBookmark.is_favorite),
      isHidden: Boolean(dbBookmark.is_hidden),
      createdAt: new Date(dbBookmark.created_at),
      updatedAt: new Date(dbBookmark.updated_at),
    }
  } catch (error) {
    console.error('❌ dbBookmarkToBookmark 변환 실패:', error, dbBookmark)
    throw new Error(`북마크 데이터 변환 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const bookmarkToDbBookmark = (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Omit<DbBookmark, 'id' | 'created_at' | 'updated_at'> => ({
  name: bookmark.name,
  url: bookmark.url,
  description: bookmark.description,
  favicon: bookmark.favicon,
  category_id: bookmark.categoryId,
  order: bookmark.order,
  is_blacklisted: bookmark.isBlacklisted,
  custom_favicon: bookmark.customFavicon,
  is_favorite: bookmark.isFavorite,
  is_hidden: bookmark.isHidden,
})

const dbCategoryToCategory = (dbCategory: DbCategory): Category => {
  try {
    return {
      id: sanitizeString(dbCategory.id),
      name: sanitizeString(dbCategory.name),
      color: dbCategory.color ? sanitizeString(dbCategory.color) : undefined,
      order: typeof dbCategory.order === 'number' ? dbCategory.order : 0,
      isHidden: Boolean(dbCategory.is_hidden),
      createdAt: new Date(dbCategory.created_at),
      updatedAt: new Date(dbCategory.updated_at),
    }
  } catch (error) {
    console.error('❌ dbCategoryToCategory 변환 실패:', error, dbCategory)
    throw new Error(`카테고리 데이터 변환 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const categoryToDbCategory = (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Omit<DbCategory, 'id' | 'created_at' | 'updated_at'> => ({
  name: category.name,
  color: category.color,
  order: category.order,
  is_hidden: category.isHidden,
})

const dbSettingsToSettings = (dbSettings: DbSettings): Settings => ({
  layoutColumns: dbSettings.layout_columns as 1 | 2 | 3,
  enableMasonryGrid: dbSettings.enable_masonry_grid,
  theme: dbSettings.theme as 'light' | 'dark' | 'system',
  displayOptions: {
    showUrl: dbSettings.show_url,
    showDescription: dbSettings.show_description,
  },
})

const settingsToDbSettings = (settings: Settings): Omit<DbSettings, 'id' | 'created_at' | 'updated_at'> => ({
  layout_columns: settings.layoutColumns,
  enable_masonry_grid: settings.enableMasonryGrid ?? false,
  theme: settings.theme ?? 'system',
  show_url: settings.displayOptions?.showUrl ?? true,
  show_description: settings.displayOptions?.showDescription ?? true,
})

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order', { ascending: true })

  if (error) throw error

  const categories: Category[] = []
  const failedItems: any[] = []

  for (const [index, dbCategory] of (data || []).entries()) {
    try {
      const category = dbCategoryToCategory(dbCategory)
      categories.push(category)
    } catch (conversionError) {
      console.error(`❌ 카테고리 인덱스 ${index} 변환 실패:`, conversionError, dbCategory)
      failedItems.push({ index, dbCategory, error: conversionError })
    }
  }

  if (failedItems.length > 0) {
    console.warn(`⚠️ ${failedItems.length}개 카테고리 변환 실패. 나머지 ${categories.length}개는 정상 로드됨`)
  }

  return categories
}

export const createCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryToDbCategory(category))
    .select()
    .single()

  if (error) throw error
  return dbCategoryToCategory(data)
}

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.color !== undefined) updateData.color = updates.color
  if (updates.order !== undefined) updateData.order = updates.order
  if (updates.isHidden !== undefined) updateData.is_hidden = updates.isHidden

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return dbCategoryToCategory(data)
}

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Bookmarks
export const getBookmarks = async (): Promise<Bookmark[]> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .order('order', { ascending: true })

  if (error) throw error

  const bookmarks: Bookmark[] = []
  const failedItems: any[] = []

  for (const [index, dbBookmark] of (data || []).entries()) {
    try {
      const bookmark = dbBookmarkToBookmark(dbBookmark)
      bookmarks.push(bookmark)
    } catch (conversionError) {
      console.error(`❌ 북마크 인덱스 ${index} 변환 실패:`, conversionError, dbBookmark)
      failedItems.push({ index, dbBookmark, error: conversionError })
    }
  }

  if (failedItems.length > 0) {
    console.warn(`⚠️ ${failedItems.length}개 북마크 변환 실패. 나머지 ${bookmarks.length}개는 정상 로드됨`)
  }

  return bookmarks
}

export const createBookmark = async (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bookmark> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert(bookmarkToDbBookmark(bookmark))
    .select()
    .single()

  if (error) throw error
  return dbBookmarkToBookmark(data)
}

export const updateBookmark = async (id: string, updates: Partial<Bookmark>): Promise<Bookmark> => {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.url !== undefined) updateData.url = updates.url
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.favicon !== undefined) updateData.favicon = updates.favicon
  if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId
  if (updates.order !== undefined) updateData.order = updates.order
  if (updates.isBlacklisted !== undefined) updateData.is_blacklisted = updates.isBlacklisted
  if (updates.customFavicon !== undefined) updateData.custom_favicon = updates.customFavicon
  if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite
  if (updates.isHidden !== undefined) updateData.is_hidden = updates.isHidden

  const { data, error } = await supabase
    .from('bookmarks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return dbBookmarkToBookmark(data)
}

export const deleteBookmark = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Bulk operations
export const updateMultipleBookmarks = async (updates: { id: string; updates: Partial<Bookmark> }[]): Promise<void> => {
  const promises = updates.map(({ id, updates }) => updateBookmark(id, updates))
  await Promise.all(promises)
}

// Settings
export const getSettings = async (): Promise<Settings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found
      return null
    }
    throw error
  }
  return dbSettingsToSettings(data)
}

export const createSettings = async (settings: Settings): Promise<Settings> => {
  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      id: '00000000-0000-0000-0000-000000000001', // Fixed ID for single settings record
      ...settingsToDbSettings(settings)
    })
    .select()
    .single()

  if (error) throw error
  return dbSettingsToSettings(data)
}

export const updateSettings = async (settings: Settings): Promise<Settings> => {
  // Use UPSERT to handle both INSERT and UPDATE automatically
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      id: '00000000-0000-0000-0000-000000000001', // Fixed ID for single settings record
      ...settingsToDbSettings(settings),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })
    .select()
    .single()

  if (error) throw error
  return dbSettingsToSettings(data)
}