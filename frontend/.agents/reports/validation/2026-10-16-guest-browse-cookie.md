# Issue #244 둘러보기 쿠키 검증 보고서

- 검증일: 2026-10-16 (Asia/Seoul)
- 검증자: Codex
- 대상: Dayro-dev/dayro #244, `fix/#244-guest-browse-cookie`
- 커밋: `9863c7e` (lint chore), `ee9bbd9` (쿠키 수정), 기준 `origin/develop`
- Verdict: **approve** (저장소 결정값: `approved`)
- 승인 차단 finding: 없음. 아래 참고사항은 범위 확장이나 기존 상태에 관한 비차단 항목이다.

## 의도와 검증 범위

Intent source: `.agents/intent/{prd,sdd,tasks}/2026-10-16-guest-browse-cookie.md`.
성공 기준은 새 둘러보기 선택의 24시간 유효기간, 만료 후 비회원 `/` 시작 화면, 로그아웃 응답의 둘러보기 쿠키 삭제다. 회원탈퇴와 다른 URL 직접 진입은 제외한다.

사용자가 지정한 다음 파일을 method A(경로 기반 직접 읽기)로 검토했다.

- `src/features/onboarding/model/root-entry.ts`
- `src/features/onboarding/server/expire-guest-browse-cookie.ts`, `server/index.ts`
- `src/app/api/auth/logout/route.ts`
- `src/features/onboarding/test/root-entry.test.ts`, `expire-guest-browse-cookie.test.ts`
- `src/e2e/onboarding/onboarding.spec.ts` (마지막 두 테스트 포함)
- `eslint.config.mjs`

추가 확인: onboarding의 `lib/guest-browse-cookie.ts`, `server/get-root-entry.ts`, 클라이언트 공개 배럴, `shared/api/server-auth-cookies.ts`, `server-auth-client.ts`의 로그아웃 구현.

## 요구사항 및 구조 검토

| 항목 | 결과와 근거 |
| --- | --- |
| 24시간 | `Max-Age=86400`, Path=/, SameSite=Lax. HTTPS에서만 Secure를 붙인다. 단위 테스트에서 문자열과 86400 상수를 확인한다. |
| 만료 후 시작 화면 | 브라우저가 쿠키를 만료하면 `resolveRootEntry`는 인증 쿠키가 없는 경우 start를 반환한다. 24시간 실제 경과는 이번 검증에서 재현하지 않았다. |
| 로그아웃 삭제 | 응답에 동일 이름, host-only(Domain 생략), Path=/, Max-Age=0을 추가한다. 기존 인증 쿠키 만료 헤더도 유지한다. |
| Secure 일치 | Secure는 쿠키 식별 키가 아니다. HTTPS 응답에서 Secure 없는 만료 헤더도 같은 이름/도메인/경로의 Secure 쿠키를 삭제할 수 있으므로 누락 자체는 버그가 아니다. 일반 HTTP에서 발급한 비Secure 쿠키도 삭제된다. HTTPS에서 만든 Secure 쿠키를 일반 HTTP로 내려가 삭제하는 경우에는 브라우저 보호 정책으로 차단될 수 있으며, 프로토콜 전환 지원은 검증하지 않았다. |
| 실패 경로 | 백엔드 reject, 비2xx, 응답 계약 파싱 실패는 try/catch 뒤의 쿠키 정리로 이어진다. access token이 없거나 refresh token만 있어도 백엔드 호출 없이 정리한다. 네트워크 reject와 비회원 경로는 대상 테스트로 확인했다. |
| 보안 | 둘러보기 값은 화면 선택용이며 인증 권한을 부여하지 않는다. JS 쓰기 가능한 쿠키인 것은 의도에 맞고, 인증 토큰의 HttpOnly/Secure 정책을 변경하지 않는다. |
| VSA / server-only | app route가 `@/features/onboarding/server` 공개 배럴을 사용한다. helper와 서버 배럴 모두 server-only 가드가 있고 클라이언트 배럴은 서버 helper를 노출하지 않는다. feature 간 직접 호출이나 책임 과밀 없음. |
| lint 제외 | `.next-perf/**` 빌드 산출물만 전역 제외한다. 앱 소스 제외 확대 없음. 별도 chore 커밋으로 분리됨. |

## Findings 및 비차단 참고사항

1. **Low / rollout limitation** — 기존 세션 쿠키에는 새 Max-Age가 소급 적용되지 않는다. 기존 쿠키 값 `1`은 계속 home으로 판단되므로, 기존 사용자에게는 재발급·로그아웃·브라우저 삭제 전까지 이전 수명이 남는다. 새 선택의 수명 변경이라는 현재 구현 범위는 충족하지만, 배포 즉시 모든 기존 사용자가 24시간 안에 시작 화면으로 복귀한다는 보장은 없다.
2. **Low / 기존 실패 경로 한계** — `logoutWithBackendAccessToken`은 명시적 timeout 없이 await된다. 백엔드가 종료되지 않거나 BFF 응답 자체가 브라우저에 도달하지 않으면 쿠키 삭제를 보장하지 못한다. 이번 변경의 회귀는 아니며, 실패 후 정리와 무응답 시 정리는 구분해야 한다.
3. **Low / doc_mismatch** — SDD는 이름과 경로를 model 한 곳에서 정의한다고 하지만 이름만 상수이고 `/`는 발급·만료 양쪽에 리터럴로 있다. 현재 값은 일치하므로 동작 문제는 없다. tasks는 아직 in-progress/미체크 상태이며, 기존 E2E의 “this visit only/새 브라우저 세션” 설명도 24시간 정책에 맞춰 정리할 여지가 있다. 새 독립 context 테스트는 브라우저 재시작 후 지속성 검증이 아니다.
4. **Info / evidence limit** — HTTPS 실제 브라우저 삭제, 24시간 경과 및 기존 쿠키 마이그레이션은 직접 실행하지 않았다. 제공된 E2E는 쿠키 expires 값과 로그아웃 후 시작 화면을 검증한다.

## 검증 명령과 결과

Codex 직접 실행 (frontend 기준):

- `npm run test:unit -- src/features/onboarding/test/root-entry.test.ts src/features/onboarding/test/expire-guest-browse-cookie.test.ts` → **2 files / 9 tests pass**, exit 0.
- `npx --no-install eslint src/features/onboarding/model/root-entry.ts src/features/onboarding/server/expire-guest-browse-cookie.ts src/features/onboarding/server/index.ts src/app/api/auth/logout/route.ts src/features/onboarding/test/root-entry.test.ts src/features/onboarding/test/expire-guest-browse-cookie.test.ts src/e2e/onboarding/onboarding.spec.ts eslint.config.mjs` → **exit 0**, 출력 오류 없음.
- 저장소 루트 `git diff --check origin/develop...HEAD` → **exit 0**.
- `git log`, `git branch --show-current`, diff stat로 대상 브랜치·커밋·11개 변경 파일 범위를 확인했다.

사용자 제공 Claude evidence (Codex 재실행/원본 로그 독립 검증 아님): tsc OK, eslint 0 errors, Vitest 143 files / 1051 tests pass, scripts node 46 tests pass, next build OK, route bundle budget OK, Playwright onboarding + auth/menu-login-return 13 pass. 전체 빌드와 전체 테스트는 제공된 결과 및 변경 범위를 고려해 재실행하지 않았다. E2E 결과는 사용자가 직접 제공한 증거로 사용했다.

Evidence Gate: 대상 테스트·lint 직접 통과, 구조 리뷰 완료, 전체 검증은 출처를 구분한 사용자 제공 evidence로 승인 판단. 직접 실행한 검증 실패 없음.

## 적용 문서와 실행 기록

