import { create } from 'zustand'
import { Settings } from '@/lib/types'
import { storage } from '@/lib/storage'

interface SettingsStore {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  loadSettings: () => void
  resetSettings: () => void
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

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,

  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates }
      storage.setSettings(newSettings)
      return { settings: newSettings }
    })
  },


  loadSettings: () => {
    try {
      const settings = storage.getSettings()
      const mergedSettings: Settings = {
        ...defaultSettings,
        ...settings,
        enableMasonryGrid: settings.enableMasonryGrid ?? defaultSettings.enableMasonryGrid,
        displayOptions: {
          showUrl: settings.displayOptions?.showUrl ?? defaultSettings.displayOptions!.showUrl,
          showDescription: settings.displayOptions?.showDescription ?? defaultSettings.displayOptions!.showDescription,
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