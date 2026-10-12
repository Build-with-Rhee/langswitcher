# 말사이 · LangSwitcher

표준어 ↔ 문화어를 로컬 규칙 모델로 변환하는 웹앱 및 Electron 데스크톱 앱입니다. 양쪽의 변경 표현을 색으로 표시하고, 적용 규칙과 문맥 확인이 필요한 어휘를 보여줍니다. 외부 AI API·로그인·텍스트 수집이 없습니다.

## 실행

Node.js **22.12 이상** (검증 환경: 24.19.0), npm이 필요합니다.

```sh
npm ci
npm run dev
```

개발 서버 포트는 5173입니다. 웹은 React/TypeScript/Vite이며 서버 API 없이 동작합니다. 기본적으로 예문이 표시됩니다. 입력·결과를 자동 저장하지 않습니다.

## 기능

- 표준어→문화어 / 문화어→표준어, 결과를 원문으로 삼아 방향 전환
- 맞춤법·표기 / 어휘 / 등록 표현 띄어쓰기를 세 가지 색으로 강조
- 규칙별 변경 이유, 검색 가능한 규칙 사전, 규범 및 평가 안내
- 어휘·표기·띄어쓰기 옵션, 이름/고유명사 보호
- UTF-8 `.txt` 가져오기·저장, 결과 복사, 반응형 화면
- URL·이메일·Markdown 코드 보호, 조사 이형태 조정, NFC 정규화
- 최대 50,000자, 파일 200KB 이하, 보호어 최대 200개
- Electron Windows x64 portable EXE와 NSIS 설치 파일

## 정확도와 규범

**일반 문장에서 90% 이상 정확하다는 주장은 아직 검증되지 않았습니다.** 규칙 데이터는 직접 작성한 초기 편집 모델이며 완전한 형태소 분석기나 모든 남북 맞춤법·어휘를 포괄하는 번역기가 아닙니다. 일부 중의어에는 제한된 문맥 조건을 적용하고, 미등록 단어는 보존합니다. 특히 고유명사와 중요한 문서는 검토가 필요합니다.

현재 환경에서 국립국어원 및 위키문헌 원문 접근은 네트워크 정책으로 차단되었습니다. 문헌 주소를 기록했으나 원문 전체 대조·최신 판본 확인·언어 전문가 독립 검수는 완료하지 못했습니다. 자료를 읽거나 학습한 것처럼 주장하지 않습니다. 자세한 적용 범위, 예외와 한계는 [규범 분석 문서](docs/linguistic-model.md)에 있습니다.

정확도 목표는 규칙 개발에 쓰지 않은 전문가 검수 코퍼스에서 **양방향 각각 문장 완전 일치율 ≥90%**입니다. 테스트/자체 회귀 예문 통과율을 이 목표의 증거로 사용하지 않습니다.

```sh
npm test
npm run typecheck
npm run evaluate -- --regression
npm run evaluate -- reviewed-corpus.jsonl report.json
```

코퍼스는 JSONL입니다. 각 줄은 `{ "id": "unique", "direction": "south-to-north", "input": "원문", "expected": "검수된 정답" }`, 반대 방향은 `north-to-south`입니다. 평가 도구는 방향별 문장 일치율·문자 오류율·실패 예문을 출력하며 빈 코퍼스와 중복 ID를 거부합니다. 문장별 2,000자 제한. 방향에 표본이 없으면 비율은 null입니다. `data/regression.jsonl`의 16개 예문은 자체 회귀 테스트입니다.

## 브라우저 검증