- `AGENTS.MD`, `.agents/README.md`, `context/README.md`, `intent/README.md`, `intent/active/index.md`: 작업 범위와 문서 선택 기준. 사용자가 지정한 #244 intent를 우선 사용했다.
- #244 PRD/SDD/tasks: 수명·삭제·공개 서버 경계 acceptance criteria.
- `.agents/agents/validation.md`: 독립 코드 검토, 소스 무수정, 증거 구분.
- `.agents/guides/bff.md`, `server-client-boundary.md`: BFF 쿠키 정리와 server-only/public barrel 판정.
- `.agents/guides/client-logic-separation.md`, `.agents/domain/login.md`: 브라우저 쿠키 쓰기와 인증 처리의 UI 외부 책임 확인.
- `.agents/harness/{README,observability}.md`, `.agents/reports/README.md`: evidence gate, 한계 및 보고 형식.
- `.agents/skills/verification-before-completion/SKILL.md`: 결과 주장 전 대상 검증 실행.
- 참조된 `.agents/guides/performance.md`는 현재 없음. 성능 구현 변경은 없고 lint 산출물 제외만 있어 차단하지 않았다.
- 접근성·Storybook·디자인/UI 스킬은 UI 변경이 없어 제외. 공용 UI 재사용 판단도 해당 없음.

Loop: 검증 1회, 구현 수정/재시도 없음. 사용자 메시지를 구현자 handoff로 사용. Evidence bundle: targeted Validation/BFF review. 요청과 문서의 실질적 범위 충돌 없음; verdict 표기는 요청의 approve를 사용하고 저장소 approved에 대응했다. 추가 사용자 확인 불필요.

이 보고서만 작성했다. 시작 시 존재하던 `frontend/AGENTS.MD` 변경은 보존했다. tasks 상태, SDD 경로 상수 설명 및 기존 테스트 설명은 수정하지 않았다. 영상·Notion 작업은 이번 검증 요청 범위 밖이다.


## 2차 검증 — 86e2b1b

- 검증일: 2026-10-16 (Asia/Seoul)
- 대상 HEAD: `86e2b1b405efdd872ee2d2b5160f06356a2312e1` (직전 `cca484a`, `ee9bbd9`)
- **Verdict: changes requested** / 저장소 결정값 `rejected`.
- 1차 판정은 당시 변경에 대한 기록으로 보존한다. 이번 판정은 추가 방문 정책과 guard 변경에 대한 것이다.
- Intent source: 동일 PRD/SDD/tasks의 2차 섹션 및 사용자의 2차 요청. 요구사항: 닫고 재방문하면 24시간 내에도 시작 화면, 닫지 않은 방문은 최대 24시간 유지, 로그아웃은 `/`, 메뉴 로그인 복귀는 유지.

### Findings

**[P2 / Medium] 새 탭이 아직 사용 중인 기존 탭의 방문까지 종료한다.**

- 위치: `src/features/onboarding/model/root-entry.ts:60`–62.
- 재현: 탭 A에서 둘러보기 선택 → A는 열어 둔 채 같은 사이트를 주소 직접 입력/독립 새 탭 B로 열기 → B의 sessionStorage에는 표시가 없어 공유 쿠키 삭제 → A에서 `/`를 새로 요청하면 시작 화면.
- A에는 방문 표시가 계속 있지만 쿠키를 복구하거나 탭별 서버 분기에 전달하는 경로가 없다. 따라서 “닫지 않고 계속 돌아다니는 동안 홈 유지”가 다른 탭의 진입으로 깨진다.
- 새 탭 자체를 새 방문으로 취급하는 SDD 정책과 별개로, 기존 탭의 진행 중인 방문까지 초기화하는 것은 피해야 한다. 탭별 상태와 origin 전체 쿠키의 수명 모델을 일치시키고, A를 닫지 않은 상태에서 B를 열어도 A의 방문이 유지되는 회귀 검증이 필요하다.
- 증거: 실제 root-entry.ts를 TypeScript transpile 후 Node VM에서 생성 스크립트로 실행. 공유 cookie와 서로 다른 marker를 모델링했으며 B 실행 뒤 A의 resolveRootEntry가 start임을 assert했다. 실제 브라우저 다중 탭 E2E는 이번에 실행하지 않았다.

**[P2 / Medium] 세션 복원 시 종료 후 재방문 정책이 적용되지 않는다.**

- 위치: `src/features/onboarding/model/root-entry.ts:60`, SDD의 “브라우저 탭 복원은 닫지 않은 것으로 봄”.
- sessionStorage는 새 독립 탭에서는 비지만 브라우저의 탭/세션 복원 시 복원될 수 있다. 표시 `1`이 복원되면 guard는 바로 return하므로 아직 24시간이 지나지 않은 쿠키를 유지하고 홈을 표시한다.
- 현재 E2E의 page.close + context.newPage는 독립 새 탭만 검증한다. 브라우저 종료 후 이전 세션 복원이나 닫은 탭 다시 열기를 검증하지 않는다. opener가 있는 새 탭도 표시를 복사할 수 있어 “새 탭”과 “표시 없음”은 동치가 아니다.
- 사용자 요청은 종료 후 재방문을 요구하지만 SDD는 복원을 예외로 추가했다. 이 예외를 사용자 승인된 요구사항처럼 간주할 수 없다. 지원 가능한 방문 정의와 복원 시 행동을 먼저 일치시키고 구현/검증해야 한다. 웹 API만으로 모든 브라우저 종료와 복원을 정확히 구별할 수 있다고 주장해서는 안 된다.
- 증거: 복원된 marker=1을 실제 생성 스크립트에 주면 쿠키가 유지됨을 VM assert로 확인. 브라우저별 세션 복원 자체는 재현하지 않았다.

### 추가 검토 / 비차단 사항

- **paint 전 실행:** root layout의 실제 `<head>`에 동기 classic inline script를 두므로 정상 HTML 파싱에서는 body 파싱·첫 화면 표시 전에 실행하는 구조다. async/defer/afterInteractive가 아니다. 다만 실제 streaming 응답의 paint trace는 수집하지 않았으므로 “모든 경우 깜빡임 없음”까지 실측 확인한 것은 아니다. 일반적인 제3자 스크립트용 next/script 권고보다 이번 pre-paint 목적을 우선해 native script 자체는 finding으로 보지 않는다.
- **reload 루프 (Low, 조건부):** 정상 쿠키 삭제가 반영되면 다음 요청에서는 쿠키가 없어 한 번만 replace된다. 삭제 성공 확인·재시도 상한은 없다. 동일 이름의 다른 Domain/Path 쿠키가 남거나 쓰기가 무시되는 경우 매번 hide/replace를 반복할 수 있다. VM에서 setter가 삭제를 무시하는 조건으로 두 번 연속 replace를 확인했지만, 정상 host-only Path=/ 발급 경로에서 발생하는 오류로 단정하지 않는다. 제한된 재시도 또는 삭제 확인을 권고한다.
- **sessionStorage 차단:** getItem이 throw하면 catch로 빠져 24시간 쿠키만 유지한다. setItem만 실패하고 getItem은 가능한 환경에서는 다음 hard load에 표시가 없어 방문이 초기화될 수 있다. SDD에 적힌 best-effort fallback이며, 모든 환경에서 종료 정책이 보장되는 것은 아니다.
- **bfcache / SPA:** head 스크립트는 새 document에서 실행된다. bfcache 복귀 및 App Router의 기존 layout 유지 이동에서는 다시 실행되지 않으며 pageshow 처리가 없다. 쿠키가 만료/삭제되어도 이전 home DOM이 복원되는 경우를 현재 테스트가 다루지 않는다. 24시간 경과 즉시 현재 열린 화면을 바꾸는 타이머도 없다. 실제 브라우저 bfcache/캐시 만료 검증은 not_run.
- **회원 + 둘러보기 쿠키:** 인증 토큰은 HttpOnly이므로 guard는 회원 여부를 검사하지 않는다. 회원에게도 둘러보기 쿠키가 있고 탭 표시가 없으면 삭제와 `/` reload가 한 번 발생한다. 서버의 회원 우선 분기 덕분에 온보딩으로 보내지는 않지만 불필요한 추가 요청은 발생한다. “쿠키 없음(회원)” 단위 테스트는 이 혼합 상태를 검증하지 않는다.
- **하이드레이션:** 스크립트 문자열 자체는 결정적이다. reload 분기는 React가 렌더한 html에 없는 style=visibility:hidden을 추가하므로 이동 완료 전에 hydration이 진행되면 속성 불일치 경고 가능성이 있다. 정상 reload 뒤 새 document에는 해당 변이가 없다. navigation 실패/취소 시 visibility 복구가 없어 빈 화면이 남을 가능성도 있다. 콘솔/느린 navigation 실측은 하지 않았으므로 확정 재현 finding과 구분한다.
- **CSP / 보안:** `next.config.ts`가 모든 경로에 `buildSecurityHeaders`를 적용한다. enforce CSP는 frame-ancestors/base-uri/object-src 및 보고 지시어만 있으며 script-src/default-src가 없다. Report-Only에는 script-src unsafe-inline이 있다. 따라서 저장소 설정 기준 guard는 차단되지 않는다. CDN의 추가 헤더는 확인하지 않았다. 스크립트에는 고정 상수만 삽입되고 사용자 입력이 없어 이번 변경에서 XSS 삽입 경로는 발견하지 못했다.
- **VSA:** app/layout → onboarding/server 공개 API → GuestVisitGuard 흐름은 적절하다. 서버 배럴은 server-only이고 GuestVisitGuard는 서버에서 script 마크업만 생성하는 컴포넌트다. UI 디렉터리에 있다는 이유만으로 client component가 되는 것은 아니다. 정책 문자열 생성은 model에 분리되어 있다. 별도 기본 배럴로 되돌릴 필요 없다.
- **로그아웃 / 메뉴 로그인:** useLogout의 replace('/') + refresh(), useAccountMenu에서 로그아웃의 next/onBeforeLogin 제거를 확인했다. 메뉴 로그인은 기존 경로·쿼리 next 및 onBeforeLogin을 유지한다. 요청한 책임 분리는 충족한다. 기존 BFF 실패 경로 검토는 1차 결과가 계속 적용된다.
- **테스트 helper:** browseAsGuest의 addInitScript는 모든 새 document에 표시를 넣으므로 이 helper를 쓰는 테스트는 방문 종료를 검증할 수 없다. 추가 onboarding 테스트는 helper를 사용하지 않아 독립 새 탭 시나리오에는 유효하다. helper 쿠키에는 실제 24시간 expires가 없어 수명 검증에도 쓰면 안 된다.

