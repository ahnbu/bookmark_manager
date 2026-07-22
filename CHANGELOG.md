# CHANGELOG

모든 Git 커밋 이력을 최신순으로 기록합니다. 새 커밋은 표 최상단에 추가합니다.

| 일시 | 유형 | 범위 | 변경내용 (목적 포함) |
|---|---|---|---|
| 2026-07-22 17:55 | fix | pnpm-policy | preinstall 가드가 pnpm 자신을 차단하던 버그 수정 — npm_execpath 폴백 검사 추가 |
| 2026-07-22 17:04 | chore | pnpm-policy | packageManager 고정 및 preinstall 가드 추가 — npm/yarn 혼용 차단 |
| 2026-07-22 15:50 | docs | readme | 배포 정보 절 추가 - Supabase 프로젝트 삭제로 서비스 사망 상태 및 복구 절차 기록 |
| 2026-07-19 12:47 | docs | rules | AGENTS.md 정본화 + CLAUDE.md를 @AGENTS.md 포인터로 전환 |
| 2026-07-08 11:35 | chore | gitignore | gitignore에 .codegraph/를 추가해 CodeGraph 로컬 캐시가 작업트리에 노출되지 않도록 보완 |
| 2026-07-08 11:32 | chore | package-manager | package-lock.json을 제거하고 pnpm-lock.yaml을 추가해 패키지 매니저 lockfile을 pnpm 기준으로 정리 |
| 2026-03-25 | chore | .gitignore | _handoff/ 항목 제거 — handoff git 추적 복원 |
| YYYY-MM-DD HH:mm | feat/fix/refactor/docs/chore/other | area-or-folder | 변경 요약 — 변경 이유·목적 |
