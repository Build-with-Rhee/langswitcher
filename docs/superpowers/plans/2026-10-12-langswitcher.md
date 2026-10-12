# LangSwitcher Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline, with one independent final review.

**Goal:** 로컬 양방향 규칙 변환 웹앱과 Windows 실행 파일을 만든다.
**Architecture:** 순수 엔진과 출처 데이터, React UI, 권한 없는 Electron wrapper를 분리한다.
**Tech Stack:** Node 22.12+, TypeScript, React, Vite, Vitest, Playwright, Electron, electron-builder.
**Spec:** `docs/superpowers/specs/2026-10-12-langswitcher-design.md`

## Global Constraints
- 외부 AI API·로그인·텍스트 수집 없음. 입력 50,000자 상한.
- 실제 평가 없이 90% 달성 또는 완벽한 규범 적용을 주장하지 않는다.
- 기존 격리된 클라우드 체크아웃 사용, 사용자 요청 없이 worktree 생성 없음.
- Windows 교차 빌드와 Windows 실행 검증 구분. 서명되지 않은 산출물 표시.

## Review Focus
- 인명·부분 단어·공통어가 전역 두음 치환으로 손상되지 않아야 한다.
- 보호한 URL·코드·보호어와 개행은 그대로 유지해야 한다.
- 조사와 겹친 표현은 두 번 변환되면 안 된다.
- UI가 과거 결과를 복사하거나 악성 HTML을 실행하면 안 된다.
- 빈 코퍼스를 성공률 100%로 표시하면 안 된다.

### Task 1: 규범 분석, 엔진과 평가
**Files:** `src/engine/{types,rules,convert,evaluate}.ts`, `tests/engine.test.ts`, `scripts/evaluate.ts`, `docs/linguistic-model.md`.
**Interfaces:** produces `convert(text, direction, options) → ConversionResult` with source/output segments and change list; `evaluate(cases) → report`.
- [x] 참고 규범 접근 확인 및 검증 범위 기록.
- [x] 양방향/조사/보호구간/오변환/위치/빈 코퍼스 테스트 작성, 미구현 실패 확인.
- [x] longest-match 규칙 엔진과 근거 사전, 평가 구현.
- [x] `npm test` 전체 실행, 타입 검사.

### Task 2: 웹앱
**Files:** `src/{App,main}.tsx`, `src/components/*`, `src/styles.css`, `tests/app.spec.ts`, Vite configs.
**Interfaces:** consumes `convert` result; browser File/Clipboard/Blob APIs.
- [x] 핵심 변환/방향/하이라이트/다운로드/모바일 E2E 테스트, 초기 실패 확인.
- [x] 반응형 편집 화면, 변경 내역, 규칙 검색, 규범 안내와 옵션 구현.
- [x] Chromium E2E·스크린샷 확인, `npm run build`.

### Task 3: Windows 배포
**Files:** `electron/main.cjs`, `electron-builder.yml`, `.github/workflows/windows.yml`, `public/downloads/*`, `README.md`.
**Interfaces:** consumes static `dist`; produces portable and setup EXE.
- [x] renderer 보안 및 로컬 경로 설정 검사.
- [x] `npm run desktop:build` 실행, 실패 원인 해결, PE 산출물·체크섬 검증.
- [x] 실제 산출물을 웹 다운로드에 연결하고 최종 웹 빌드.

### Task 4: 통합 검증 및 재사용
**Files:** `README.md`, `docs/*`, environment draft install_script/start_skill.
- [x] 테스트/빌드/설치 재현과 최종 독립 리뷰, 중요한 문제 수정.
- [x] 검증한 설치·시작 명령과 Windows/정확도 제한을 문서화.
- [x] 재사용 설정 저장, 산출물 위치와 완료/미검증 항목 보고.