### 실행한 검증과 증거 출처

직접 실행:

1. `npm run test:unit -- src/features/onboarding/test src/features/auth/test/menu-login.test.ts` → **5 files / 32 tests pass**, exit 0.
2. `npx --no-install eslint`에 이번 요청의 변경 TS/TSX 파일 12개를 명시 → **exit 0**, 오류 출력 없음.
3. Node + TypeScript transpile + VM으로 실제 `buildGuestVisitGuardScript`를 실행: 공유 쿠키를 쓰는 두 탭, 복원된 marker, 삭제 무시 시 반복 replace의 세 assertion 모두 확인. 소스/테스트 파일 추가나 변경 없이 stdin 스크립트로 실행.
4. git log/status로 HEAD와 기존 AGENTS.MD 미커밋 변경 확인.

사용자 제공 Claude 결과(독립 재실행 아님): tsc OK, eslint 오류 0, Vitest 144 files / 1057 tests, next build OK, `/share/course` 번들 684601B / limit 688926B, Playwright 전체 88 pass. 기존 테스트 통과는 위 미포함 경계 시나리오의 요구 충족 근거가 되지 않는다. 전체 빌드·E2E·브라우저 세션 복원은 이번에 재실행하지 않았다.

### 문서 및 gate 기록

- 사용자가 지정한 모든 구현/테스트/intent 파일을 경로로 직접 읽었다. 추가로 next.config.ts, security-headers.ts, vitest.config.ts를 확인했다.
- 1차에 읽은 AGENTS.MD, validation, BFF, server-client-boundary, client-logic-separation, harness/reports 기준을 재사용했다. 추가로 next-best-practices SKILL.md 및 scripts/hydration-error/rsc-boundaries 문서를 읽어 script 실행과 서버 컴포넌트 경계를 검토했다. verification-before-completion 원칙에 따라 대상 테스트를 새로 실행했다.
- 작업 유형: 검증. 관련 trigger: 브라우저 저장소, root layout, 서버 공개 배럴, 인증 흐름, 인라인 스크립트/CSP. UI 외형·공용 primitive 변경은 없어 Storybook/디자인 재사용 검토는 해당 없음.
- 문서 충돌: 사용자 종료 후 재방문 정책과 SDD의 브라우저 탭 복원 예외. 이번에는 코드나 정책을 임의 변경하지 않고 finding으로 기록했다.
- Evidence Gate: 실행한 대상 테스트/lint는 통과. Acceptance Gate: 다중 탭 및 복원 정책 미충족으로 승인 불가.
- Failure taxonomy: implementation_bug, doc_mismatch; 브라우저별 복원/bfcache/paint/hydration에는 추가 evidence 필요.
- Loop: 2차 리뷰 1회, 소스 수정·재시도 없음. 요청에 따라 이 보고서에만 추가 기록하고 기존 AGENTS.MD 변경은 보존했다.
- 후속: 방문 상태의 공유 범위를 정리하고 두 P2 시나리오를 해결한 뒤 재검증. 로그아웃 이동과 server barrel 변경은 유지 가능.


## 3차 검증 — d3cde72

- 검증일: 2026-10-17 (Asia/Seoul), Codex.
- 대상: `wt-244`, HEAD `d3cde72`.
- **Verdict: changes requested** (저장소 결정값 `rejected`). 이전 판정 기록은 보존한다.
- Intent source: 사용자의 3차 결정 및 동일 PRD/SDD/tasks 3차 섹션. 30분 미사용은 새 방문, 새 탭은 새 방문, 기존 열린 탭은 홈 유지, 로그아웃은 시작 화면이라는 기준으로 검토했다.
- 2차의 복원 정책 불일치는 이번 명시적 사용자 결정으로 해소됐다. 기존 탭의 쿠키 복원도 추가됐으나, 탭별 화면 정책과 공유 쿠키 사이에 아래 결함이 남는다.

### Findings — 수정 필요

**[P2 / Medium] 새 방문 탭이 다른 탭의 복원 쿠키로 온보딩을 건너뛸 수 있다.**

- 위치: `src/features/onboarding/model/guest-visit.ts:75` (firstLoad=false에서 표시 없음은 none).
- 재현 순서: A에서 둘러보기 → B를 독립 새 탭 `/faq/`로 열면 공유 쿠키 삭제 → A로 돌아와 쿠키 복원 → B에서 둘러보기를 선택하지 않고 클라이언트 이동으로 `/` 진입.
- 서버는 A가 복원한 공유 쿠키를 보고 home을 반환한다. B에는 방문 표시가 없지만 tracker는 firstLoad=false라 아무것도 하지 않는다. 루트 head guard는 SPA 이동에서 재실행되지 않는다. 따라서 B의 새 방문 정책이 유지되지 않는다.
- 추가된 E2E는 B의 첫 시작 화면과 A의 홈 복원까지만 검사하고, A가 복원한 다음 B의 이동은 검사하지 않는다.
- 개선 조건: 기존 A의 진행 중인 방문을 유지하면서 B의 서버/클라이언트 화면 판단에는 B가 둘러보기를 선택했는지가 반영되어야 한다. firstLoad만으로 서로 다른 탭의 정책을 구분할 수 없다.

**[P2 / Medium] 다른 탭의 유효한 표시가 로그아웃으로 지운 쿠키를 되살린다.**

- 위치: `src/features/onboarding/model/guest-visit.ts:80`, `:87`; `src/features/auth/hooks/useLogout.ts:42`.
- 재현 순서: A에 유효한 둘러보기 표시가 남아 있는 상태에서 로그인 → B에서 로그아웃 → BFF가 인증/둘러보기 쿠키를 삭제하고 B만 표시 삭제 → A의 visible/사용 이벤트가 restore 수행.
- A는 쿠키 부재가 새 탭 때문인지 로그아웃 때문인지 구별하지 못한다. B의 다음 SPA 홈 요청은 복원 쿠키로 home이 된다. BFF 응답 후 B의 refresh 요청 전에 A의 이벤트가 들어오면 로그아웃 직후 홈 응답을 받는 경합도 가능하다.
- 인증 토큰이나 로그인 권한이 복구되는 보안 취약점은 아니다. 하지만 명시적 로그아웃의 시작 화면 정책과 둘러보기 삭제가 무효화되는 기능 결함이다.
- 개선 조건: 로그아웃을 탭 간 방문 무효화로 구분할 수 있어야 하며, 오래된 표시로 복원하지 못하게 해야 한다. 새 탭 진입과 명시적 로그아웃은 서로 다른 의미다. 다중 탭 로그아웃 회귀 검증이 필요하다.

