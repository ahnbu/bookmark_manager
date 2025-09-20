import { supabase, DbBookmark, DbCategory, DbSettings } from './supabase'
import { Bookmark, Category, Settings } from './types'

// Type converters
const dbBookmarkToBookmark = (dbBookmark: DbBookmark): Bookmark => ({
  id: dbBookmark.id,
  name: dbBookmark.name,
  url: dbBookmark.url,
  description: dbBookmark.description,
  favicon: dbBookmark.favicon,
  categoryId: dbBookmark.category_id,
  order: dbBookmark.order,
  isBlacklisted: dbBookmark.is_blacklisted,
  customFavicon: dbBookmark.custom_favicon,
  isFavorite: dbBookmark.is_favorite,
  isHidden: dbBookmark.is_hidden,
  createdAt: new Date(dbBookmark.created_at),
  updatedAt: new Date(dbBookmark.updated_at),
})

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

const dbCategoryToCategory = (dbCategory: DbCategory): Category => ({
  id: dbCategory.id,
  name: dbCategory.name,
  color: dbCategory.color,
  order: dbCategory.order,
  isHidden: dbCategory.is_hidden,
  createdAt: new Date(dbCategory.created_at),
  updatedAt: new Date(dbCategory.updated_at),
})

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
  return data.map(dbCategoryToCategory)
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
  return data.map(dbBookmarkToBookmark)
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