'use client'

import { useEffect } from 'react'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { useSettingsStore } from '@/store/settingsStore'
import { DragDropProvider } from '@/components/DragDropProvider'
import { CategoryList } from '@/components/CategoryList'
import { MasonryGrid } from '@/components/MasonryGrid'
import { CategoryFilter } from '@/components/CategoryFilter'
import { AddCategory } from '@/components/AddCategory'
import { AddBookmark } from '@/components/AddBookmark'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Toaster } from '@/components/ui/toaster'
import { Bookmark } from 'lucide-react'

export default function Home() {
  const { categories, getVisibleCategories, getFilteredCategories, loadData, isLoading, migrateFavicons } = useBookmarkStore()
  const { settings, selectedCategoryFilters, loadSettings, migrateToSupabase } = useSettingsStore()

  const visibleCategories = getVisibleCategories()
  const filteredCategories = getFilteredCategories(selectedCategoryFilters)

  useEffect(() => {
    const initializeApp = async () => {
      // console.log('🚀 앱 초기화 시작...')

      try {
        // 필수 데이터 로딩 - 실패하면 앱이 제대로 작동하지 않음
        // console.log('📊 필수 데이터 로딩 중...')
        await Promise.all([
          loadData().catch(dataError => {
            console.error('💥 데이터 로딩 실패:', dataError)
            throw new Error(`데이터 로딩 실패: ${dataError.message}`)
          }),
          loadSettings().catch(settingsError => {
            console.warn('⚠️ 설정 로딩 실패, 기본값 사용:', settingsError)
            // 설정 로딩 실패는 치명적이지 않음 (기본값 사용 가능)
          })
        ])

        // console.log('✅ 필수 데이터 로딩 완료')

        // 부가적인 마이그레이션 작업 - 백그라운드에서 실행, 실패해도 앱 사용 가능
        // console.log('🔄 백그라운드 마이그레이션 시작...')

        // 설정 마이그레이션 (비동기, 비차단)
        migrateToSupabase()
          .then(() => {
            // console.log('✅ 설정 마이그레이션 완료')
          })
          .catch(error => {
            console.warn('⚠️ 설정 마이그레이션 실패 (무시됨):', error)
            if (error instanceof SyntaxError) {
              console.error('📍 설정 마이그레이션 중 SyntaxError:', error.message)
            }
          })

        // Favicon 마이그레이션 (비동기, 비차단)
        migrateFavicons()
          .then(() => {
            // console.log('✅ Favicon 마이그레이션 완료')
          })
          .catch(error => {
            console.warn('⚠️ Favicon 마이그레이션 실패 (무시됨):', error)
            if (error instanceof SyntaxError) {
              console.error('📍 Favicon 마이그레이션 중 SyntaxError:', error.message)
            }
          })

      } catch (criticalError) {
        console.error('💥 앱 초기화 치명적 실패:', criticalError)

        if (criticalError instanceof SyntaxError) {
          console.error('📍 초기화 중 SyntaxError 발생:', {
            message: criticalError.message,
            stack: criticalError.stack,
            name: criticalError.name
          })
        }

        // 사용자에게 명확한 오류 상황 알림 (추후 에러 상태 관리 개선 시 활용)
        console.error('🔧 문제 해결 방법:', {
          '1': '브라우저 새로고침 시도',
          '2': '브라우저 개발자 도구 콘솔에서 상세 오류 확인',
          '3': '지속적인 문제 시 브라우저 캐시 및 로컬 스토리지 정리'
        })
      }

      // console.log('🎉 앱 초기화 프로세스 완료')
    }

    initializeApp()
  }, [loadData, loadSettings, migrateToSupabase, migrateFavicons])

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
            <div className="flex items-center gap-3">
              <Bookmark className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">북마크 관리자</h1>
            </div>

            <div className="flex items-center gap-2">
              <AddCategory />
              <AddBookmark />
              <SettingsPanel />
            </div>
          </div>

          {/* Category Filter */}
          <CategoryFilter />

          {/* Categories Grid */}
          {filteredCategories.length > 0 ? (
            settings.enableMasonryGrid ? (
              <MasonryGrid categories={filteredCategories} />
            ) : (
              <CategoryList categories={filteredCategories} gridCols={getGridCols()} />
            )
          ) : visibleCategories.length > 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium mb-2">선택한 카테고리에 북마크가 없습니다</h3>
                <p className="text-muted-foreground">
                  다른 카테고리를 선택하거나 전체 보기를 클릭해보세요.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium mb-2">북마크가 없습니다</h3>
                <p className="text-muted-foreground">
                  우측 상단의 버튼을 사용하여 새 카테고리를 만들거나 북마크를 추가해보세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </DragDropProvider>
  )
}