**[P2 / Medium] 쿠키가 먼저 자연 만료되면 오래된 홈 화면을 갱신하지 않는다.**

- 위치: `src/features/onboarding/model/guest-visit.ts:97`, `src/features/onboarding/ui/GuestVisitTracker.tsx:37`.
- 재현 순서: `/`에서 홈을 열어 둔 채 24시간이 지나 브라우저 쿠키가 자연 만료 → visible 또는 다음 사용자 입력으로 tracker 실행.
- 방문 표시는 expire로 정리되지만 cookieOn=false여서 homeChanged=false다. 현재 DOM은 쿠키가 만료되기 전에 받은 home인데 refresh가 호출되지 않는다. 이후 표시도 없어 다음 tracker 실행은 none이 된다. hard reload 전까지 오래된 홈이 남을 수 있다.
- 비슷하게 다른 탭이 이미 쿠키를 지운 상태에서 현재 탭의 idle 만료를 처리해도 현재 DOM과 쿠키 상태가 다를 수 있다. homeChanged를 현재 쿠키의 존재만으로 판단하면 안 된다.
- 개선 조건: 첫 서버 응답을 검사하는 head 경로와 이미 렌더된 화면을 갱신하는 tracker 경로를 구분하고, 만료된 방문의 기존 홈도 시작 화면으로 전환하는 검증을 추가한다.

**[Low / 구조 규칙] UI 파일에 effect와 브라우저 이벤트 orchestration이 직접 들어 있다.**

- 위치: `src/features/onboarding/ui/GuestVisitTracker.tsx:25`–55.
- `.agents/guides/client-logic-separation.md`는 UI 안 useEffect 및 이벤트 등록/해제를 금지하고 해당 책임을 feature/hooks에 두도록 명시한다. return null인 tracker도 현재 경로는 ui이며 해당 예외는 문서에 없다.
- 상태 판단 함수의 model 분리는 적절하다. 남은 effect·throttle·refresh orchestration을 hook으로 옮기는 것이 저장소 컨벤션에 맞다. 소스는 이번 검증에서 변경하지 않았다.

### 운영 빌드 및 엣지케이스 검토

- **toString 자기완결:** `.next/server/chunks/ssr/[root-of-the-server]__0tv6jda._.js`의 실제 head 생성 코드와 minify된 함수를 확인했다. 함수 본문은 인자 및 Date/document/window/JSON/Math만 사용하며 외부 모듈 별칭을 참조하지 않는다. TypeScript AST로 해당 함수 표현식을 추출해 독립 VM에서 실행했다. 이 워크트리에 존재하는 빌드 산출물 기준 통과이며 이번에 새 빌드를 생성하지 않았다. 장래 minifier 변경에도 유지된다는 보장은 별도 빌드 검증이 필요하다.
- **정상 restore/refresh 루프:** 정상 쿠키 저장 후 다음 guard 실행은 restore → touch로 안정화된다. expire는 표시를 삭제하므로 tracker 재실행은 none이다. 동일 pathname의 refresh가 바로 동일 effect를 반복시키는 구조도 아니므로 정상 단일 탭의 무한 refresh 루프는 발견하지 못했다.
- **탭 간 핑퐁:** marker 없는 B의 tracker가 쿠키를 반복 삭제하지 않는 점은 개선됐다. 다만 B의 hard reload는 다시 expire, A의 활성화는 restore이므로 탭 간 전역 쿠키 변동은 계속 가능하다. 위 첫 finding처럼 삭제를 하지 않는 것만으로 B의 화면 정책까지 충족하지는 않는다.
- **삭제/복원 실패:** cookie 쓰기 성공 여부를 확인하지 않고 homeChanged를 반환한다. 읽을 수 있으나 삭제되지 않는 쿠키, Domain/Path가 다른 동명 쿠키 등의 조건에서는 head replace 반복 위험이 남는다. 정상 발급 쿠키 경로에서의 발생을 재현한 것은 아니므로 조건부 참고사항이다.
- **회원 탭:** auth 여부를 guard가 검사하지 않으므로 로그인 전에 만든 marker가 남은 회원 탭에서도 restore/expire가 실행된다. 인증 우선 서버 분기로 회원을 온보딩으로 보내지는 않지만 추가 refresh와 공유 쿠키 변경은 발생한다. 로그아웃 후에는 두 번째 finding의 문제가 된다.
- **idle / 시간:** 비교는 `>`이므로 정확히 30분 경계는 새 방문이 아니다(사용자 표현은 “이상”, PRD는 “넘게”). 또한 touch가 1분 간격이라 마지막 실제 입력과 저장 시각에 최대 약 1분 오차가 있다. Date.now의 시계 변경에도 영향을 받는다. 낮은 우선순위의 경계/정확도 참고사항이다.
- **opener / bfcache:** opener로 복사된 유효 marker가 있는 새 탭은 기존 방문으로 취급된다. 독립 새 탭 E2E는 이 경로를 검증하지 않는다. visible/사용 이벤트가 idle 재평가를 보완하지만 pageshow 핸들러가 없어 모든 bfcache 복귀 경로를 독립 확인한 것은 아니다.
- **pre-paint / hydration:** 동기 head script가 body 전 판단하는 구조는 유지된다. visibility 변이 및 replace 지연 시 hydration 경고/숨김 유지 가능성은 2차 참고사항이 계속 적용되며 이번에는 실제 paint trace나 console 검증을 하지 않았다.
- **CSP / 보안:** 2차에서 확인한 enforce CSP에는 script-src/default-src가 없어 inline guard 차단 없음. 고정 config를 JSON.stringify해 사용하고 사용자 입력을 코드로 삽입하지 않는다. sessionStorage와 둘러보기 쿠키는 인증 권한 근거가 아니다.

### VSA 및 번들

- `shared/lib/guest-visit-marker.ts`는 onboarding/auth 두 feature가 공유하는 키와 삭제 동작만 포함한다. feature 간 직접 import를 만들지 않은 승격 근거가 있다.
- `features/onboarding/visit.ts`는 루트 layout용 명시적 공개 진입점이다. client tracker와 정적 script 마크업을 함께 내보내지만 next/headers나 서버 비밀 의존성을 노출하지 않는다. server-only 전용 helper가 client graph에 유입되는 형태는 아니므로 진입점 자체는 허용 가능하다. 실제 BFF helper는 별도 server-only 배럴에 남는다.
- tracker 내부 UI/hooks 책임은 위 구조 finding으로 별도 기록했다.
- 사용자 제공 `/share/course` 687370B / 688926B는 **1556B 여유**로 예산 내다. 별도 번들 재측정은 하지 않았다. 작은 여유는 향후 변경 시 주의점이며 현재 초과로 판정하지 않는다.

### 직접 실행한 검증

- `npm run test:unit -- src/features/onboarding/test src/features/auth/test/menu-login.test.ts src/features/auth/test/logout.test.ts` → **6 files / 43 tests pass**, exit 0.
- 요청 변경 TS/TSX 10개 파일에 `npx --no-install eslint` 실행 → **exit 0**, 오류 출력 없음.
- `git diff --check HEAD^ HEAD` → **exit 0**.
- Node stdin 검증: TypeScript AST로 운영 minify 함수 추출 → 독립 VM에서 공유 cookie와 탭별 Map 저장소를 사용해 다음을 assert했다.
  - B firstLoad expire → A restore → B tracker none, 공유 쿠키 유지.
  - 로그아웃으로 cookie와 B marker 삭제 → A restore → B homeChanged=false.
  - 자연 만료 cookie 없음 + 24시간 지난 marker → expire, homeChanged=false.
  - 정상 restore 다음 실행 → touch (반복 refresh 요구 없음).
