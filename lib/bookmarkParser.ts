import { BookmarkImport, Bookmark, Category } from './types'

export class BookmarkParser {
  static parseHtmlFile(htmlContent: string): BookmarkImport[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    // Chrome, Firefox, Safari 등의 북마크 HTML 형식 파싱
    const bookmarkBar = doc.querySelector('dl > dt > h3')?.parentElement?.parentElement
    if (!bookmarkBar) {
      throw new Error('유효한 북마크 파일이 아닙니다.')
    }

    return this.parseDL(bookmarkBar)
  }

  private static parseDL(dlElement: Element): BookmarkImport[] {
    const items: BookmarkImport[] = []
    const dtElements = dlElement.querySelectorAll(':scope > dt')

    dtElements.forEach((dt) => {
      const h3 = dt.querySelector('h3')
      const link = dt.querySelector('a')

      if (h3) {
        // 폴더
        const folderName = h3.textContent?.trim() || '제목 없음'
        const subDl = dt.querySelector('dl')
        const children = subDl ? this.parseDL(subDl) : []

        items.push({
          title: folderName,
          url: '',
          type: 'folder',
          children,
        })
      } else if (link) {
        // 북마크
        const title = link.textContent?.trim() || '제목 없음'
        const url = link.getAttribute('href') || ''

        items.push({
          title,
          url,
          type: 'bookmark',
        })
      }
    })

    return items
  }

  static convertToBookmarksAndCategories(importData: BookmarkImport[]): {
    categories: Category[]
    bookmarks: Bookmark[]
  } {
    const categories: Category[] = []
    const bookmarks: Bookmark[] = []
    const now = new Date()

    const processItems = (items: BookmarkImport[], parentCategoryId?: string) => {
      items.forEach((item, index) => {
        if (item.type === 'folder' && item.children) {
          // 카테고리 생성
          const categoryId = crypto.randomUUID()
          const category: Category = {
            id: categoryId,
            name: item.title,
            order: index,
            createdAt: now,
            updatedAt: now,
          }
          categories.push(category)

          // 하위 아이템들 처리
          processItems(item.children, categoryId)
        } else if (item.type === 'bookmark' && item.url) {
          // 북마크 생성
          const categoryId = parentCategoryId || categories[0]?.id

          if (categoryId) {
            const bookmark: Bookmark = {
              id: crypto.randomUUID(),
              name: item.title,
              url: item.url,
              categoryId,
              order: index,
              favicon: this.getFaviconUrl(item.url),
              createdAt: now,
              updatedAt: now,
            }
            bookmarks.push(bookmark)
          }
        }
      })
    }

    // 기본 카테고리 생성 (폴더가 없는 북마크들을 위해)
    if (importData.some(item => item.type === 'bookmark')) {
      const defaultCategory: Category = {
        id: crypto.randomUUID(),
        name: '가져온 북마크',
        order: 0,
        createdAt: now,
        updatedAt: now,
      }
      categories.push(defaultCategory)
    }

    processItems(importData)

    return { categories, bookmarks }
  }

  private static getFaviconUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
    } catch {
      return '/default-favicon.svg'
    }
  }

  static validateBookmarkFile(file: File): boolean {
    return file.type === 'text/html' || file.name.endsWith('.html')
  }

  static async readBookmarkFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
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
}