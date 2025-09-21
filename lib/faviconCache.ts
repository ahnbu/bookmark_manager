interface FaviconCacheEntry {
  data: string // base64 encoded image
  timestamp: number
  expires: number
}

interface FaviconCache {
  [domain: string]: FaviconCacheEntry
}

const CACHE_KEY = 'favicon_cache'
const FAILED_DOMAINS_KEY = 'failed_favicon_domains'
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000 // 30일
const RETRY_COOLDOWN = 60 * 60 * 1000 // 1시간
const MAX_FAVICON_SIZE = 10 * 1024 // 10KB
const MAX_TOTAL_CACHE_SIZE = 2 * 1024 * 1024 // 2MB

// Blob을 Base64 데이터 URL로 변환하는 헬퍼 함수
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Local Storage에서 캐시 불러오기
function getFaviconCache(): FaviconCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : {}
  } catch {
    return {}
  }
}

// Local Storage에 캐시 저장
function saveFaviconCache(cache: FaviconCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Storage 가득 참 등의 오류 시 무시
  }
}

// 실패한 도메인 목록 관리
function getFailedDomains(): { [domain: string]: number } {
  try {
    const failed = localStorage.getItem(FAILED_DOMAINS_KEY)
    return failed ? JSON.parse(failed) : {}
  } catch {
    return {}
  }
}

function saveFailedDomains(failedDomains: { [domain: string]: number }): void {
  try {
    localStorage.setItem(FAILED_DOMAINS_KEY, JSON.stringify(failedDomains))
  } catch {
    // Storage 오류 시 무시
  }
}

// 만료된 캐시 정리
function cleanExpiredCache(): void {
  const cache = getFaviconCache()
  const now = Date.now()
  let hasChanges = false

  for (const domain in cache) {
    if (cache[domain].expires < now) {
      delete cache[domain]
      hasChanges = true
    }
  }

  if (hasChanges) {
    saveFaviconCache(cache)
  }

  // 실패한 도메인도 정리
  const failedDomains = getFailedDomains()
  const filteredFailed: { [domain: string]: number } = {}

  for (const domain in failedDomains) {
    if (failedDomains[domain] > now - RETRY_COOLDOWN) {
      filteredFailed[domain] = failedDomains[domain]
    }
  }

  saveFailedDomains(filteredFailed)
}

// 전체 캐시 크기 계산
function getCacheSize(cache: FaviconCache): number {
  let totalSize = 0
  for (const domain in cache) {
    totalSize += cache[domain].data.length
  }
  return totalSize
}

// 오래된 캐시 항목 제거 (LRU 방식)
function evictOldCache(cache: FaviconCache): void {
  const entries = Object.entries(cache)
    .map(([domain, entry]) => ({ domain, ...entry }))
    .sort((a, b) => a.timestamp - b.timestamp) // 오래된 순 정렬

  while (getCacheSize(cache) > MAX_TOTAL_CACHE_SIZE && entries.length > 0) {
    const oldest = entries.shift()
    if (oldest) {
      delete cache[oldest.domain]
    }
  }
}

// 이미지를 Base64로 변환
async function imageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      try {
        const base64 = canvas.toDataURL()

        // 크기 체크 (base64 문자열 길이로 대략적 계산)
        if (base64.length > MAX_FAVICON_SIZE * 1.5) { // base64 오버헤드 고려
          reject(new Error('Favicon too large'))
          return
        }

        resolve(base64)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Failed to load favicon'))
    img.src = url
  })
}

// 더미/테스트 도메인 체크
function isDummyDomain(domain: string): boolean {
  const dummyDomains = [
    'example.com', 'example.org', 'example.net',
    'localhost', '127.0.0.1', '0.0.0.0',
    'test.com', 'demo.com', 'sample.com',
    'dummy.com', 'fake.com', 'placeholder.com'
  ]
  return dummyDomains.includes(domain.toLowerCase())
}