- 위 검증은 실제 빌드 함수의 상태 전이 재현이다. React DOM/브라우저 다중 탭 UI 전체를 직접 재현했다고 주장하지 않는다. 테스트나 소스 파일을 추가하지 않고 stdin으로 실행했다.

사용자 제공 Claude evidence(이번 Codex 독립 재실행 아님): tsc OK, eslint 오류 0, Vitest 1065, 전체 E2E 90 두 차례, start 모드 onboarding/auth/home 21, build 및 번들 예산 통과. 추가 E2E 두 개를 직접 읽었으며 각각 31분 지난 marker + reload, 새 탭 진입 후 기존 탭 복원까지만 검증함을 확인했다. 다중 탭 로그아웃/복원 후 새 탭 SPA 이동/자연 만료 후 DOM 갱신은 포함되지 않았다.

### 기준 문서 및 gate 기록

- 작업 유형: 검증. 읽은 구현/테스트는 사용자 지정 전체 파일 및 lib/guest-browse-cookie.ts, server/index.ts. PRD/SDD/tasks의 3차 섹션을 직접 읽었다.
- 1·2차에 읽은 AGENTS.MD, validation, BFF, server-client-boundary, harness/reports 및 Next 스킬 기준을 재사용했다. client-logic-separation 원문 금지 조항은 다시 확인했다. verification-before-completion 원칙에 따라 대상 검증을 새로 실행했다.
- trigger: root layout·client effect·브라우저 저장소·쿠키·auth·공개 진입점·번들. UI 디자인/primitive 변경은 없어 Storybook 및 디자인 재사용 평가는 해당 없음.
- 사용자 결정과 2차 복원 예외의 충돌은 해소됨. SDD 2차의 marker="1"/server 배럴 설명은 3차 구조로 대체된 과거 기록으로 해석했다. 별도 승인 질문 없이 요청된 검증을 완료했다.
- Evidence Gate: 대상 테스트/lint와 운영 함수 실행은 통과. Acceptance/Boundary Gate: 위 기능 결함과 UI/hooks 규칙 위반으로 승인 불가.
- Failure taxonomy: implementation_bug, boundary_conflict. 브라우저 paint/bfcache/복원·전체 E2E는 not_run (사용자 제공 증거 활용, 이번에는 상태 전이와 대상 테스트에 집중).
- Loop: 3차 검증 1회. 소스 수정 없음. 동일 보고서에만 추가했고 기존 AGENTS.MD 미커밋 변경은 보존했다. 후속은 위 세 기능 시나리오 및 tracker 책임 분리 수정 후 재검증이다.


## 4차 검증 — 7ba1a8d

- 검증일: 2026-10-17 (Asia/Seoul), Codex.
- 대상 HEAD: `7ba1a8de557240cc0cc201a1c2871cb97c1196a6`, wt-244.
- **Verdict: changes requested** (저장소 결정값 `rejected`).
- 의도 기준: 사용자 4차 요청, SDD의 “4차 구조 (최종)”. 이전 쿠키 기반 설계는 대체된 것으로 판단한다.

### 이전 기능 지적의 해소

3차 P2 세 건은 공유 쿠키 제거로 해소됐다. 각 document의 sessionStorage와 html 속성만 변경하므로 A의 방문 상태가 B의 SPA 화면이나 로그아웃 결과를 덮어쓰지 않는다. 시간 만료 시 속성을 제거해 기존 guest home을 직접 숨기므로 서버 refresh 여부에도 의존하지 않는다. guard/tracker에는 reload·restore·router.refresh가 없어 해당 핑퐁/갱신 루프도 제거됐다. 로그아웃 route는 `git diff origin/develop -- frontend/src/app/api/auth/logout/route.ts` 결과 차이가 없다.

### Findings

**[P2 / Medium / 접근성] 숨은 홈의 body 포털은 숨겨지지 않으며 키보드 탐색과 열린 메뉴 상태가 시작 화면에 남는다.**

- 관련 위치: `src/app/page.tsx` guest-entry-home 래퍼, `src/app/globals.css` 마지막 숨김 규칙, `src/shared/ui/layout/SideMenu.tsx`의 createPortal(drawer, document.body), `src/shared/ui/lib/useModalDialog.ts`.
- HomeScreen은 CSS로만 숨겨지고 AccountMenu/SideMenu는 계속 마운트된다. SideMenu의 실제 drawer는 body 직속 포털이므로 `.guest-entry-home { display:none }`의 자손이 아니다.
- 초기 시작 화면에서도 닫힌 drawer는 opacity-0/pointer-events-none/aria-hidden만 적용한다. 닫기 button과 로그인 Link에 inert/display:none/tabIndex=-1 처리가 없다. aria-hidden과 pointer-events-none은 순차 키보드 포커스를 막지 않으므로 보이지 않는 메뉴 컨트롤이 Tab 순서에 남는다. 기존 홈의 SideMenu 문제를 비회원 시작 화면까지 새로 노출하는 회귀다.
- 둘러보기 홈에서 계정 메뉴를 연 뒤 31분 미사용 상태로 돌아오는 경우, guard는 html 속성만 제거한다. menuOpen은 true인 채 유지되어 포털 메뉴가 시작 화면 위에 계속 보이고 useModalDialog의 document keydown 포커스 트랩도 남는다. 이것은 display:none으로 일반 DOM을 제외하는 것과 별개의 문제다.
- 수정 조건: 숨은 화면의 포털/모달 수명과 열림 상태도 화면 활성 상태에 연결하고, 닫힌 drawer는 실제 키보드 탐색 대상에서 제외해야 한다. 시작 화면의 전체 Tab 순서 및 열린 메뉴 → idle 만료 전환을 검증한다.
- 근거: HomeScreen → AccountNavBar → AccountMenu → SideMenu의 실제 코드와 useAccountMenu/useModalDialog를 직접 추적했다. 이번에는 브라우저 키보드 재현을 실행하지 않았으며 코드로 확인한 DOM 배치·포커스 규칙에 따른 finding이다.

**[Low / 구조 규칙, 3차 미해결] GuestVisitTracker의 effect·이벤트 등록이 여전히 ui 파일에 있다.**

- `src/features/onboarding/ui/GuestVisitTracker.tsx`는 useEffect/useRef, 이벤트 등록/해제, throttle을 직접 소유한다.
- `.agents/guides/client-logic-separation.md`의 UI 내 effect·이벤트 등록 금지 및 feature/hooks 배치 기준에 어긋난다. 순수 판단 model 분리는 적절하나 orchestration의 hook 분리는 아직 필요하다.

### 요청 관점별 검토

