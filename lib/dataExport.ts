import { Bookmark, Category } from './types'

export interface ExportData {
  version: string
  timestamp: string
  categories: Category[]
  bookmarks: Bookmark[]
}

export class DataExporter {
  private static readonly VERSION = '1.0.0'

  static exportToJson(categories: Category[], bookmarks: Bookmark[]): string {
    const exportData: ExportData = {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      categories,
      bookmarks,
    }

    return JSON.stringify(exportData, null, 2)
  }

  static downloadJsonFile(data: string, filename?: string) {
    const timestamp = new Date().toISOString().split('T')[0]
    const defaultFilename = `bookmarks-backup-${timestamp}.json`

    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename || defaultFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  static async readJsonFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.validateJsonFile(file)) {
        reject(new Error('JSON 파일만 지원됩니다.'))
        return
      }

      const reader = new FileReader()

      reader.onload = (event) => {
        const content = event.target?.result as string
        resolve(content)
      }

      reader.onerror = () => {
        reject(new Error('파일을 읽는 중 오류가 발생했습니다.'))
      }

      reader.readAsText(file, 'utf-8')
    })
  }

  static parseImportData(jsonContent: string): ExportData {
    try {
      const data = JSON.parse(jsonContent)

      if (!this.validateImportData(data)) {
        throw new Error('잘못된 백업 파일 형식입니다.')
      }

      return data
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('유효하지 않은 JSON 파일입니다.')
      }
      throw error
    }
  }

  static validateJsonFile(file: File): boolean {
    return file.type === 'application/json' || file.name.endsWith('.json')
  }

  private static validateImportData(data: any): data is ExportData {
    if (!data || typeof data !== 'object') return false

    // 필수 필드 확인
    if (!data.categories || !Array.isArray(data.categories)) return false
    if (!data.bookmarks || !Array.isArray(data.bookmarks)) return false

    // 카테고리 구조 확인
    for (const category of data.categories) {
      if (!category.id || !category.name || typeof category.order !== 'number') {
        return false
      }
    }

    // 북마크 구조 확인
    for (const bookmark of data.bookmarks) {
      if (!bookmark.id || !bookmark.name || !bookmark.url || !bookmark.categoryId) {
        return false
      }
    }

    return true
  }

  static convertDatesToObjects(data: ExportData): ExportData {
    return {
      ...data,
      categories: data.categories.map(category => ({
        ...category,
        createdAt: new Date(category.createdAt),
        updatedAt: new Date(category.updatedAt),
      })),
      bookmarks: data.bookmarks.map(bookmark => ({
        ...bookmark,
        createdAt: new Date(bookmark.createdAt),
        updatedAt: new Date(bookmark.updatedAt),
      })),
    }
  }

  static generateNewIds(data: ExportData): ExportData {
    const categoryIdMap = new Map<string, string>()

    // 새로운 카테고리 ID 생성 및 매핑
    const newCategories = data.categories.map(category => {
      const newId = crypto.randomUUID()
      categoryIdMap.set(category.id, newId)
      return { ...category, id: newId }
    })

    // 북마크의 카테고리 ID 업데이트 및 새로운 북마크 ID 생성
    const newBookmarks = data.bookmarks.map(bookmark => ({
      ...bookmark,
      id: crypto.randomUUID(),
      categoryId: categoryIdMap.get(bookmark.categoryId) || bookmark.categoryId,
    }))

    return {
      ...data,
      categories: newCategories,
      bookmarks: newBookmarks,
    }
  }
}