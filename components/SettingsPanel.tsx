'use client'

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
import { Settings, Columns, Grid3X3, LayoutGrid, Trash2 } from 'lucide-react'
import { clearFailedDomains, getCacheStats } from '@/lib/faviconCache'

export function SettingsPanel() {
  const { settings, updateSettings, toggleCategoryVisibility } = useSettingsStore()
  const { categories } = useBookmarkStore()

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

  const handleClearFailedDomains = () => {
    clearFailedDomains()
    alert('실패한 도메인 목록이 초기화되었습니다. 이제 모든 사이트의 favicon을 다시 시도할 수 있습니다.')
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">레이아웃</Label>
            <p className="text-sm text-muted-foreground">
              화면에 표시할 컬럼 수를 선택하세요
            </p>
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
            <p className="text-sm text-muted-foreground">
              북마크에 표시할 정보를 선택하세요
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">URL 표시</Label>
                  <p className="text-xs text-muted-foreground">
                    각 북마크에 URL을 표시합니다
                  </p>
                </div>
                <Switch
                  checked={settings.displayOptions?.showUrl ?? true}
                  onCheckedChange={(checked) => handleDisplayOptionChange('showUrl', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">메모 표시</Label>
                  <p className="text-xs text-muted-foreground">
                    각 북마크에 설명(메모)을 표시합니다
                  </p>
                </div>
                <Switch
                  checked={settings.displayOptions?.showDescription ?? true}
                  onCheckedChange={(checked) => handleDisplayOptionChange('showDescription', checked)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">카테고리 표시</Label>
                <p className="text-xs text-muted-foreground">
                  숨기고 싶은 카테고리를 선택하세요
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {categories.map((category) => {
                    const isHidden = settings.displayOptions?.hiddenCategories?.includes(category.id) ?? false
                    return (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={!isHidden}
                          onCheckedChange={() => toggleCategoryVisibility(category.id)}
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {category.name}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">데이터 관리</Label>
            <p className="text-sm text-muted-foreground">
              북마크 데이터를 백업하거나 복원할 수 있습니다
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <ExportData variant="outline" size="sm" />
              <ImportData variant="outline" size="sm" />
              <ImportBookmarks variant="outline" size="sm" />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Favicon 관리</Label>
            <p className="text-sm text-muted-foreground">
              Favicon 캐시 상태를 확인하고 관리할 수 있습니다
            </p>
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <p>• 캐시된 favicon: {cacheStats.totalEntries}개</p>
                <p>• 실패한 도메인: {cacheStats.failedDomainsCount}개</p>
                <p>• 캐시 크기: {Math.round(cacheStats.totalSize / 1024)}KB / {Math.round(cacheStats.maxSize / 1024 / 1024)}MB</p>
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

          <div className="space-y-3">
            <Label className="text-base font-medium">정보</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• 북마크 데이터는 브라우저의 로컬 스토리지에 저장됩니다</p>
              <p>• 브라우저 데이터를 삭제하면 북마크도 함께 삭제됩니다</p>
              <p>• 정기적으로 데이터를 백업하여 안전하게 보관하세요</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}