```sh
npx playwright install chromium
# Linux cloud machine with system Chromium:
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

Windows PowerShell에서는 `$env:CHROMIUM_PATH = (node -e "console.log(require('playwright').chromium.executablePath())")`를 설정한 다음 `npm run test:e2e`를 실행합니다. 테스트는 변환·방향 전환·설정·하이라이트·복사·파일 입출력·사전 검색·HTML 안전성·모바일 배치를 확인합니다.

## Windows EXE

Windows 10/11 x64 빌드를 권장합니다. Electron은 44.7.0으로 고정되어 있으며 전체 의존성은 lockfile에 고정되어 있습니다.

```sh
npm ci
npm run desktop:build
npm run downloads
npm run build
```

- `release/LangSwitcher-0.1.0-x64-portable.exe`: 설치 없이 실행
- `release/LangSwitcher-0.1.0-x64-nsis.exe`: 한국어 NSIS 설치 프로그램
- `public/downloads/manifest.json`: 파일 크기와 SHA-256 목록
- 마지막 웹 빌드에 파일이 포함되어 사이트의 **데스크톱 앱** 버튼으로 내려받을 수 있습니다.

실행 파일은 **서명되지 않았습니다.** 이 환경에서는 Windows 실제 설치·실행을 확인할 수 없습니다. 교차 빌드 및 PE 파일 확인과 Windows 실행 검증은 다릅니다. `.github/workflows/windows.yml`은 `main` push 시 Windows 네이티브 빌드·테스트·산출물 업로드를 실행합니다. 워크플로 완료 여부와 실제 설치·제거 검증은 별도로 확인해야 합니다. 공개 사이트나 GitHub Release에 자동 게시하지 않습니다.

Electron 렌더러는 Node 접근이 없고 contextIsolation/sandbox가 활성화되어 있습니다. 변환은 로컬 정적 파일을 사용하며 외부 네트워크 요청을 차단합니다. 참고 문헌의 허용된 HTTPS 링크만 기본 브라우저로 엽니다. 자동 업데이트와 사용자 입력 기록은 없습니다.

## 정적 사이트 배포

```sh
npm run build
```

`dist/` 전체를 HTTPS 정적 호스팅에 업로드하면 됩니다. 상대 자산 경로라 하위 경로에도 배포할 수 있습니다. Windows 파일 다운로드가 필요하면 먼저 `npm run downloads`를 실행하세요. 서브도메인·클라우드 계정 없이 외부에 사이트를 임의 게시하지 않았습니다. 개발 서버 프로세스는 배포물이 아닙니다.

## 클라우드의 Linux 도구

작업 공간은 이미 격리되어 있습니다. 추가 Git worktree 없이 기존 `/workspace/langswitcher`에서 작업합니다. 홈 디렉터리가 읽기 전용이면 설치와 빌드에서 캐시를 지정합니다.

```sh
XDG_CACHE_HOME=/workspace/.cache electron_config_cache=/workspace/.cache/electron npm ci --cache /workspace/.cache/npm
NODE_USE_ENV_PROXY=1 XDG_CACHE_HOME=/workspace/.cache electron_config_cache=/workspace/.cache/electron node node_modules/electron/install.js
```

NSIS 교차 빌드용 Wine은 electron-builder의 고정된 `toolsets.wine: 1.0.1`로 내려받고 도구의 내장 체크섬을 검증합니다. 이 Wine beta bundle의 ntdll 시작 오류가 발생하면, Linux 빌드 스크립트는 해당 실행에서 생성된 NSIS 중간 파일에서 `UninstallerReader`로 서명되지 않은 제거 프로그램을 추출한 뒤 지원되는 custom script로 기본 설치 템플릿을 컴파일합니다. 패키지 검증을 끄거나 npm 의존성 파일을 수정하지 않습니다. Windows 빌드는 기본 절차를 사용합니다.

이 Debian 환경용 `scripts/cloud-tools.py`는 공식 저장소의 서명된 InRelease와 패키지 SHA-256을 검증하고 Xvfb를 `/workspace/.tools/langswitcher`에 추출합니다. 시스템 파일을 바꾸거나 TLS·서명 검증을 끄지 않습니다. 일반 Windows 개발에는 이 도구가 필요하지 않습니다.

```sh
python scripts/cloud-tools.py
/workspace/.tools/langswitcher/usr/bin/Xvfb :97 -screen 0 1280x1024x24 -nolisten tcp > /tmp/langswitcher-xvfb.log 2>&1 &
# 위 디스플레이가 이미 사용 중이면 다른 번호를 선택하세요.
DISPLAY=:97 XDG_CACHE_HOME=/workspace/.cache ELECTRON_BUILDER_CACHE=/workspace/.cache/electron-builder npm run desktop:build
DISPLAY=:97 node scripts/smoke-desktop.mjs
```

Linux 데스크톱 스모크 검사는 실제 Electron 창의 변환·격리된 렌더러·네이티브 클립보드를 검사합니다. Windows 실행 검사를 대신하지 않습니다. Linux 가상 디스플레이 없이 Electron을 실행하면 시작하지 못할 수 있습니다.

## 주요 파일

| 위치 | 역할 |
| --- | --- |
| `src/engine/rules.ts` | 어휘 대응, 설명, 참고 문헌, 문맥 조건 |
| `src/engine/convert.ts` | 보호 구간, 가장 긴 표현 우선 매칭, 조사 조정, 변경 위치 |
| `src/engine/evaluate.ts` | 독립 코퍼스 평가 계산 |
| `src/App.tsx`, `src/components/` | 편집기·하이라이트·사전·설정 |
| `electron/` | 제한된 권한의 데스크톱 실행기 |
| `scripts/` | 평가, Windows 빌드, 다운로드 준비, cloud 보조 도구 |
