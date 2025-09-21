# 북마크 관리자 (Bookmark Manager)

브라우저 북마크를 효율적으로 관리할 수 있는 현대적인 웹 애플리케이션입니다.

![Next.js](https://img.shields.io/badge/Next.js-15.1.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38bdf8?logo=tailwind-css)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)

## ✨ 주요 기능

### 📁 카테고리 관리
- **카테고리 생성/수정/삭제**: 북마크를 체계적으로 분류
- **카테고리 복제**: 기존 카테고리를 모든 북마크와 함께 복제
- **드래그 앤 드롭 정렬**: 카테고리 순서를 직관적으로 변경
- **카테고리 표시/숨김**: 필요에 따라 카테고리를 숨겨서 관리

### 🔖 북마크 관리
- **북마크 추가/수정/삭제**: 완전한 CRUD 기능
- **북마크 복제**: 북마크를 같은 카테고리 내에서 복제
- **드래그 앤 드롭**: 카테고리 간 북마크 이동 및 순서 변경
- **북마크 정보**: 이름, URL, 설명 관리

### 🎨 파비콘 시스템
- **자동 파비콘 로딩**: Google Favicon API를 통한 자동 파비콘 수집
- **커스텀 파비콘**: 사용자가 직접 파비콘 이미지 업로드
- **파비콘 리셋**: 문제가 있는 파비콘을 기본 아이콘으로 변경
- **지능형 캐싱**: 성능 최적화를 위한 파비콘 캐시 시스템

#### 파비콘 처리 순서 (Favicon Loading Process)
1. **DB 확인**: Supabase DB의 `bookmarks.favicon` 필드에서 저장된 base64 데이터 확인
2. **LocalStorage 캐시 확인**: 네트워크 요청 최적화를 위한 임시 캐시 확인
3. **Google API + 프록시**: CORS 우회를 위한 프록시를 통해 Google Favicon API 호출
4. **Direct Favicon 폴백**: 프록시 실패 시 직접 favicon 경로 시도
   - `/favicon.ico`, `/favicon.png`, `/apple-touch-icon.png` 등
5. **성공 시 저장**:
   - Supabase DB에 base64 데이터로 저장 (영구 보관)
   - LocalStorage에 캐시 저장 (중복 요청 방지)
6. **실패 시 Globe 아이콘**: 모든 시도 실패 시 기본 Globe 아이콘 표시

#### 캐시 시스템 구조
- **DB 저장**: 실제 데이터, 영구 저장
- **LocalStorage 캐시**: 30일 TTL, 네트워크 최적화용, 최대 2MB
- **실패 도메인 관리**: 1시간 쿨다운으로 반복 요청 방지
- **자동 정리**: 만료된 캐시 및 용량 초과 시 LRU 방식으로 자동 정리

### ⚙️ 설정 및 커스터마이징
- **레이아웃 옵션**: 1컬럼, 2컬럼, 3컬럼 그리드 레이아웃
- **표시 옵션**: URL, 설명 표시/숨김 설정
- **반응형 디자인**: 모바일부터 데스크톱까지 완벽 지원

### 📥📤 데이터 관리
- **데이터 내보내기**: JSON 형식으로 북마크 데이터 백업
- **데이터 가져오기**: 백업된 데이터 복원
- **브라우저 북마크 가져오기**: 브라우저 북마크 HTML 파일 가져오기
- **로컬 저장소**: 브라우저 LocalStorage를 이용한 데이터 저장

## 🛠️ 기술 스택

- **프레임워크**: Next.js 15.1.2
- **언어**: TypeScript
- **스타일링**: Tailwind CSS + shadcn/ui
- **상태 관리**: Zustand
- **드래그 앤 드롭**: @dnd-kit
- **아이콘**: Lucide React
- **데이터 저장**: Supabase (PostgreSQL) + LocalStorage 캐시

## 🚀 시작하기

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/bookmark-manager.git
cd bookmark-manager

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📖 사용법

### 기본 사용법
1. **카테고리 생성**: 우측 상단의 "새 카테고리" 버튼으로 카테고리 추가
2. **북마크 추가**: "새 북마크" 버튼으로 북마크 추가 또는 카테고리별 "+" 버튼 사용
3. **정렬**: 드래그 앤 드롭으로 카테고리와 북마크 순서 변경
4. **설정**: 우측 상단 설정 버튼에서 레이아웃 및 표시 옵션 조정

### 고급 기능
- **복제**: 카테고리나 북마크의 3점 메뉴에서 복제 옵션 사용
- **파비콘 관리**: 북마크 3점 메뉴에서 파비콘 리셋 또는 커스텀 파비콘 등록
- **데이터 백업**: 설정 > 데이터 관리에서 내보내기/가져오기 기능 사용

## 🎯 주요 특징

### 사용자 경험
- **직관적 인터페이스**: 깔끔하고 현대적인 디자인
- **반응형**: 모든 디바이스에서 최적화된 경험
- **빠른 로딩**: 효율적인 캐싱과 최적화

### 성능
- **지능형 파비콘 캐싱**: 중복 로딩 방지 및 성능 최적화
- **순차적 파비콘 로딩**: 초기 로딩 시 서버 부하 분산
- **하이브리드 저장소**: Supabase DB + LocalStorage 캐시로 빠른 액세스
- **실패 도메인 관리**: 쿨다운을 통한 불필요한 재시도 방지

### 확장성
- **모듈형 아키텍처**: 컴포넌트 기반 설계
- **타입 안전성**: TypeScript를 통한 런타임 오류 방지
- **상태 관리**: Zustand를 통한 효율적인 상태 관리

## 📁 프로젝트 구조

```
bookmark-manager/
├── app/                    # Next.js 13+ App Router
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기본 컴포넌트
│   ├── BookmarkCard.tsx  # 북마크 카드 컴포넌트
│   ├── CategorySection.tsx # 카테고리 섹션 컴포넌트
│   └── ...
├── lib/                  # 유틸리티 함수
│   ├── types.ts         # TypeScript 타입 정의
│   ├── faviconCache.ts  # 파비콘 캐시 시스템
│   └── utils.ts         # 공통 유틸리티
├── store/               # Zustand 상태 관리
│   ├── bookmarkStore.ts # 북마크 상태
│   └── settingsStore.ts # 설정 상태
└── styles/              # 스타일 파일
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 글

- [shadcn/ui](https://ui.shadcn.com/) - 아름다운 UI 컴포넌트
- [Lucide](https://lucide.dev/) - 깔끔한 아이콘 세트
- [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 우선 CSS 프레임워크
- [Next.js](https://nextjs.org/) - React 프레임워크

---

**만든 이**: Claude AI Assistant
**문의**: GitHub Issues를 통해 문의해 주세요.
