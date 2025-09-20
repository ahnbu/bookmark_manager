'use client'

import { useState } from 'react'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, ChevronDown } from 'lucide-react'
import { loadFaviconWithCache } from '@/lib/faviconCache'

interface AddBookmarkProps {
  defaultCategoryId?: string
  children?: React.ReactNode // ✅ children prop 추가
}

//export function AddBookmark({ defaultCategoryId }: AddBookmarkProps) {
export function AddBookmark({ defaultCategoryId, children }: AddBookmarkProps) {
  const { addBookmark, categories, getBookmarksByCategory } = useBookmarkStore()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(defaultCategoryId || categories[0]?.id || '')
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    isFavorite: false,
  })

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim() && formData.url.trim() && selectedCategoryId) {
      const categoryBookmarks = getBookmarksByCategory(selectedCategoryId)

      // 북마크 먼저 추가 (favicon 없이)
      const newBookmark = {
        name: formData.name.trim(),
        url: formData.url.trim(),
        description: formData.description.trim() || undefined,
        categoryId: selectedCategoryId,
        order: categoryBookmarks.length,
        favicon: undefined, // 초기값은 undefined
        isFavorite: formData.isFavorite,
      }

      addBookmark(newBookmark)

      // 백그라운드에서 favicon 로딩
      loadFaviconWithCache(formData.url).then((cachedFavicon) => {
        if (cachedFavicon) {
          // favicon 로딩 완료 시 업데이트 (여기서는 스토어에 업데이트 로직이 필요)
          // 현재는 새로고침하면 적용됨
        }
      }).catch(() => {
        // favicon 로딩 실패해도 무시
      })

      setFormData({ name: '', url: '', description: '', isFavorite: false })
      setIsOpen(false)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
        {/* ✅ children이 있으면 사용하고, 없으면 기본 버튼을 렌더링 */}
        {children || (
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            새 북마크
          </Button>
        )}
      </DialogTrigger>
      {/* <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          새 북마크
        </Button>
      </DialogTrigger> */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 북마크 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-sm font-medium">카테고리</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedCategory?.name || '카테고리 선택'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            <label htmlFor="bookmark-name" className="text-sm font-medium">
              이름
            </label>
            <Input
              id="bookmark-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="북마크 이름을 입력하세요"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="bookmark-url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="bookmark-url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="bookmark-description" className="text-sm font-medium">
              설명 (선택사항)
            </label>
            <Textarea
              id="bookmark-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="북마크에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="bookmark-favorite"
              checked={formData.isFavorite}
              onCheckedChange={(checked) => setFormData({ ...formData, isFavorite: checked })}
            />
            <Label htmlFor="bookmark-favorite" className="text-sm font-medium">
              즐겨찾기
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || !formData.url.trim() || !selectedCategoryId}
            >
              추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}