- **일반 숨김과 접근성:** display:none인 래퍼의 일반 DOM 자손은 접근성 트리와 Tab 순서에서 제외된다. display:contents인 활성 래퍼는 의미 없는 div이며 그 안의 main/header/footer 의미는 유지된다. 단, 위 포털은 래퍼 밖이므로 예외다.
- **중복 landmark/id:** 비회원 DOM에는 main/h1/footer가 둘씩 존재하지만 정상 CSS 적용 시 하나의 화면만 노출된다. StartHero의 start-headline과 HomeScreen의 home-entry-heading은 서로 다르다. AppShell/SiteFooter에는 고정 중복 id가 없고 SideMenu/ConfirmDialog는 useId를 사용한다. 읽은 렌더 경로에서 신규 고정 id 충돌은 발견하지 못했다. 브라우저 전체 DOM id 스캔은 하지 않았다.
- **숨은 이미지 성능:** HomeScreen 첫 HomeEntryCard는 preload=true, loading=eager, fetchPriority=high, decoding=sync다. CSS display:none은 preload/이미지 네트워크 요청을 취소하지 않는다. 시작 화면에서도 불필요한 홈 이미지 로드와 우선순위 경쟁이 발생할 수 있다. 시작 화면과 홈의 HTML·클라이언트 초기화 비용도 함께 발생한다. SDD가 명시한 성능 캠페인 후속 항목으로 기록하며 실제 LCP/전송량을 이번에 측정한 것은 아니다. JS 번들 예산 통과가 이 비용의 검증을 대신하지 않는다.
- **숨은 홈의 세션 요청:** useAccountMenu의 sessionEnabled는 menuOpen || confirmOpen이고 초기에는 false다. useAuthSession은 enabled=false이면 fetch를 시작하지 않는다. 따라서 숨은 홈을 처음 마운트했다는 이유만으로 `/api/auth/me`를 호출하는 문제는 없다. 이미 열린 메뉴는 CSS로 숨겨도 enabled 상태나 진행 중 요청이 취소되지 않으며 위 포털 finding과 연결된다.
- **기타 부수효과:** CSS 숨김은 React mount/effect를 막지 않는다. HomeScreen의 WebVitalsLogger는 development에서만 동작한다. SideMenu는 숨은 홈에서도 클라이언트 포털 DOM을 만든다. 일반 초기 세션 API 호출과 포털 DOM 생성은 구분해야 한다.
- **로그아웃/다른 탭:** 현재 탭 marker 및 html 속성을 삭제하고 `/` replace + refresh한다. 다른 탭의 marker는 남지만 현재 탭으로 전달될 공유 쿠키나 속성이 없어 현재 탭의 시작 화면을 되살리지 못한다. 다른 탭의 인증 UI 즉시 동기화는 별개 기존 문제이며, 로그인 권한은 BFF 인증으로 판단한다. useLogout 주석의 “BFF가 둘러보기 쿠키 삭제/guard가 쿠키 복원”은 제거된 구조 설명이므로 정리가 필요하다.
- **suppressHydrationWarning:** html 한 요소의 의도된 data-guest-visit 속성 차이에 적용된다. 하위 전체 트리의 hydration 오류를 재귀적으로 숨기는 설정은 아니다. html의 다른 속성 차이도 경고가 억제되므로 범위는 단일 속성보다는 넓지만, 이번 방식의 의도와 맞는다. guard는 더 이상 visibility:hidden이나 navigation을 수행하지 않는다. 사용자 제공 start 모드 콘솔 무오류 결과는 별도 evidence로 인정한다.
- **보안/CSP:** 두 guest 화면은 모두 공개 콘텐츠이며 CSS는 인증 가드로 쓰이지 않는다. 서버 회원/비회원 판정은 인증 쿠키 기준을 유지한다. 고정 config 기반 인라인 생성이며 저장소 값을 실행 코드로 삽입하지 않는다. 2차에서 확인한 저장소 enforce CSP에 script-src/default-src가 없어 inline 차단은 없다. 외부 CDN 헤더는 미검증이다.
- **VSA:** app이 widget 두 개를 조합하고 feature의 server 공개 진입점으로 회원/비회원 판정을 받는 구조는 적절하다. shared marker/attribute 삭제는 onboarding/auth 두 사용처가 있고 feature 교차 import를 피한다. visit.ts에는 서버 비밀이나 next/headers 의존성 노출이 없다. tracker의 hooks 책임 문제만 별도 finding으로 남는다.
- **시간·저장소 한계:** idle/24시간은 이벤트가 올 때 검사하며 정확히 30분은 <=로 유효하다(현재 단위 테스트도 이를 명시). sessionStorage 복사 opener 새 탭은 유효 marker를 이어받을 수 있다. 저장소 접근 실패 시 기존 속성을 제거하지 않는 fallback은 markGuestBrowse의 일시적 이용 허용과 연결되지만 이 경우 시간 제한을 보장하지 못한다. 읽은 현재 SDD의 fallback 범위로 기록한다.
- **scroll 관측 참고:** window의 bubble 단계 scroll listener는 AppShell의 overflow-y-auto main에서 발생하는 비버블 scroll을 일반적으로 받지 못한다. pointerdown/keydown 입력은 별도로 수집되지만 wheel/관성 스크롤만 계속되는 경우 활동 시각이 갱신되지 않을 수 있다. 기존 tracker부터 있던 관측 범위 한계로, hook 분리 시 함께 점검하는 것이 좋다.

### 검증 결과

직접 실행:

- `npm run test:unit -- src/features/onboarding/test src/features/auth/test/logout.test.ts src/features/auth/test/menu-login.test.ts` (frontend) → **5 files / 30 tests pass**, exit 0.
- `npx --no-install eslint src/app/page.tsx src/app/layout.tsx src/features/onboarding/model/guest-visit.ts src/features/onboarding/ui/GuestVisitTracker.tsx src/features/onboarding/lib/guest-browse.ts src/shared/lib/guest-visit-marker.ts` → **exit 0**.
- `git diff --check HEAD^ HEAD` → **exit 0**.
- BFF logout route와 origin/develop 비교 → 차이 없음.
- 첫 테스트 시도는 저장소 루트에서 실행해 package.json ENOENT로 종료했다. frontend에서 재실행한 위 결과만 테스트 evidence로 사용한다. 일부 보조 파일 경로 탐색도 실제 경로 확인 후 다시 읽었다.

사용자 제공 Claude evidence (이번 Codex 독립 재실행 아님): tsc OK, eslint 오류 0, Vitest 1052, 전체 E2E 90 두 차례, start 모드 21, 콘솔 hydration/error 없음, build 및 번들 예산 통과(`/share/course` 686572B). 이전에 제시된 예산 688926B 대비 2354B 여유. 이번에는 전체 E2E/빌드·네트워크/성능·실제 키보드 탐색을 재실행하지 않았다.

### 문서·범위 및 gate

- 직접 읽기: 요청 구현 파일 전체, onboarding 단위 테스트 전체, onboarding E2E, home E2E, helper 및 SDD 4차 구조. 추가로 HomeScreen/StartScreen, AccountNavBar/AccountMenu/useAuthSession, SideMenu/ConfirmDialog/useModalDialog, AppShell/SiteFooter/StartHero/HomeEntryCard를 확인했다.
- 적용 기준: 기존 AGENTS.MD·validation·BFF·server-client-boundary·client-logic-separation·harness/reports, 앞서 적용한 Next/verification-before-completion 스킬. 이번에는 마크업/표시 전환 trigger로 accessibility.md를 추가로 직접 읽어 적용했다.
- Evidence Gate: 대상 테스트/lint 통과. Acceptance Gate: 3차 기능 지적은 해소. Accessibility/Boundary Gate: body 포털의 키보드/표시 문제와 tracker 책임 규칙으로 승인 불가.
- Failure taxonomy: implementation_bug(접근성), boundary_conflict. 성능 재측정은 SDD에 명시된 후속이며 결과를 통과로 표기하지 않았다.
- Loop: 4차 검증 1회, 테스트 작업 디렉터리 오류 수정 후 재실행. 소스 수정 없음. 이 보고서만 추가 작성했고 기존 AGENTS.MD 변경은 보존했다. 현재 요청과 최종 SDD 사이에 별도 승인이 필요한 범위 충돌은 없다.


## 5차 검증 — f239527

- 검증일: 2026-10-17 (Asia/Seoul), Codex.
- 대상: `f2395279196a59b16111015c9667760497acbeda`, wt-244.
- **Verdict: approve** (저장소 결정값 `approved`).
- 승인 차단 finding: 없음. 4차의 접근성 및 UI/hooks 책임 지적은 해소됐다. 이전 검증 기록은 당시 커밋에 대한 결과로 보존한다.
- Intent source: 사용자 5차 요청, 동일 SDD의 최종 4차 구조와 숨은 화면 부수효과 처리 보완, tasks의 재검증 항목.

### 지적 해소 및 검토 결과

