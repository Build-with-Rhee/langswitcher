# 검증 기록

실행 환경: Debian 13 / Linux x64, Node 24.19.0, npm 11.9.0, 시스템 Chromium, Electron 44.7.0. 실행 시점: 2026-10-12. 이 문서는 실제 실행 결과와 미검증 범위를 구분한다.

## 기능
- Vitest: 52개 단위 테스트 통과. 양방향, 조사·어미, 중의어, 보호 구간, Markdown delimiter, 위치, NFC, 최대 길이, 평가 분모·중복 ID·빈 코퍼스, 외부 링크 허용 목록.
- Playwright Chromium: 7개 브라우저 테스트 통과. 방향 전환, 길이 초과 결과의 안전한 거부, 옵션/하이라이트, 파일 입출력, 최신 결과 복사, 사전/안내, 악성 HTML 텍스트 처리, 모바일 폭.
- Electron Linux + Xvfb: 실제 창에서 변환, renderer `require` 없음, contextIsolation, 사용자 데이터 경로, 네이티브 클립보드 검증 통과.
- TypeScript/Vite 빌드 통과. 글꼴은 정적 자산으로 포함되어 외부 폰트 서버가 필요하지 않다.
- 자체 회귀 코퍼스 16/16 일치 (각 방향 8개). **일반 언어 정확도 또는 독립 90% 평가가 아니다.**
- 데스크톱/모바일 스크린샷을 육안 확인. 디자인 이름: 말사이.
- 최종 production 정적 빌드를 별도 서버에서 실행해 변환, 실제 portable EXE 다운로드와 SHA-256, 네트워크 offline 상태에서의 변환을 확인했다. 브라우저 pageerror 없음. 사이트 ZIP은 정적 파일과 두 실행 파일을 포함한다.

## 독립 리뷰와 수정
별도 리뷰어가 전체 코드 읽기 검토를 수행했다. 발견한 3개 Important 및 1개 Minor를 모두 재현했다. 마지막 항목도 변환 의미를 잘못 바꾸는 실제 결함이므로 Important로 재분류해 한 번의 수정 단계에서 처리했다.

| 문제 | 재현과 수정 |
| --- | --- |
| 결과가 입력 상한보다 길어 방향 전환에서 예외 발생 | 50,000→50,001 결과 테스트 RED→GREEN. 원문 유지하고 메시지 표시 |
| 받침 변화 뒤 예요/라고/나 등의 문법 파손 | 양방향 이에요/이라고/이나 등 이형태 조정 테스트 RED→GREEN |
| 여러 백틱으로 감싼 Markdown 코드가 변환됨 | 구분자 길이를 검사하는 스캐너. 2·4 백틱 테스트 RED→GREEN |
| 초대에 불참→촛대에 불참 | 불참을 불의 문맥 단서로 잘못 인식. 좁은 단서 테스트 RED→GREEN |

## 설치 도구와 공급망
- 패키지 설치는 npm lockfile integrity/TLS 검증을 유지했다.
- Debian Xvfb 도구는 공식 InRelease를 sqv와 기본 Debian 키링으로 검증하고, Packages.xz 및 .deb SHA-256을 대조했다. 시스템 경로 설치 없음.
- Electron/NSIS/압축 도구는 electron-builder의 기본 TLS·체크섬 검증을 유지했다. verification을 비활성화하지 않았다.
- `npm ci`로 lockfile 재설치 후 52개 단위 테스트와 실제 Linux Electron 스모크가 다시 통과했다. 최종 Windows build 명령은 Linux의 자동 NSIS 대체 경로까지 포함하여 exit 0으로 완료했다.
- 최종 산출물: portable 123.0 MiB, NSIS 127.4 MiB. PE 헤더, 서명 없음, SHA-256 및 웹 배포에 복사된 파일 일치를 확인했다. app.asar의 main/navigation/icon이 최종 소스와 일치하고 불필요한 node_modules는 포함되지 않는다.
- Windows portable 생성 성공. NSIS Wine 11 beta toolset에서 ntdll 로딩 오류를 진단했다. Linux에서는 해당 빌드가 만든 최신 NSIS 중간 파일에서 electron-builder의 `UninstallerReader`로 unsigned 제거 프로그램을 추출하고, 지원되는 custom script로 원래 NSIS 설치 템플릿을 컴파일한다. 오래된 파일을 사용하지 않는다. Windows에서는 기본 네이티브 절차를 사용한다.
- `npm audit --omit=dev`: 0개. 전체 audit: 개발 도구 경로의 `sprintf-js` 관련 moderate advisory가 8개 패키지에 전파되어 표시된다. 최신 sprintf-js 1.1.3도 해당 범위이며 호환 가능한 패치가 공개되지 않아 강제 다운그레이드/검증 우회하지 않았다. 이 의존성은 변환 엔진의 런타임 경로가 아니다.

## 미검증 항목
- 국립국어원 및 문화어 규범 원문 대조·최신 판본·언어 전문가 검수: 네트워크 403 및 자료 부재로 미완료.
- 독립 코퍼스 양방향 90% 목표: 정답 코퍼스 부재로 미검증.
- Windows 네이티브 설치/실행/제거: 현재 Linux 호스트이므로 미검증. GitHub Windows workflow는 main push 시 실행되며 원격 완료 상태는 별도 확인 대상이다.
- 공개 사이트 호스팅 및 환경 Publish: 수행하지 않음. 정적 `dist`와 설치 파일을 준비하는 것과 외부 게시·환경 게시를 구분한다.

## 재사용 설정
환경 초안의 `install_script`와 `start_skill` 저장 성공. source 참고 사이트 3개 도메인 추가도 저장되어 있다. 현재 파일·의존성·생성 실행 파일은 준비했으며, 사용자 환경 설정의 저장/Publish 및 새 태스크 복원 검증은 별도 단계다. 프로세스는 스냅샷에 의존하지 않고 시작 지침대로 다시 띄운다.
