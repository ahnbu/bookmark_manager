'use client'

import { useState } from 'react'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { DataExporter } from '@/lib/dataExport'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, AlertCircle } from 'lucide-react'

interface ImportDataProps {
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

export function ImportData({ variant = 'outline', size = 'default' }: ImportDataProps) {
  const { importBookmarks, categories: existingCategories, bookmarks: existingBookmarks } = useBookmarkStore()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (file: File) => {
    if (!DataExporter.validateJsonFile(file)) {
      toast({
        title: '잘못된 파일 형식',
        description: 'JSON 형식의 백업 파일만 지원됩니다.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const content = await DataExporter.readJsonFile(file)
      const importData = DataExporter.parseImportData(content)
      const processedData = DataExporter.convertDatesToObjects(importData)

      if (importMode === 'replace') {
        // 덮어쓰기: 기존 데이터 삭제 후 새 데이터 적용
        importBookmarks(processedData.bookmarks, processedData.categories)
      } else {
        // 병합: 새로운 ID로 생성하여 기존 데이터와 병합
        const dataWithNewIds = DataExporter.generateNewIds(processedData)
        importBookmarks(dataWithNewIds.bookmarks, dataWithNewIds.categories)
      }

      toast({
        title: '복원 완료',
        description: `${processedData.categories.length}개의 카테고리와 ${processedData.bookmarks.length}개의 북마크를 ${importMode === 'replace' ? '복원' : '추가'}했습니다.`,
      })

      setIsOpen(false)
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: '복원 실패',
        description: error instanceof Error ? error.message : '백업 파일을 처리하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }

  const hasExistingData = existingCategories.length > 0 || existingBookmarks.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Upload className="h-4 w-4 mr-2" />
          데이터 복원
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>백업 파일에서 복원</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasExistingData && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">복원 방식</Label>
              <RadioGroup
                value={importMode}
                onValueChange={(value) => setImportMode(value as 'merge' | 'replace')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge" className="text-sm">
                    기존 데이터에 추가 (권장)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace" />
                  <Label htmlFor="replace" className="text-sm text-destructive">
                    기존 데이터 삭제 후 복원
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-2">
              백업 파일을 여기에 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              JSON 백업 파일만 지원됩니다
            </p>
            <Input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
              id="backup-file"
              disabled={isLoading}
            />
            <label htmlFor="backup-file">
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={isLoading}
                asChild
              >
                <span>
                  {isLoading ? '처리 중...' : '파일 선택'}
                </span>
              </Button>
            </label>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p>
                {importMode === 'replace'
                  ? '기존 데이터가 모두 삭제되고 백업 파일의 데이터로 대체됩니다.'
                  : '백업 파일의 데이터가 기존 데이터에 추가됩니다.'}
              </p>
              {hasExistingData && importMode === 'replace' && (
                <p className="text-destructive">
                  현재 {existingCategories.length}개 카테고리, {existingBookmarks.length}개 북마크가 삭제됩니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}