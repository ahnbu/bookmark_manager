'use client'

import { useEffect } from 'react'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { useSettingsStore } from '@/store/settingsStore'
import { DragDropProvider } from '@/components/DragDropProvider'
import { CategoryList } from '@/components/CategoryList'
import { AddCategory } from '@/components/AddCategory'
import { AddBookmark } from '@/components/AddBookmark'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Toaster } from '@/components/ui/toaster'
import { Bookmark } from 'lucide-react'

export default function Home() {
  const { categories, loadData, isLoading, migrateFavicons } = useBookmarkStore()
  const { settings, loadSettings } = useSettingsStore()

  useEffect(() => {
    const initializeApp = async () => {
      loadData()
      loadSettings()

      // 기존 북마크들의 favicon 마이그레이션 (백그라운드에서 실행)
      try {
        await migrateFavicons()
      } catch (error) {
        console.warn('Favicon migration failed:', error)
      }
    }

    initializeApp()
  }, [loadData, loadSettings, migrateFavicons])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </main>
    )
  }

  const getGridCols = () => {
    switch (settings.layoutColumns) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-1 md:grid-cols-2'
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      default:
        return 'grid-cols-1 md:grid-cols-2'
    }
  }

  return (
    <DragDropProvider>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto p-4 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <Bookmark className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">북마크 관리자</h1>
              </div>
              <p className="text-muted-foreground mt-1">
                브라우저 북마크를 효율적으로 관리하세요
              </p>
            </div>

            <div className="flex items-center gap-2">
              <SettingsPanel />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <AddCategory />
            <AddBookmark />
          </div>

          {/* Categories Grid */}
          {categories.length > 0 ? (
            <CategoryList categories={categories} gridCols={getGridCols()} />
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium mb-2">북마크가 없습니다</h3>
                <p className="text-muted-foreground mb-6">
                  새 카테고리를 만들거나 브라우저에서 북마크를 가져와 시작하세요.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <AddCategory />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </DragDropProvider>
  )
}