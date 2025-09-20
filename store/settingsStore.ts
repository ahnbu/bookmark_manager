import { create } from 'zustand'
import { Settings } from '@/lib/types'
import { storage } from '@/lib/storage'
import { getSettings, updateSettings as dbUpdateSettings } from '@/lib/database'

interface SettingsStore {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => Promise<void>
  loadSettings: () => Promise<void>
  resetSettings: () => Promise<void>
  migrateToSupabase: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const defaultSettings: Settings = {
  layoutColumns: 2,
  enableMasonryGrid: false,
  theme: 'system',
  displayOptions: {
    showUrl: true,
    showDescription: true,
  },
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  error: null,

  updateSettings: async (updates) => {
    try {
      set({ isLoading: true, error: null })
      const currentSettings = get().settings
      const newSettings = { ...currentSettings, ...updates }

      // Update both Supabase and localStorage
      await dbUpdateSettings(newSettings)
      storage.setSettings(newSettings)

      set({ settings: newSettings, isLoading: false })
    } catch (error) {
      console.error('Failed to update settings:', error)
      set({ error: '설정 저장에 실패했습니다.', isLoading: false })

      // Fallback to localStorage only
      const currentSettings = get().settings
      const newSettings = { ...currentSettings, ...updates }
      storage.setSettings(newSettings)
      set({ settings: newSettings })
    }
  },

  loadSettings: async () => {
    try {
      set({ isLoading: true, error: null })

      // Try to load from Supabase first
      const cloudSettings = await getSettings()

      if (cloudSettings) {
        // Use cloud settings
        storage.setSettings(cloudSettings)
        set({ settings: cloudSettings, isLoading: false })
      } else {
        // Fallback to localStorage
        const localSettings = storage.getSettings()
        const mergedSettings: Settings = {
          ...defaultSettings,
          ...localSettings,
          enableMasonryGrid: localSettings.enableMasonryGrid ?? defaultSettings.enableMasonryGrid,
          displayOptions: {
            showUrl: localSettings.displayOptions?.showUrl ?? defaultSettings.displayOptions!.showUrl,
            showDescription: localSettings.displayOptions?.showDescription ?? defaultSettings.displayOptions!.showDescription,
          },
        }
        set({ settings: mergedSettings, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)

      // Fallback to localStorage
      try {
        const localSettings = storage.getSettings()
        const mergedSettings: Settings = {
          ...defaultSettings,
          ...localSettings,
          enableMasonryGrid: localSettings.enableMasonryGrid ?? defaultSettings.enableMasonryGrid,
          displayOptions: {
            showUrl: localSettings.displayOptions?.showUrl ?? defaultSettings.displayOptions!.showUrl,
            showDescription: localSettings.displayOptions?.showDescription ?? defaultSettings.displayOptions!.showDescription,
          },
        }
        set({ settings: mergedSettings, isLoading: false })
      } catch (localError) {
        console.error('Failed to load local settings:', localError)
        set({ settings: defaultSettings, isLoading: false, error: '설정 로드에 실패했습니다.' })
      }
    }
  },

  resetSettings: async () => {
    try {
      set({ isLoading: true, error: null })

      // Reset both Supabase and localStorage
      await dbUpdateSettings(defaultSettings)
      storage.setSettings(defaultSettings)

      set({ settings: defaultSettings, isLoading: false })
    } catch (error) {
      console.error('Failed to reset settings:', error)
      set({ error: '설정 초기화에 실패했습니다.', isLoading: false })

      // Fallback to localStorage only
      storage.setSettings(defaultSettings)
      set({ settings: defaultSettings })
    }
  },

  migrateToSupabase: async () => {
    try {
      set({ isLoading: true, error: null })

      // Check if cloud settings already exist
      const cloudSettings = await getSettings()
      if (cloudSettings) {
        set({ isLoading: false })
        return // Already migrated
      }

      // Get current localStorage settings
      const localSettings = storage.getSettings()
      const mergedSettings: Settings = {
        ...defaultSettings,
        ...localSettings,
        enableMasonryGrid: localSettings.enableMasonryGrid ?? defaultSettings.enableMasonryGrid,
        displayOptions: {
          showUrl: localSettings.displayOptions?.showUrl ?? defaultSettings.displayOptions!.showUrl,
          showDescription: localSettings.displayOptions?.showDescription ?? defaultSettings.displayOptions!.showDescription,
        },
      }

      // Migrate to Supabase
      await dbUpdateSettings(mergedSettings)
      set({ settings: mergedSettings, isLoading: false })

      console.log('Settings migrated to Supabase successfully')
    } catch (error) {
      console.error('Failed to migrate settings:', error)
      set({ error: '설정 마이그레이션에 실패했습니다.', isLoading: false })
    }
  },
}))