// Direct favicon 시도 (일반적인 favicon 경로들)
async function tryDirectFavicon(domain: string): Promise<string | null> {
  // 더미 도메인인 경우 시도하지 않음
  if (isDummyDomain(domain)) {
    console.log(`ℹ️ ${domain}은 더미/테스트 도메인이므로 Direct favicon 시도를 건너뜁니다.`)
    return null
  }

  const commonFaviconPaths = [
    '/favicon.ico',
    '/favicon.png',
    '/apple-touch-icon.png',
    '/apple-touch-icon-152x152.png',
    '/apple-touch-icon-180x180.png',
    '/android-chrome-192x192.png'
  ]

  for (const path of commonFaviconPaths) {
    try {
      const faviconUrl = `https://${domain}${path}`
      console.log(`🔍 ${domain} Direct favicon 시도중...`)

      const base64 = await imageToBase64(faviconUrl)
      console.log(`✅ ${domain} Direct favicon 성공`)
      return base64
    } catch (error) {
      // CORS 에러는 로그 레벨을 낮춤 (예상되는 에러)
      if (error instanceof Error && error.message.includes('CORS')) {
        console.debug(`⚠️ ${domain}${path} CORS 제한`)
      } else {
        console.log(`❌ ${domain}${path} 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      continue
    }
  }

  console.log(`⚠️ ${domain} Direct favicon 시도 완료 (성공하지 못함)`)
  return null
}

// 캐시에서 favicon 조회
export function getFaviconFromCache(domain: string): string | null {
  cleanExpiredCache()

  const cache = getFaviconCache()
  const entry = cache[domain]

  if (entry && entry.expires > Date.now()) {
    // 접근 시간 업데이트 (LRU를 위해)
    entry.timestamp = Date.now()
    saveFaviconCache(cache)
    return entry.data
  }

  return null
}

// favicon을 캐시에 저장
export function saveFaviconToCache(domain: string, base64Data: string): void {
  const cache = getFaviconCache()
  const now = Date.now()

  cache[domain] = {
    data: base64Data,
    timestamp: now,
    expires: now + CACHE_DURATION
  }

  // 전체 크기가 제한을 넘으면 오래된 항목 제거
  if (getCacheSize(cache) > MAX_TOTAL_CACHE_SIZE) {
    evictOldCache(cache)
  }

  saveFaviconCache(cache)
}

// favicon 로딩 (캐시 우선, 없으면 CORS 프록시를 통해 Google API 요청)
export async function loadFaviconWithCache(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // 1. 캐시에서 확인 (기존 로직 재사용)
    const cached = getFaviconFromCache(domain);
    if (cached) {
      return cached;
    }

    // 2. 실패한 도메인인지 확인 (기존 로직 재사용)
    const failedDomains = getFailedDomains();
    if (failedDomains[domain] && failedDomains[domain] > Date.now() - RETRY_COOLDOWN) {
      return null;
    }

    // 3. Google API + 프록시 시도
    try {
      const googleApiUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
      // allorigins 프록시를 통해 요청합니다. 대상 URL은 반드시 인코딩해야 합니다.
      const proxiedUrl = `https://favicon-proxy.byungwook-an.workers.dev/?url=${encodeURIComponent(googleApiUrl)}`;

      console.log(`🔄 ${domain} Google API + 프록시 시도중...`);
      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        throw new Error('Proxied Google API failed');
      }

      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      if (base64.length > MAX_FAVICON_SIZE * 1.5) {
        throw new Error('Favicon too large');
      }

      console.log(`✅ ${domain} Google API + 프록시 성공`);
      saveFaviconToCache(domain, base64);
      return base64;

    } catch (proxyError) {
      console.warn(`⚠️ Google API + 프록시 실패: ${domain} - ${proxyError instanceof Error ? proxyError.message : 'Unknown error'}`);

      // 4. Direct favicon 시도 (프록시 실패 시 폴백)
      try {
        console.log(`🔄 ${domain} Direct favicon 폴백 시도중...`);
        const directFavicon = await tryDirectFavicon(domain);

        if (directFavicon) {
          console.log(`✅ ${domain} Direct favicon 폴백 성공`);
          saveFaviconToCache(domain, directFavicon);
          return directFavicon;
        } else {
          throw new Error('Direct favicon failed');
        }
      } catch (directError) {
        console.debug(`⚠️ ${domain} Direct favicon 폴백 실패`);

        // 5. 모든 시도 실패 - 실패 도메인 등록
        const failed = getFailedDomains();
        failed[domain] = Date.now();
        saveFailedDomains(failed);

        console.log(`ℹ️ ${domain} favicon 로딩 실패 - 기본 아이콘 사용`);
        return null;
      }
    }
  } catch {
    return null;
  }
}

// 도메인에서 favicon URL 생성 (백업용)
export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  } catch {
    return '/default-favicon.svg'
  }
}

// 강제 새로고침 (실패 기록 무시하고 프록시를 통해 재시도)
export async function forceRefreshFavicon(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Google API + 프록시 시도
    try {
      const googleApiUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
      const proxiedUrl = `https://favicon-proxy.byungwook-an.workers.dev/?url=${encodeURIComponent(googleApiUrl)}`;

      console.log(`🔄 ${domain} 강제 새로고침 - Google API + 프록시 시도중...`);
      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        throw new Error('Proxied Google API failed');
      }

      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      if (base64.length > MAX_FAVICON_SIZE * 1.5) {
        throw new Error('Favicon too large');
      }

      console.log(`✅ ${domain} 강제 새로고침 - Google API + 프록시 성공`);
      saveFaviconToCache(domain, base64);

      // 실패 기록 삭제 (성공했으므로)
      const failedDomains = getFailedDomains();
      if (failedDomains[domain]) {
        delete failedDomains[domain];
        saveFailedDomains(failedDomains);
      }

      return base64;
    } catch (proxyError) {
      console.warn(`⚠️ 강제 새로고침 - Google API + 프록시 실패: ${domain} - ${proxyError instanceof Error ? proxyError.message : 'Unknown error'}`);

      // Direct favicon 시도 (프록시 실패 시 폴백)
      try {
        console.log(`🔄 ${domain} 강제 새로고침 - Direct favicon 폴백 시도중...`);
        const directFavicon = await tryDirectFavicon(domain);

        if (directFavicon) {
          console.log(`✅ ${domain} 강제 새로고침 - Direct favicon 폴백 성공`);
          saveFaviconToCache(domain, directFavicon);

          // 실패 기록 삭제 (성공했으므로)
          const failedDomains = getFailedDomains();
          if (failedDomains[domain]) {
            delete failedDomains[domain];
            saveFailedDomains(failedDomains);
          }

          return directFavicon;
        } else {
          throw new Error('Direct favicon failed');
        }
      } catch (directError) {
        console.log(`ℹ️ ${domain} 강제 새로고침 실패 - 기본 아이콘 사용`);
        return null;
      }
    }
  } catch {
    return null;
  }
}

// 실패한 도메인 목록 초기화
export function clearFailedDomains(): void {
  try {
    localStorage.removeItem(FAILED_DOMAINS_KEY)
  } catch {
    // Storage 오류 시 무시
  }
}

// 캐시 통계 조회 (디버깅/관리용)
export function getCacheStats() {
  const cache = getFaviconCache()
  const failedDomains = getFailedDomains()

  return {
    totalEntries: Object.keys(cache).length,
    totalSize: getCacheSize(cache),
    failedDomainsCount: Object.keys(failedDomains).length,
    maxSize: MAX_TOTAL_CACHE_SIZE
  }
}