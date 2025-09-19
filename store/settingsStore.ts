import { create } from 'zustand'
import { Settings } from '@/lib/types'
import { storage } from '@/lib/storage'

interface SettingsStore {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  toggleCategoryVisibility: (categoryId: string) => void
  loadSettings: () => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  layoutColumns: 2,
  theme: 'system',
  displayOptions: {
    showUrl: true,
    showDescription: true,
    hiddenCategories: [],
  },
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,

  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates }
      storage.setSettings(newSettings)
      return { settings: newSettings }
    })
  },

  toggleCategoryVisibility: (categoryId) => {
    set((state) => {
      const currentHidden = state.settings.displayOptions?.hiddenCategories || []
      const isHidden = currentHidden.includes(categoryId)

      const newHiddenCategories = isHidden
        ? currentHidden.filter(id => id !== categoryId)
        : [...currentHidden, categoryId]

      const newSettings = {
        ...state.settings,
        displayOptions: {
          ...state.settings.displayOptions,
          showUrl: state.settings.displayOptions?.showUrl ?? true,
          showDescription: state.settings.displayOptions?.showDescription ?? true,
          hiddenCategories: newHiddenCategories,
        },
      }

      storage.setSettings(newSettings)
      return { settings: newSettings }
    })
  },

  loadSettings: () => {
    try {
      const settings = storage.getSettings()
      const mergedSettings = {
        ...defaultSettings,
        ...settings,
        displayOptions: {
          ...defaultSettings.displayOptions,
          ...settings.displayOptions,
        },
      }
      set({ settings: mergedSettings })
    } catch (error) {
      console.error('Failed to load settings:', error)
      set({ settings: defaultSettings })
    }
  },

  resetSettings: () => {
    storage.setSettings(defaultSettings)
    set({ settings: defaultSettings })
  },
}))