| 항목 | 판단과 근거 |
| --- | --- |
| 닫힌 포털의 Tab 진입 | SideMenu drawer 루트에 `inert={!open}` 적용. body 포털이어도 닫힌 자손의 순차 포커스와 상호작용을 차단한다. aria-hidden도 함께 유지하며 열면 inert가 해제된다. React 19.2 boolean inert 사용이 적절하다. |
| 열린 메뉴에서 방문 만료 | guard가 html 속성 on→off일 때만 shared 이름의 window 이벤트를 보낸다. useAccountMenu는 이를 받아 menuOpen/confirmOpen을 모두 false로 바꾸고 effect에서 listener를 정리한다. 드로어/확인창의 기존 모달 훅은 open=false에 따라 포커스 트랩 listener를 해제한다. |
| 반복 이벤트/루프 | 속성을 먼저 제거하고 이벤트를 전송하므로 다음 off 실행은 이벤트를 보내지 않는다. guard/tracker의 reload/refresh나 공유 쿠키 복원도 없다. 운영 minify 함수 실행으로 1회 전송을 확인했다. |
| UI/hooks 분리 | GuestVisitTracker는 useGuestVisitTracker 호출과 null 반환만 맡는다. effect/ref/throttle/이벤트 구독은 feature/hooks로 이동해 client-logic-separation 기준을 충족한다. |
| 내부 스크롤 활동 | scroll/pointerdown/keydown을 capture로 구독한다. 비버블 main scroll을 window capture 단계에서 관측할 수 있고 removeEventListener도 동일 capture 조건이다. passive 설정도 적절하다. |
| 숨은 홈 이미지 | 비회원 page는 HomeScreen imagePriority=false를 전달한다. HomeEntryCard의 기존 계약에 따라 preload=false, loading=lazy, fetchPriority=auto가 되므로 숨은 홈 이미지의 강제 preload/high 우선순위가 제거된다. 회원 홈의 기본 true는 유지한다. |
| 로그아웃 | 주석이 인증 쿠키 + 이번 탭 marker 삭제 구조로 정리됐다. 다른 탭이 현재 탭 marker/속성을 복원할 공유 상태가 없고 기존 `/` replace/refresh 흐름을 유지한다. |
| VSA | 종료 이벤트명은 onboarding/auth가 공유하는 최소 계약으로 shared에 둔다. feature 간 내부 import 없이 생산자와 소비자를 연결한다. 판단 model, tracker hook, UI 조합 책임이 분리됐다. |
| 보안/하이드레이션 | 고정 config 및 자기완결 함수 문자열을 사용하며 사용자 값을 실행 코드로 삽입하지 않는다. html 속성만 변경하는 기존 suppressHydrationWarning 범위와 CSP 판단은 4차와 같다. 이번 변경에 새 server/client 경계 오염이나 보안 차단 문제 없음. |

### 테스트 검토

- guest-visit-guard 단위 테스트는 on 상태에서 만료 시 종료 이벤트, 활동 중 이벤트 없음, marker 갱신/만료를 검사한다.
- 추가 E2E는 시작 화면에서 12회 Tab 이동 후 숨은 홈/포털/보이지 않는 컨트롤로 포커스가 가지 않는지 확인한다.
- 추가 E2E는 실제 계정 메뉴를 연 뒤 31분 지난 marker와 visibilitychange로 방문을 종료하고 시작 화면 및 메뉴 숨김을 확인한다.
- 사용자가 제공한 inert 제거 시 Tab 테스트 실패 결과는 회귀 검증의 민감도 근거로 기록한다. Codex가 소스를 되돌려 재현한 결과는 아니다.

### 직접 실행한 검증

frontend 기준:

1. `npm run test:unit -- src/features/onboarding/test src/features/auth/test/logout.test.ts src/features/auth/test/menu-login.test.ts` → **5 files / 32 tests pass**, exit 0.
2. `npx --no-install eslint`에 SideMenu, guest-visit model, useGuestVisitTracker, GuestVisitTracker, useAccountMenu, useLogout, shared marker, HomeScreen, app/page, guard test, onboarding E2E 총 11개 파일을 명시 → 오류 출력 없음.
3. `git diff --check HEAD^ HEAD` → 오류 출력 없음. 위 명령 묶음 exit 0.
4. `.next/server/chunks/ssr/[root-of-the-server]__0tv6jda._.js`의 실제 minify된 guard를 TypeScript AST로 추출해 Node VM에서 독립 실행 → **on→off 속성 제거 및 종료 이벤트 1회, 재실행 off에서 추가 이벤트 없음** assertion 통과. 외부 모듈 별칭 참조 없이 실행돼 현재 산출물의 toString 자기완결성도 확인했다. 새 build를 생성한 것은 아니다.

사용자 제공 Claude evidence (Codex 독립 재실행 아님): tsc OK, eslint 오류 0, Vitest 1054, 전체 E2E 92 두 차례, start 모드 23, build 및 번들 예산 통과(`/share/course` 687004B / 기존 예산 688926B, 1922B 여유). 이번에는 전체 E2E/빌드/타입체크를 재실행하지 않았다. 대상 검증과 직접 코드 리뷰, 출처를 구분한 사용자 제공 전체 evidence를 함께 사용해 승인한다.

### 비차단 한계 및 후속

- 비회원 화면 두 개의 HTML/클라이언트 초기화 비용은 남는다. lazy loading은 브라우저 정책이며 모든 환경에서 네트워크 요청이 절대 발생하지 않는다는 보장은 아니다. 기존 SDD의 성능 재측정 후속은 유지한다. 실제 이미지 전송량/LCP는 이번에 측정하지 않았다.
- 기존에 기록한 sessionStorage 차단 fallback, opener로 복사된 marker, 1분 활동 기록 오차와 정확한 30분 경계(현재 <=)는 이번 변경 범위의 새 회귀가 아니다. 이를 모든 환경에서 엄격한 종료 감지로 표현하지 않아야 한다.
- 두 신규 E2E의 실제 브라우저 실행은 사용자 제공 증거다. confirm dialog 종료는 상태 setter와 기존 open 기반 cleanup을 코드로 확인했고 별도 신규 브라우저 시나리오는 실행하지 않았다.
- 기존 시작 화면/홈의 접근성 landmark·CSS 숨김, 초기 닫힌 메뉴의 auth fetch 비활성 판단은 4차 검토 결과를 유지한다. 포털 예외는 이번 inert와 종료 이벤트로 보완됐다.

### 문서 및 gate 기록

- 작업 유형: 검증. 사용자 지정 변경 구현·단위 테스트·E2E 마지막 두 테스트를 경로로 직접 읽고 SDD/tasks 변경을 확인했다. 이전 AGENTS.MD, validation, 접근성, BFF, server-client-boundary, client-logic-separation, harness/reports 및 Next/verification-before-completion 기준을 재사용했다.
- 문서 적용: 최종 SDD로 탭별 표시 구조를 고정, 접근성 가이드로 inert/열린 포털 종료를 검토, client-logic-separation으로 hook 이동을 확인, VSA 기준으로 shared 이벤트 계약을 판단, verification-before-completion에 따라 새 대상 검증 실행.
- Evidence/Acceptance/Boundary Gate: 통과. 새 blocking failure taxonomy 없음. 별도 승인 확인이나 정책 변경 없음.
- 공용 UI: 기존 SideMenu를 보완해 재사용했고 중복 드로어 구현을 추가하지 않았다.
- Loop: 5차 검증 1회, 소스 수정/재시도 없음. 동일 보고서에만 5차 결과를 추가했다. 기존 AGENTS.MD 변경은 보존했다. 영상·Notion 및 성능 캠페인 실행은 이번 검증 요청 범위 밖이다.


## 6차 검증 — 520d6d5

- 검증일: 2026-10-17 (Asia/Seoul), Codex.
- 대상: `520d6d5`, wt-244.
- **Verdict: approve** (저장소 결정값 `approved`). 기능·보안 승인 차단 finding 없음. 공개 API 관련 비차단 정리 항목은 아래에 명시한다.
- Intent source: 사용자 6차 정정, PRD “바뀌면 안 되는 규칙”, SDD “로그아웃 복귀 유지”, tasks의 #181 복원 항목.
- 이번 명시적 결정이 2차의 복귀 제거 결정을 대체한다. 로그아웃 도착지는 시작 화면으로 유지하고, 재로그인 후 단계·입력값 복귀는 복원한다. 정책 충돌을 임의 해석하지 않고 갱신된 의도를 기준으로 검증했다.

### 복귀 흐름과 acceptance 확인

