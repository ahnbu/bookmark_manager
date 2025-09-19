'use client'

import { useState } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSettingsStore } from '@/store/settingsStore'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { ExportData } from '@/components/ExportData'
import { ImportData } from '@/components/ImportData'
import { ImportBookmarks } from '@/components/ImportBookmarks'
import { Settings, Columns, Grid3X3, LayoutGrid, Trash2, GripVertical, Database, Upload, X } from 'lucide-react'
import { clearFailedDomains, getCacheStats } from '@/lib/faviconCache'

interface SortableCategoryItemProps {
  category: { id: string; name: string }
  isHidden: boolean
  onToggleVisibility: () => void
}

function SortableCategoryItem({ category, isHidden, onToggleVisibility }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-2 group p-1 rounded hover:bg-muted/50 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
        title="드래그하여 순서 변경"
        aria-label={`${category.name} 카테고리 순서 변경`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox
        id={`category-${category.id}`}
        checked={!isHidden}
        onCheckedChange={onToggleVisibility}
      />
      <Label
        htmlFor={`category-${category.id}`}
        className="text-sm cursor-pointer flex-1 select-none"
      >
        {category.name}
      </Label>
    </div>
  )
}

export function SettingsPanel() {
  const { settings, updateSettings, toggleCategoryVisibility } = useSettingsStore()
  const { categories, moveCategoryOrder, migrateFromLocalStorage, isLoading } = useBookmarkStore()

  const handleLayoutChange = (value: string) => {
    updateSettings({ layoutColumns: parseInt(value) as 1 | 2 | 3 })
  }

  const handleDisplayOptionChange = (option: 'showUrl' | 'showDescription', value: boolean) => {
    updateSettings({
      displayOptions: {
        ...settings.displayOptions,
        showUrl: settings.displayOptions?.showUrl ?? true,
        showDescription: settings.displayOptions?.showDescription ?? true,
        hiddenCategories: settings.displayOptions?.hiddenCategories ?? [],
        [option]: value,
      },
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const sortedCategories = categories.sort((a, b) => a.order - b.order)
    const oldIndex = sortedCategories.findIndex(cat => cat.id === active.id)
    const newIndex = sortedCategories.findIndex(cat => cat.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      moveCategoryOrder(active.id as string, newIndex)
    }
  }

  const handleClearFailedDomains = () => {
    clearFailedDomains()
    alert('실패한 도메인 목록이 초기화되었습니다. 이제 모든 사이트의 favicon을 다시 시도할 수 있습니다.')
  }

  const handleMigrateData = async () => {
    if (confirm('LocalStorage의 데이터를 Supabase로 마이그레이션하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await migrateFromLocalStorage()
        alert('데이터 마이그레이션이 완료되었습니다!')
      } catch (error) {
        alert('마이그레이션 중 오류가 발생했습니다.')
      }
    }
  }

  const cacheStats = getCacheStats()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          설정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-h-none sm:overflow-y-visible">
        <DialogHeader className="relative">
          <DialogTitle>설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-1 sm:px-0">
          <div className="space-y-3">
            <Label className="text-base font-medium">레이아웃</Label>
            {/*<p className="text-sm text-muted-foreground">
              화면에 표시할 컬럼 수를 선택하세요
            </p>*/}
            <RadioGroup
              value={settings.layoutColumns.toString()}
              onValueChange={handleLayoutChange}
              className="grid grid-cols-3 gap-4"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="layout-1" />
                  <Label htmlFor="layout-1" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Columns className="h-6 w-6" />
                      <span className="text-sm">1컬럼</span>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="layout-2" />
                  <Label htmlFor="layout-2" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <LayoutGrid className="h-6 w-6" />
                      <span className="text-sm">2컬럼</span>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="layout-3" />
                  <Label htmlFor="layout-3" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Grid3X3 className="h-6 w-6" />
                      <span className="text-sm">3컬럼</span>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">표시 옵션</Label>
            {/*<p className="text-sm text-muted-foreground">
              북마크에 표시할 정보를 선택하세요
            </p>*/}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">URL 표시</Label>
                  {/* <p className="text-xs text-muted-foreground">
                    각 북마크에 URL을 표시합니다
                  </p> */}
                </div>
                <Switch
                  checked={settings.displayOptions?.showUrl ?? true}
                  onCheckedChange={(checked) => handleDisplayOptionChange('showUrl', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">메모 표시</Label>
                  {/* <p className="text-xs text-muted-foreground">
                    각 북마크에 설명(메모)을 표시합니다
                  </p> */}
                </div>
                <Switch
                  checked={settings.displayOptions?.showDescription ?? true}
                  onCheckedChange={(checked) => handleDisplayOptionChange('showDescription', checked)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">카테고리 표시</Label>
                {/* <p className="text-xs text-muted-foreground">
                  카테고리 순서를 변경하거나 숨기고 싶은 카테고리를 선택하세요
                </p> */}
                <div className="max-h-32 overflow-y-auto">
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={categories.sort((a, b) => a.order - b.order).map(cat => cat.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {categories
                          .sort((a, b) => a.order - b.order)
                          .map((category) => {
                            const isHidden = settings.displayOptions?.hiddenCategories?.includes(category.id) ?? false
                            return (
                              <SortableCategoryItem
                                key={category.id}
                                category={category}
                                isHidden={isHidden}
                                onToggleVisibility={() => toggleCategoryVisibility(category.id)}
                              />
                            )
                          })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">데이터 관리</Label>
            {/*<p className="text-sm text-muted-foreground">
              북마크 데이터를 백업하거나 복원할 수 있습니다
            </p>*/}
            <div className="flex flex-col sm:flex-row gap-2">
              <ExportData variant="outline" size="sm" />
              <ImportData variant="outline" size="sm" />
              <ImportBookmarks variant="outline" size="sm" />
            </div>
          </div>
          {/*
          <div className="space-y-3">
            <Label className="text-base font-medium">데이터 마이그레이션</Label>
            <p className="text-sm text-muted-foreground">
              LocalStorage의 기존 데이터를 Supabase 클라우드 데이터베이스로 이동할 수 있습니다
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMigrateData}
              disabled={isLoading}
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              {isLoading ? '마이그레이션 중...' : 'Supabase로 데이터 마이그레이션'}
            </Button>
            <p className="text-xs text-muted-foreground">
              • 이 작업은 한 번만 실행하면 됩니다<br />
              • 기존 LocalStorage 데이터는 유지됩니다<br />
              • 마이그레이션 후 모든 데이터는 클라우드에 저장됩니다
            </p>
          </div>
          */}

          <div className="space-y-3">
            <Label className="text-base font-medium">Favicon 관리</Label>
            {/*<p className="text-sm text-muted-foreground">
              Favicon 캐시 상태를 확인하고 관리할 수 있습니다
            </p>*/}
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                {/* <p>• 캐시 favicon: {cacheStats.totalEntries}개 // 실패 도메인: {cacheStats.failedDomainsCount}개 // 캐시 크기: {Math.round(cacheStats.totalSize / 1024 / 1024)}MB / {Math.round(cacheStats.maxSize / 1024 / 1024)}MB</p> */}
                <p>• 캐시 favicon: {cacheStats.totalEntries}개 | 실패 도메인: {cacheStats.failedDomainsCount}개 | 캐시 크기: {(cacheStats.totalSize / 1024 / 1024).toFixed(1)}MB / {(cacheStats.maxSize / 1024 / 1024).toFixed(1)}MB</p>
                {/* 
                <p>• 캐시된 favicon: {cacheStats.totalEntries}개</p>
                <p>• 실패한 도메인: {cacheStats.failedDomainsCount}개</p>
                <p>• 캐시 크기: {Math.round(cacheStats.totalSize / 1024 / 1024)}MB / {Math.round(cacheStats.maxSize / 1024 / 1024)}MB</p> */}
                {/* <p>• 캐시 크기: (cacheStats.totalSize / 1024).toFixed(2)MB / {(cacheStats.maxSize / 1024).toFixed(2)}MB</p> */}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFailedDomains}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                실패한 도메인 목록 초기화
              </Button>
            </div>
          </div>

          {/* 
          <div className="space-y-3">
            <Label className="text-base font-medium">정보</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• 북마크 데이터는 브라우저의 로컬 스토리지에 저장됩니다</p>
              <p>• 브라우저 데이터를 삭제하면 북마크도 함께 삭제됩니다</p>
              <p>• 정기적으로 데이터를 백업하여 안전하게 보관하세요</p>
            </div>
          </div>*/}
        </div>
      </DialogContent>
    </Dialog>
  )
}