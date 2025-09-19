'use client'

import { useBookmarkStore } from '@/store/bookmarkStore'
import { DataExporter } from '@/lib/dataExport'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Download } from 'lucide-react'

interface ExportDataProps {
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

export function ExportData({ variant = 'outline', size = 'default' }: ExportDataProps) {
  const { categories, bookmarks } = useBookmarkStore()
  const { toast } = useToast()

  const handleExport = () => {
    try {
      if (categories.length === 0 && bookmarks.length === 0) {
        toast({
          title: '내보낼 데이터가 없습니다',
          description: '북마크나 카테고리를 추가한 후 다시 시도하세요.',
          variant: 'destructive',
        })
        return
      }

      const jsonData = DataExporter.exportToJson(categories, bookmarks)
      DataExporter.downloadJsonFile(jsonData)

      toast({
        title: '백업 완료',
        description: `${categories.length}개의 카테고리와 ${bookmarks.length}개의 북마크를 내보냈습니다.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: '내보내기 실패',
        description: '데이터를 내보내는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      데이터 백업
    </Button>
  )
}