1. useAccountMenu.logoutAndReturn이 onBeforeLogin을 먼저 호출하고 현재 pathname + search를 resolveLoginReturnPath로 계산한다. 상황입력 widget들이 전달하는 onBeforeLogin 경로가 유지되어 로그아웃 전에 상태 인계 콜백을 호출할 수 있다. 홈/로그인 경로는 복귀 next 없이 `/`로 간다.
2. useLogout은 BFF 성공 후 현재 탭 방문 표시를 지우고 buildStartScreenPath(nextPath)로 replace + refresh한다. 실패 시 성공 이동은 하지 않고 기존 error/pending 처리를 유지한다.
3. buildStartScreenPath는 next 전체를 encodeURIComponent해 `/?next=...`에 담는다. step/rev의 `&`가 최상위 쿼리로 분리되지 않는다. 이 함수는 URL 조립 담당이며 입력 보안 판정은 수신 측에서 한다.
4. 비회원 app/page는 sanitizeLoginNextPath를 통과한 값만 StartScreen에 전달하고, StartScreen은 기존 KakaoLoginForm에 next를 전달한다.
5. KakaoLoginForm은 next를 base64url hidden input으로 전송한다. start route가 decode 후 다시 sanitize해 HttpOnly OAuth next 쿠키에 저장한다. invalid/없는 next면 이전 쿠키를 지운다.
6. callback은 쿠키 값도 다시 sanitize한 뒤 `new URL(next ?? '/', request.url)`로 이동하고 OAuth 쿠키를 정리한다. 취소·백엔드 실패 경로는 안전한 next를 로그인 오류 화면에 유지해 재시도 복귀를 지원한다.

### 보안 및 엣지케이스

- **open redirect:** sanitizer는 외부 절대 URL, protocol-relative URL, 역슬래시·제어 문자, 인코딩된 slash/backslash, 정규화 후 `//` 경로, `/api`·`/login`, 과도한 길이를 거부한다. fragment는 제거하고 내부 pathname+search만 반환한다. page/start/callback에서 방어가 반복되며 새 코드가 검증을 우회하지 않는다.
- **중복 next 파라미터:** page의 TypeScript 선언은 next?:string이지만 런타임 배열은 sanitizer의 unknown/string 확인에서 거부된다. 배열을 문자열처럼 사용해 예외가 나거나 외부로 이동하는 경로는 없다.
- **회원 `/?next=`:** member 분기에서 HomeScreen만 반환해 next를 폼에 넣거나 즉시 redirect하지 않는다. 로그인된 회원을 arbitrary next로 보내는 변화는 없다.
- **둘러보기 중 `/?next=`:** 활성 방문 탭은 home을 보이고 next 폼은 숨은 시작 화면에만 존재한다. 폼은 자동 제출하지 않으므로 숨은 next로 이동하지 않는다. 동일 문서에서 방문이 끝나 시작 화면이 표시되면 현재 URL의 검증된 next를 로그인에 사용할 수 있다. 홈 메뉴 로그인은 별도 기존 로직이며 홈에서는 next를 만들지 않는다. 실제 로그아웃 경로는 marker를 지워 시작 화면을 보이게 하므로 #181 복귀 CTA는 숨겨지지 않는다.
- **단계/입력 복귀 증거:** 복원 E2E 첫 테스트는 로그아웃 후 시작 화면 URL의 next와 OAuth callback Location이 원래 지역 단계 URL(step/rev 포함)과 같은지 검사한다. 두 번째는 별도 새 탭에서 next를 열어 지역 단계와 시간 수정 UI가 복원되는지 검사한다. 두 번째 테스트 자체가 실제 OAuth 왕복까지 하는 것은 아니며 두 테스트가 나누어 검증하는 범위를 구분한다.
- **기존 실패 경로 한계:** 카카오 client ID가 없는 start 경로는 기존 코드대로 `/login?error=oauth_config_missing`로 이동하며 next를 보존하지 않는다. 이번 커밋이 만든 회귀는 아니고 정상 구성의 요청 흐름을 차단하지 않는다.
- **민감정보:** next는 URL에 노출되는 내부 경로/쿼리이며 인증 토큰을 포함하지 않는다. 새 임의 HTML 삽입이나 서버 전용 코드의 client graph 유입은 발견하지 못했다.

### VSA / 컨벤션 finding (비차단)

**[Low] app/page의 auth model 직접 import는 공개 API 원칙과 불일치한다.**

- `src/app/page.tsx`가 `@/features/auth/model/oauth`에서 sanitizeLoginNextPath를 직접 가져온다. auth/index.ts의 “widgets/app은 이 배럴을 통해서만 접근” 주석 기준으로는 공개 진입점 사용이 아니다. sanitizer는 현재 기본 공개 배럴에도 노출되어 있지 않다.
- 기존 login/page 및 kakao start/callback이 동일 순수 model 경로를 사용하고 있어 이번 변경만의 새로운 서버/클라이언트 의존성 위험이나 feature 간 교차 호출은 아니다. 따라서 이번 기능 승인 차단으로 보지 않되 “완전한 공개 API 준수”로도 표시하지 않는다.
- 후속으로 순수 인증 경로 검증용 명시적 공개 진입점에 정리하거나 현재 예외를 문서화하는 것이 일관적이다. UI가 섞인 배럴로 단순 이동해 번들 의존성을 늘리지 않도록 범위를 확인해야 한다. 이번 리뷰에서는 소스를 변경하지 않았다.

### 직접 실행한 검증

frontend 기준:

- `npm run test:unit -- src/shared/lib/login-redirect.test.ts src/shared/lib/next-path-param.test.ts src/features/auth/test src/features/onboarding/test` → **16 files / 139 tests pass**, exit 0.
- `npx --no-install eslint src/shared/lib/login-redirect.ts src/shared/lib/login-redirect.test.ts src/features/auth/hooks/useLogout.ts src/features/auth/hooks/useAccountMenu.ts src/features/auth/model/menu-login.ts src/app/page.tsx src/widgets/onboarding/StartScreen.tsx src/e2e/auth/menu-login-return.spec.ts` → 오류 출력 없음.
- `git diff --check HEAD^ HEAD` → 오류 출력 없음. lint/diff 명령 묶음 exit 0.
- 기존 login-next.test.ts를 직접 읽고 실행 범위에 포함했다. 내부 query 보존, base64url 폼 값, 외부 주소/변조 next 거부, callback 복귀 및 실패 후 next 유지 테스트가 포함된다.

사용자 제공 Claude evidence(이번 Codex 독립 재실행 아님): tsc OK, eslint 오류 0, Vitest 1056, 전체 E2E 93 두 차례, start 모드 24, build 및 번들 예산 통과(`/share/course` 687228B / 기존 예산 688926B, 여유 1698B). 이번에는 전체 E2E·빌드·타입체크를 재실행하지 않았다. 대상 검증과 직접 코드 리뷰, 사용자 제공 전체 검증을 구분해 승인 근거로 사용한다.

### 적용 문서와 실행 기록

- 사용자 지정 변경 파일·단위 테스트·E2E를 경로로 직접 읽었다. 추가로 auth/model/oauth, KakaoLoginForm, login/page, kakao start/callback, auth/index, login-next.test, 상황입력 widget의 onBeforeLogin 연결을 확인했다.
- 기존 AGENTS.MD, validation, BFF·서버 경계·클라이언트 책임·접근성·harness/reports 및 verification-before-completion 기준을 재사용했다. 로그인 domain의 복귀/서버 책임 기준과 갱신 PRD/SDD/tasks를 반영했다.
- UI는 기존 StartScreen/KakaoLoginForm을 재사용하고 next prop만 전달한다. 복귀 경로 계산은 model/shared helper, 호출 및 상태 인계는 hook, 검증은 server page/route에 남는다.
- Evidence Gate: 통과. Acceptance/Security Gate: 통과. 구조 검토는 위 Low 공개 API 불일치를 후속 항목으로 명시한다. 테스트 실패·기능 결함은 발견하지 못했다.
- Loop: 6차 검증 1회, 소스 수정 없음. 보고서에만 6차 결과를 추가했고 기존 AGENTS.MD 변경은 보존했다. 새 사용자 정정이 intent에 반영돼 추가 승인 질문은 필요하지 않았다. 과거 보고서는 당시 정책 기록으로 보존한다.
