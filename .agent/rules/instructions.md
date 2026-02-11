---
trigger: always_on
glob: "**/*"
description: Color Prompt 워크스페이스 로컬 개발 환경 실행 지침
---

# Color Prompt 워크스페이스 규칙

## 로컬 개발 환경 시작

사용자가 다음과 같은 요청을 할 때 자동으로 로컬 개발 환경을 시작해야 합니다:

- "사이트를 띄워줘"
- "로컬에서 시작해줘"
- "개발 서버를 실행해줘"
- "로컬 환경 시작"
- "dev 서버 켜줘"

### 실행 순서

1. **빌드가 필요한 경우 먼저 빌드 실행**:

   ```bash
   npm run build
   ```

   - `dist` 폴더가 없거나 최신 코드가 반영되어야 하는 경우

2. **백엔드 서버 시작 (터미널 1)**:

   ```bash
   npm run dev:wrangler
   ```

   - Cloudflare Functions (`/api/*`)
   - 로컬 D1 데이터베이스 연결
   - 포트: `8788`

3. **프론트엔드 서버 시작 (터미널 2)**:

   ```bash
   npm run dev
   ```

   - Vite 개발 서버
   - React Hot Module Replacement (HMR)
   - 포트: `5173`
   - API 요청은 자동으로 `http://localhost:8788`로 프록시됨

4. **브라우저 접속**:
   - `http://localhost:5173`

### 주의사항

- 두 서버를 **동시에** 실행해야 합니다 (순차 실행 불가)
- `dev:wrangler`는 `dist` 폴더를 서빙하므로, 프론트엔드 코드 변경 시 `npm run dev`가 자동 컴파일합니다
- **원격 DB 사용**: `wrangler.toml`의 `remote = true` 설정으로 인해 `dev:wrangler`는 기본적으로 원격 DB에 연결됩니다. 모든 변경 사항이 즉시 배포 사이트에 반영되니 주의하세요.

### 원격 데이터베이스 동기화 (선택 사항)

1.  **원격 데이터를 로컬로 가져오기**:
    ```bash
    npm run db:pull
    ```
2.  **로컬 전용 모드 실행** (테스트용):
    ```bash
    npm run dev:local
    ```

### 서버 종료

사용자가 "서버 종료", "개발 환경 멈춰줘" 등의 요청을 하면:

- 실행 중인 두 개의 백그라운드 명령어를 모두 종료합니다

## 프로젝트 정보

- **프레임워크**: Vite + React + TypeScript
- **백엔드**: Cloudflare Pages Functions
- **데이터베이스**: Cloudflare D1 (SQLite)
- **배포**: Cloudflare Pages
