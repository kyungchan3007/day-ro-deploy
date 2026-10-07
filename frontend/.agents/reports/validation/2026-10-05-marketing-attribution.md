# 마케팅 유입 추적 검증 리포트

## 작업 일시 (실행 날짜)
- 2026-10-05, issue Dayro-dev/dayro#125, branch `feat/#125-marketing-attribution`.
- owner: Codex(로직 구현·단위 테스트·검증). 사용자 지정 방식 A 파일 핸드오프; Claude 재호출 없음.

## Intent Source (의도 출처)
- task_id: `2026-10-05-marketing-attribution`
- intent artifact: `.agents/intent/tasks/2026-10-05-marketing-attribution.md` Acceptance Criteria.
- 구현 계약: `.agents/intent/sdd/2026-10-05-marketing-attribution.md` Design Decisions (확정).
- 목표/합의: 동명 PRD 및 `.agents/reports/handoffs/2026-10-05-marketing-attribution-debate.md`.
- 사용자 지시: 개인정보처리방침과 `docs/marketing-utm-guide.md`는 Claude 담당으로 수정 제외. 신규 의존성·e2e·commit·push 금지 준수.

## 검증 대상 (대상 파일 / 범위)
- GA4/Meta gate, 공식 stub, URL/이벤트 파라미터 정제, UTM, pathname 페이지뷰, 인증 1회성 쿠키, 전환 7종, 환경변수 문서 및 단위 테스트.

## 최종 결정 (판정 결과)
- `blocked`: Codex 구현 및 일반 단위 테스트는 완료. production build와 번들 evidence가 환경 제약으로 확보되지 않아 최종 출시 승인은 보류한다.
- Claude 담당 개인정보처리방침·UTM 규칙표는 이번 작업 범위 밖으로 완료 판정하지 않는다.

## Acceptance Criteria 확인 (완료 조건 점검)
| AC | 판정 | 근거 / 제한 |
| --- | --- | --- |
| production + 명시적 flag + 벤더 ID별 활성화 | 충족(단위) | config/스크립트/전송 gate 테스트. 비활성 시 vendor globals·script 없음. 실제 네트워크 미검증 |
| 환경변수 3종 문서화 | 충족 | `docs/analytics-setup.md`; 실제 ID 미포함, 빌드 타임 주입 및 preview/e2e flag 해제 안내 |
| first-touch UTM 보존 및 GA 전환에만 첨부 | 충족(단위) | localStorage 고정 90일, 소문자/전체 문자셋/100자 검증, 손상·만료·직접 방문 및 GA/Meta 차이 테스트. 실제 OAuth 왕복은 수동 확인 필요 |
| 신규 sign_up / 기존 login 1회 | 충족(단위) | isNewUser 쿠키 helper와 소비 순서·세션 재로드 중복 억제·벤더별 실패 재시도 검증 |
| 생성/재추천/소진 이벤트, 복원·실패 무전송 | 충족(단위) | 성공 응답 requestId 세션 중복 억제, retry promise 신규 성공만 계측, cached promise 재사용·실패 무전송. 복원 hook 기존 8개 테스트에 무전송 assertion 추가. 소진 클릭 2회=2건 검증 |
| 저장 성공 / 공유 완료 1회 | 충족(단위) | API 완료 전 무전송 및 완료 후 전송, 저장 실패·공유 AbortError/오류 제외, share_sheet/clipboard 구분 |
| pathname 페이지뷰 중복 억제 | 충족(단위) | 같은 경로 반복 억제, A→B→A 3건. useSearchParams 미사용, GA send_page_view=false |
| /login Meta 미발행 | 충족(단위) | trailingSlash 설정 반영해 /login 및 /login/ 차단. 초기 Pixel init/script도 제외 |
| PII 및 허용 외 query 무전송 | 충족(단위/구조) | 이벤트별 key와 enum/정수 검증; requestId는 세션 중복 키에만 사용. URL은 UTM 5개+fbclid/gclid만 유지, credentials/hash 제거 |
| 분석 오류가 앱 성공 처리 방해하지 않음 | 충족(단위) | vendor initialization/enqueue 분리 try/catch, storage 예외 처리, 실패한 벤더와 무관하게 다른 벤더 전달 |
| UI JSX에 추적 로직 없음 | 충족 | JSX leaf는 next/script 바인딩만; effect/정책은 hooks/model. layout은 Server Component, cookies() 미사용 |
| 개인정보처리방침 고지 | 미판정 / Claude 담당 | 지정 파일 수정하지 않음. 런칭 전 Claude 완료 확인 필요 |
| 번들 예산 / CWV 회귀 없음 | 미검증 | 빌드 차단으로 stats 미생성, baseline 상향 없음. 실제 ID 발급 후 Lighthouse 비교 필요 |
| UTM 링크 규칙표 | 미판정 / Claude 담당 | 지정 문서 수정하지 않음 |

## 변경 파일 요약 (수정 범위)
모든 경로는 frontend 기준. 기존 사용자의 intent/active 변경 및 미추적 PRD/SDD/task/토론 문서는 보존했다.

- `src/shared/analytics/config.ts`: production/flag/ID gate.
- `src/shared/analytics/events.ts`: 이벤트 타입·허용 파라미터·Meta 매핑.
- `src/shared/analytics/attribution.ts`: first-touch 검증·90일 TTL·저장소 오류 처리.
- `src/shared/analytics/url.ts`: URL 허용 목록 정제.
- `src/shared/analytics/track.ts`: 공식 stub·1회 초기화·벤더별 비투척 fan-out.
- `src/shared/analytics/useAnalytics.ts`: pathname tracker 및 script 설정 hook.
- `src/shared/analytics/AnalyticsScripts.tsx`, `index.ts`: client leaf와 public API.
- `src/shared/analytics/test/analytics.test.ts`, `test/scripts.test.ts`: 전송/저장/gate 계약 테스트.
- `src/app/layout.tsx`: Suspense 아래 analytics/auth client leaf 조합.
- `src/app/api/auth/kakao/callback/route.ts`, `src/shared/api/server-auth-event.ts`: 성공 응답 isNewUser 신호 쿠키.
- `src/features/auth/model/auth-event.ts`, `hooks/AuthEventTracker.ts`, `index.ts`, `test/auth-event.test.ts`: 소비 순서·중복 억제 및 공개 client entry.
- `src/features/situation/model/generation-analytics.ts`, `hooks/useCourseGeneration.ts`, `test/generation-analytics.test.ts`, `test/generation-events.test.ts`: 최초/재추천 성공 계측·중복 방지.
- `src/widgets/situation/hooks/useSituationFlowController.ts`, `retry-analytics.test.ts`: 소진 클릭 계측.
- `src/features/course-map/hooks/useCourseMapScreen.ts`, `test/save-analytics.test.ts`: 저장 완료 계측.
- `src/features/saved/hooks/useSavedCourseDetailScreen.ts`, `test/share-analytics.test.ts`: 공유 완료 계측.
- `src/features/course-result/test/restored-course-candidates.test.ts`: 복원 무전송 회귀 assertion.
- `docs/analytics-setup.md`: 환경변수 및 런칭 체크.
- 본 validation report 및 `reports/runs/2026-10-05-marketing-attribution.md`.

## 실행 루프 요약 (작업 흐름 요약)
- loop type: Full Loop. Intent Capture → Context Load → Plan and Boundary Decision → Implement → Self Check → Evidence Run → Validate → Report.
- iterations: 3 (구현; lint effect/state 및 공식 stub 예외 정리; trailing slash·성공분기 테스트 보강 및 lint 보정).
- handoff 사용 여부: 기존 Claude→Codex 토론/사용자 핸드오프 사용. 사용자 지시로 동일 Codex runtime이 구현·검증, 독립 reviewer 아님.
- evidence bundle: BFF Bundle + Validation Bundle.
- 문서 충돌: 확정 SDD/사용자 요구와 충돌 없음. 스킬의 @next/third-parties 권장 대신 사용자 신규 의존성 금지 및 SDD next/script 계약 우선.
- 사용자 확인 결과: 기존 확정 결정으로 충분해 추가 승인 요청 없음.

## 읽은 문서와 반영
- `AGENTS.MD`, `.agents/README.md`, `intent/README.md`, `intent/active/index.md`, `context/README.md`: 기존 intent 보존 및 Full Loop 선정.
- PRD/SDD/task/토론: 7개 이벤트 의미, /login 정책, gate·쿠키·UTM 계약 반영.
- `agents/feature.md`, `test.md`, `validation.md`: feature hook/model 책임 및 테스트/검증 분리. 역할 담당은 사용자 핸드오프 우선.
- `guides/server-client-boundary.md`: server-auth-event를 client barrel에서 export하지 않음.
- `guides/client-logic-separation.md`: JSX에 추적 정책을 두지 않음.
- `guides/bff.md`: 기존 콜백의 토큰 쿠키 유지, 새 API endpoint 없음.
- `guides/performance.md`: next/script afterInteractive, 수동 페이지뷰, baseline 불변 및 CWV 미검증 명시.
- `domain/login.md`, `course-situation.md`, `course-map.md`, `saved.md`, `common.md`: 각 성공 액션 owner에만 연결, 복원 경로 유지.
- `harness/README.md`, `harness/observability.md`, `reports/README.md`, `orchestration/README.md`: evidence gate·failure taxonomy·run log.
- 적용 스킬: `verification-before-completion`, `next-best-practices`(RSC/scripts/Suspense), `vercel-react-best-practices`(third-party defer/derived state). `tdd`는 읽었으나 test-first workflow 적용을 주장하지 않음.
- 제외: onboarding(지시 없음), 접근성/Storybook UI 작업(시각 UI 변경 없음), 관련 없는 과거 intent.

## 실행한 검증 명령 (검증 커맨드)
frontend 디렉터리에서 실행. 로그는 `/tmp/dayro-*.log`에 있으며 아래 결과를 본 리포트에 보존한다.

| 명령 | 결과 |
| --- | --- |
| `npm run lint` | exit 0; 신규 오류 없음, 기존 warning 2건: public/mockServiceWorker.js unused disable, useWheelColumn.ts unused useMemo |
| `npx tsc --noEmit -p .` | exit 0, 오류 없음 |
| `npm run test:unit` | exit 1: Storybook browser server가 `listen EPERM ::1:63315`로 초기화 실패. 최종 재실행에서 일반 단위 **52 files / 555 tests passed**, unhandled error 1건 |
| `npm run test:unit -- --project '!storybook'` | exit 0, **52 files / 555 tests passed**, 1.12s |
| 관련 파일 지정 테스트 | 중간 실행 7 files / 42 tests passed; 이후 script/소진 테스트까지 전체 node suite에 포함 |
| `npm run build` | Turbopack 최적화 단계 무진행; 수 분 후 작업 프로세스 중단(exit 130). 성공 주장하지 않음 |
| `npm run build -- --webpack` | exit 1; `fonts.googleapis.com` ENOTFOUND, 기존 next/font Geist 다운로드 실패. 앱/폰트 설정 변경 없이 진단 |
| `node scripts/check-route-bundle-budget.mjs` | exit 1; `.next/diagnostics/route-bundle-stats.json` ENOENT |
| `git diff --check` | 통과 |

- 알려진 `features/faq/test/contact-form.test.tsx` baseline timeout 2건은 이번 일반 단위 실행에서 재현되지 않았다. Storybook sandbox 포트 실패와 구분한다.
- `.env.local`의 내용을 직접 열람하거나 수정하지 않았다. 요청된 Next build 자체는 로그에 해당 환경 파일 자동 로드를 표시한다. 실제 ID 값은 출력하거나 문서화하지 않았다.
- e2e는 실행하지 않았다. Storybook browser 초기화는 사용자 지정 전체 test:unit 스크립트에 포함된 것으로 포트 단계에서 차단되었다.

## 번들 수치
- 신규 빌드 실측: **N/A**. 최종 stats가 없어 증가량과 초과 여부를 판정할 수 없다. stale stats를 evidence로 사용하지 않음.
- baseline 파일 변경 없음. 아래는 기존 참조값이며 이번 빌드 수치가 아니다. 예산은 baseline + max(10KiB, 2%).

| route | 기존 baseline bytes | 이번 측정 bytes |
| --- | ---: | ---: |
| `/` | 629,629 | N/A |
| `/_not-found` | 514,718 | N/A |
| `/course/new` | 668,043 | N/A |
| `/faq` | 636,437 | N/A |
| `/faq/contact` | 636,437 | N/A |
| `/login` | 629,063 | N/A |
| `/mypage` | 629,063 | N/A |
| `/mypage/withdraw` | 629,063 | N/A |
| `/privacy` | 629,063 | N/A |
| `/saved` | 699,011 | N/A |
| `/saved/[id]` | 699,011 | N/A |
| `/terms` | 629,063 | N/A |
| `/ui-preview` | 577,363 | N/A |
| `/ui-preview/colors` | 518,114 | N/A |
| `/ui-preview/layout-demo` | 574,112 | N/A |

## Evidence Gate (증거 통과 여부)
- intent artifact: pass.
- tests: 일반 단위 pass; 전체 명령은 Storybook 환경 오류로 fail.
- typecheck: pass.
- build: blocked(외부 폰트 DNS 및 Turbopack 무진행).
- additional review: VSA/import graph, 이벤트 allowlist, nonthrow, 쿠키 속성, 루트 Server Component, trailing slash 확인.
- skipped with reason: GA DebugView/Meta 실제 수신/Lighthouse는 실제 ID·사용자 환경 필요. e2e는 사용자 금지.
- 전체 Evidence Gate: **미통과**, 번들/빌드 재검증 전 승인 불가.

## 구조 / VSA 검토 결과 (아키텍처 판단)
- shared는 측정 계약·전송·귀속만 소유. 목적/교통/시간 범주 변환과 requestId 중복 정책은 situation model 소유.
- AuthEventTracker는 auth 소유; 서버 쿠키 helper는 shared/api/server-auth-event에 분리되고 client public API에 노출되지 않는다.
- 기존 widgets/situation 소진 분기에만 이벤트 호출; 사용자 지정 연결점이며 새 비즈니스 정책은 추가하지 않았다.
- layout은 서버 컴포넌트이며 cookies()·추가 BFF 요청 없음. client leaf는 null fallback Suspense로 조합.
- 전송 호출은 hooks/model에만 존재. AnalyticsScripts JSX는 script 렌더링 및 hook 값 바인딩만 한다.
- 공용 UI 변경/신규 UI 없음. 시각 UI 재사용은 해당 없음; 외부 script 관리에는 기존 next/script 사용.
- retry 성공은 신규 네트워크 promise resolution에서만 계측하여 캐시 재소비가 새 이벤트를 만들지 않는다. 이탈 후 응답이 성공해도 실제 API 성공으로 계측되며 UI 상태 변경은 기존 cancelled guard를 유지한다.

## Failure Taxonomy 또는 미검증 항목 (실패 분류 / 미검증)
- `external_blocker`: sandbox localhost 포트 EPERM, Google Fonts DNS ENOTFOUND.
- `build_failure`, `missing_evidence`: production build 및 최종 route bundle stats 미확보.
- `performance_risk`: 외부 SDK 실행 비용 및 공용 client JS 증가량 미측정. 새 시각 요소가 없어 직접 CLS 변화는 예상되지 않으나 실측 판정은 하지 않음.
- GA DebugView, Meta 수신·자동 이벤트 비활성 상태, 광고 차단 영향 및 실제 OAuth 왕복 미검증.
- LCP/TBT/CLS/FCP/SI/INP/TTFB와 afterInteractive vs lazyOnload 실측 비교 미검증.
- 저장소 차단 시 in-memory fallback으로 현 페이지 중복은 억제하지만 새로고침 이후 보장 불가. 다중 탭 경쟁·광고 차단·enqueue 후 이탈은 SDD 범위 밖.

## 남은 리스크 및 후속 작업 (후속 조치)
1. 네트워크/로컬 포트가 허용되는 검증 환경에서 기본 `npm run build`, 전체 test:unit, bundle budget을 다시 실행. baseline 상향 금지.
2. Claude 리뷰: 스크립트 마운트/전역 번들, 쿠키 소비·벤더별 중복 억제, 성공 promise 계측 의미, 개인정보처리방침 및 UTM 규칙표 완료 확인.
3. ID 발급 후 NEXT_PUBLIC 값 빌드 주입, GA history 기반 페이지뷰 해제, DebugView/Meta 테스트 이벤트·Lighthouse를 사용자 확인.
4. 향후 CSP 도입 시 GA/Meta 도메인 및 script 정책 점검.
5. domain/saved의 수정 transport 설명 등 기존 문서와 코드의 불일치는 본 작업에서 수정하지 않음. 본 intent 상태는 전체 승인 전이므로 기존 active 유지.

## 라운드 2 — Claude 리뷰 findings 반영 (2026-10-05)

### 입력 evidence와 이번 범위
- 사용자 전달 Claude 로컬 evidence: lint 0 errors(기존 warning 2), tsc OK, unit 633 pass / 2 fail(기존 FAQ contact-form timeout), build OK, **route bundle budget FAIL**.
- 수정 전 증가량: `/ui-preview`, `/ui-preview/layout-demo` +66,438 bytes; `/ui-preview/colors`, `/_not-found` +124,791 bytes(예산 초과). 일반 라우트 +10,446~10,787 bytes, `/course/new` +12,123 bytes.
- 이 evidence는 위 라운드 1 sandbox 빌드 차단 이후의 외부 검증 결과다. Codex가 재실행한 결과로 표기하지 않는다.
- 이번 수정 기준은 사용자 finding 1~5 및 기존 SDD. build·bundle 재측정은 사용자 지시대로 Claude 담당; Codex는 lint·typecheck·관련 단위 테스트만 수행한다. Claude 재호출·commit·push·e2e 없음.

### Findings 처리 결과
| Finding | 처리 | 근거와 변경 |
| --- | --- | --- |
| P1 root 인증 배럴 및 번들 | 구조 수정 완료, 수치 재검증 대기 | `features/auth/analytics.ts` 보조 public 진입점을 추가하고 layout import를 전환. 기존 auth/index의 tracker export는 제거. `shared/analytics/client.ts`는 script leaf만, `shared/analytics/index.ts`는 React 없는 config/전송/타입 API만 노출 |
| P2 압축 코드·주석 | 완료 | 이번 기능의 신규 production/test 파일에서 함수·객체·조건·JSX를 여러 줄로 정리. 긴 조건/중첩 삼항 정리, export 함수에 한국어 역할·입력·반환 JSDoc 추가. server-auth-event는 response 변경 및 추가 backend 호출 없음까지 명시. formatting 자체의 동작 변경 없음 |
| P3 config deep import | 완료 | auth-event가 getAnalyticsConfig와 enqueueEvent를 shared/analytics public index에서 import |
| P3 stub/script effect 순서 | 완료 | useAnalytics의 최초 ready는 false. effect에서 stub 및 config/init enqueue 후 microtask로 벤더별 ready 상태를 통지하고 그 후에만 Script 렌더. cleanup 시 통지 취소, 실패 벤더 script는 렌더하지 않음. /login 진입은 ready 상태와 별개로 즉시 Meta 렌더 차단 |
| P3 retry 상수 | 완료 | situation/model/retry-policy.ts의 COURSE_RETRY_LIMIT를 generation retry_index 계산과 widget retry_limit 파라미터가 공유. backend CourseRequestSessionStore의 `${quota.course.retry-limit:5}` 기본값과 동시 관리 필요 주석. 서버 설정을 런타임으로 읽는다고 주장하지 않음 |

### P1 원인 및 경계 근거
- 수정 전 로컬에 남아 있던 Claude 빌드 stats에서 `/_not-found` 초기 청크를 읽어 확인했다. `32xymq6j4w9-n.js`(17,394 bytes)에 dayro_auth_event와 카카오·로그아웃·탈퇴 UI 코드가 함께 있고, `3gaa7wgr7ua6e.js`(52,748 bytes)에 withdraw/nickname/zod 관련 코드가 있었다. 따라서 root의 넓은 auth 배럴이 불필요한 인증 UI·계약 의존 경로를 여는 finding은 import graph와 기존 빌드 산출물로 뒷받침된다. 청크 전체 크기를 원인별 절감량으로 간주하지 않는다.
- 기존 feature 최상위에는 index.ts 외에 동등한 slim client 보조 entry 관례가 없었다. 사용자가 승인한 `analytics.ts`를 **명시적 보조 public entry**로 채택했다. layout에서 hooks 내부를 직접 import하지 않는다.
- `server-client-boundary.md`의 핵심인 client-safe/server-only 분리 준수: analytics.ts는 client leaf만 공개하고 server-auth helper·next/headers는 연결하지 않는다. 기존 server/index.ts 분리 관례와 동일하게 용도별 공개 표면을 좁힌 것이다.
- `performance.md`의 “전역 layout/shared barrel에 도메인별 클라이언트 코드를 쌓지 않음” 원칙에 따라 root는 auth UI 배럴과 분리했다. shared의 기본 index도 Script 컴포넌트를 재export하지 않아 각 feature 이벤트 호출이 next/script를 따라가지 않는다.
- TypeScript AST로 runtime import/reexport 경로를 추적(type-only 제외)한 수정 후 결과:
  - auth/analytics.ts: auth tracker/model + shared config/track/attribution/events/url, 외부 의존은 react와 next/navigation만.
  - shared/analytics/client.ts: AnalyticsScripts/useAnalytics + 위 측정 모듈, 외부 의존은 next/script/react/next/navigation만.
  - shared/analytics/index.ts: config/track/attribution/events/url, 외부 패키지 의존 없음.
  - 세 진입점 어디에도 auth UI, shared UI, OpenAPI, 서버 helper의 runtime 경로가 없다.
- 목표 ≤ 수 KB와 전 라우트 예산 통과는 **아직 측정하지 않았다**. baseline 수정 없음. 실제 절감량 및 잔여 next/script/분석 코드 비용은 Claude의 최종 build·bundle 결과로 판정한다.
- shared 분석 계약의 리터럴 범위(예: retry_limit=5)는 측정 스키마로 유지한다. 도메인 quota 상수를 shared가 feature에서 역방향 import하지 않으며, 정책 계산 및 이벤트 값 생산자는 situation의 단일 상수를 사용한다.

### 라운드 2 변경 파일
- 신규: `src/features/auth/analytics.ts`, `src/shared/analytics/client.ts`, `src/features/situation/model/retry-policy.ts`.
- 진입점/연결: `src/app/layout.tsx`, `src/features/auth/index.ts`(라운드 1 추가 export 제거), `src/shared/analytics/index.ts`, `src/features/auth/model/auth-event.ts`, `src/features/situation/index.ts`, `src/features/situation/model/generation-analytics.ts`, `src/widgets/situation/hooks/useSituationFlowController.ts`.
- readiness 및 테스트: `src/shared/analytics/useAnalytics.ts`, `AnalyticsScripts.tsx`, `test/scripts.test.ts`.
- 스타일/JSDoc: 신규 analytics 파일, AuthEventTracker/auth-event, server-auth-event, generation-analytics와 신규 기능 테스트 파일들.
- 보고: 본 validation report 및 run log 라운드 2 추가. Claude의 legal/UTM 문서 변경은 보존하고 수정하지 않았다.

### 직접 실행한 라운드 2 evidence
- `npm run lint`: **exit 0**, errors 0, 기존 warnings 2.
- `npx tsc --noEmit -p .`: **exit 0**, 오류 없음.
- `npm run test:unit -- src/shared/analytics/test src/features/auth/test/auth-event.test.ts src/features/situation/test/generation src/features/saved/test/share-analytics.test.ts src/features/course-map/test/save-analytics.test.ts src/features/course-result/test/restored-course-candidates.test.ts src/widgets/situation/hooks/retry-analytics.test.ts`: **9 files / 49 tests passed**.
- 추가 검증: 초기 렌더 script 없음 → stub init 명령 존재 → microtask readiness 후 script 렌더, 기존 큐 보존, 벤더 초기화 실패, cleanup 후 통지 억제.
- `git diff --check`: 통과.
- 로그: `/tmp/dayro-round2-lint.log`, `/tmp/dayro-round2-type.log`, `/tmp/dayro-round2-unit.log`.
- build·bundle·전체 unit·e2e: 이번 라운드 미실행(사용자 요청 범위). FAQ timeout 판단은 사용자 제공 Claude evidence를 유지한다.

### 라운드 2 판정 및 다음 리뷰
- 코드 findings 수정과 요청된 로컬 검증 완료. 전체 판정은 **blocked(Claude 최종 번들 재측정 대기)**를 유지하며 예산 통과를 주장하지 않는다.
- Claude 확인 포인트: slim public entry로 초과 라우트 청크가 제거됐는지, 공용 증가분 수치, 초기화 후 script 마운트 실제 브라우저 동작.
- GA DebugView·Meta 실제 수신·Lighthouse는 기존대로 ID 발급 후 사용자 확인 항목이다.

## 라운드 3 — 독립 검증 세션(Claude 서브에이전트)

### 작업 일시 (실행 날짜)
- 2026-10-05 15:00~15:20 KST, branch `feat/#125-marketing-attribution`(미커밋 working tree).
- 검증자: Claude 서브에이전트(ValidationAgent 역할). 구현에 참여하지 않은 독립 세션. 비즈니스 로직 검증 owner=Codex 규칙과 다른 점은 사용자 지시로 승인됨(round3 handoff "업데이트" 참조).
- 소스·테스트 수정 없음, e2e·dev 서버 미실행, commit/push 없음.

### Intent Source (의도 출처)
- task_id: `2026-10-05-marketing-attribution`
- intent artifact: `intent/tasks/2026-10-05-marketing-attribution.md` Acceptance Criteria
- 구현 계약: `intent/sdd/2026-10-05-marketing-attribution.md` "Design Decisions (확정)" + "로딩 전략 (라운드 3)"
- 참고: PRD 동명, `reports/handoffs/2026-10-05-marketing-attribution-debate.md`, `-round3.md`

### 읽은 문서
- `AGENTS.MD`(검증 시작/최종 보고 항목), `agents/validation.md`, `reports/README.md`
- SDD / tasks / 토론·라운드3 handoff / 본 리포트 라운드 1~2
- guide trigger: `server-client-boundary.md`(root layout client leaf·server-only helper), `client-logic-separation.md`(UI 파일 로직 혼입), `bff.md`(콜백 Route Handler 쿠키), `performance.md`(전역 layout·서드파티). `accessibility.md`는 UI 변경 없음으로 제외.

### 최종 결정 (판정 결과)
- **`rejected`** — 코드 품질·테스트·빌드·번들 예산은 통과했으나, must-not AC "requestId·장소명·허용 목록 외 URL 쿼리를 이벤트에 포함하면 안 된다"가 **Meta 경로에서 실제로 충족되지 않는다**(P1). Meta Pixel은 모든 `/tr` 요청에 현재 문서 URL(`dl`)을 자동 첨부하고, `/course/new`의 result/course 단계 URL에는 `requestId`·`selectedPlaces`/`candidatePlaces`(장소명 포함 JSON)가 들어 있다. SDD는 Meta 자동 URL 정제 불가를 인지했지만 사용자 결정은 `/login`에만 적용되어 계약 공백이 남았다. 해소 방식은 사용자 결정이 필요하다.

### Acceptance Criteria 확인 (완료 조건 점검)
| AC | 판정 | 근거 (file:line) |
| --- | --- | --- |
| production+flag+벤더 ID일 때만 로드, 그 외 전역 객체·네트워크 없음 | 충족(코드·단위) | `shared/analytics/config.ts:5-11`, `dispatch.ts:21-22`에서 gate 미통과 시 task 미실행 → `import("./runtime")` 자체가 일어나지 않음. 전역 생성은 `runtime.ts:39-103`에서만. 빌드 산출물 first-load 청크에는 `getAnalyticsConfig`/`scheduleAnalytics`만 있고 `dayro_first_touch`·`dayro_auth_event`·`googletagmanager`는 lazy 청크(`091sr7twc-fpa.js` 4,132B, `0xk6vcfj55wlw.js` 5,036B)에만 존재 |
| 환경변수 3종 문서화 | 충족 | `docs/analytics-setup.md:5-11` |
| first-touch 보존, sign_up/login GA에만 first_utm | 충족(단위) | `attribution.ts:49-64`(기존 유효값 있으면 미덮어씀, 고정 90일), `runtime.ts:138`(GA만 `firstTouchParams`), `runtime.ts:151`(Meta는 `safe`만). 실제 OAuth 왕복 미검증 |
| sign_up/login 단일 탭 벤더별 1회 | 충족(단위) | `auth-event.ts:16-73` 검증→sessionStorage 확인→`enqueueEvent(skip)`→기록→삭제. `server-auth-event.ts:13-26` 속성 계약 일치 |
| course_generated/regenerated/retry_limit_reached, 복원·실패 무전송 | 충족(단위) | `useCourseGeneration.ts:123-126`(fetch ok + zod parse 성공 후), `:167-170`(retry promise 캐시 내 1회), `generation-analytics.ts:29-62`(requestId 중복 억제, requestId 미전송), `useSituationFlowController.ts:209`(소진 분기만). 복원 테스트 afterEach 무전송 assertion |
| course_saved 성공 직후 / course_shared 완료 시, 실패·취소 제외 | 충족(단위) | `useCourseMapScreen.ts:90-91`, `useSavedCourseDetailScreen.ts:79-80,86-87`(await 이후, catch 경로 미호출) |
| pathname 변경 시 GA page_view·Meta PageView 1회, 쿼리 전환 미기록 | **부분 충족 / 미검증** | 앱 코드는 충족(`useAnalytics.ts:13-18`, `runtime.ts:172-176`). 단 Meta SDK 자체의 history(pushState) 자동 PageView를 끄는 코드가 없음(P2, 실제 Test Events 확인 필요) |
| /login Meta 미발행 | 충족(앱 코드) / P2 잔여 | `runtime.ts:72-73,149-150`, `scripts.ts:32`. SDK 자동 PageView가 켜져 있으면 클라이언트 이동으로 /login 진입 시 우회 가능성(P2) |
| PII·requestId·장소명·허용 외 쿼리 미포함 | **미충족(Meta)** | GA는 `sanitizeParams`(`events.ts:82-90`)+`sanitizeUrl`(`url.ts:8-25`)로 충족. Meta는 SDK가 `dl`=`location.href`를 자동 첨부 → `url-state.ts:276,293,300`의 `requestId`·`selectedPlaces`·`candidatePlaces`(PlaceCandidate.name 포함)가 course_regenerated·course_retry_limit_reached·course_saved 및 해당 화면 PageView와 함께 전송됨(P1) |
| 분석 실패가 앱 기능을 깨지 않음 | 충족 | `track.ts:14-22`, `dispatch.ts:20-33`(체인 rejection 흡수), `runtime.ts` 벤더별 try/catch, `scripts.ts:6-20`. 호출부는 모두 성공 처리 이후 동기 void 호출 |
| UI(JSX) 파일에 추적 로직 없음 | 충족 | `AnalyticsScripts.tsx`는 hook 호출 + `return null`, 정책은 hooks/model |
| 개인정보처리방침 고지 | 충족(문구 보완 권장) | `shared/static/legal/index.ts` 6항. "입력한 코스 내용은 전송하지 않습니다"는 범주형 목적·교통·시간 길이 전송 및 P1(Meta URL)과 불일치(P3) |
| 번들 예산 내(baseline 상향 없음) | 충족 | 아래 표, `check-route-bundle-budget` exit 0, baseline 파일 변경 없음 |
| CWV 회귀 없음 | 미검증 | 실제 ID 필요(Lighthouse) |
| UTM 규칙표 | 충족 | `docs/marketing-utm-guide.md` |

### 변경 파일 요약 (라운드 3 시점 working tree)
- 신규: `shared/analytics/{config,dispatch,track,runtime,scripts,url,attribution,events,useAnalytics,AnalyticsScripts,client,index}.ts(x)`, `shared/analytics/test/{analytics,scripts}.test.ts`, `features/auth/{analytics.ts,hooks/AuthEventTracker.ts,model/auth-event.ts,test/auth-event.test.ts}`, `shared/api/server-auth-event.ts`, `features/situation/model/{generation-analytics,retry-policy}.ts` + 테스트 2, `features/course-map/test/save-analytics.test.ts`, `features/saved/test/share-analytics.test.ts`, `widgets/situation/hooks/retry-analytics.test.ts`, `docs/analytics-setup.md`, `docs/marketing-utm-guide.md`
- 수정: `app/layout.tsx`, `app/api/auth/kakao/callback/route.ts`, `features/situation/{hooks/useCourseGeneration.ts,index.ts}`, `features/course-map/hooks/useCourseMapScreen.ts`, `features/saved/hooks/useSavedCourseDetailScreen.ts`, `widgets/situation/hooks/useSituationFlowController.ts`, `features/course-result/test/restored-course-candidates.test.ts`, `shared/static/legal/index.ts`

### 실행 루프 요약 (작업 흐름 요약)
- loop type: Full Loop (Validate 단계 재진입)
- iterations: 구현 3라운드 + 본 독립 검증 1회
- handoff 사용 여부: 라운드3 file-based handoff → Claude 테스트 재작성 → 본 독립 검증
- evidence bundle: Validation Bundle + BFF Bundle(콜백 쿠키). e2e는 `not_run`(사용자 미지시)

### 실행한 검증 명령 (frontend/, 2026-10-05 15:0x KST 직접 실행)
| 명령 | 결과 |
| --- | --- |
| `npm run lint` | exit 0 — 0 errors / 2 warnings(기존) |
| `npx tsc --noEmit -p .` | exit 0 |
| `npm run test:unit` | 82 files 중 81 pass, **636 pass / 2 fail** — 실패 2건은 `src/features/faq/test/contact-form.test.tsx`의 5,000ms timeout(사전 존재 flaky, develop baseline 동일로 고지됨, 본 작업과 무관 분류) |
| `npm run build` | exit 0, 26 정적 페이지 생성 |
| `node scripts/check-route-bundle-budget.mjs` | exit 0, 15개 라우트 전부 limit 이내 |

라우트별 first-load(비압축 JS) Δ vs `scripts/route-bundle-baseline.json`:
| 라우트 | baseline | 현재 | Δ | limit |
| --- | --- | --- | --- | --- |
| /saved, /saved/[id] | 699,011 | 700,835 | +1,824 | 712,991 |
| /course/new | 668,043 | 671,279 | +3,236 | 681,404 |
| /faq, /faq/contact | 636,437 | 638,045 | +1,608 | 649,166 |
| / | 629,629 | 631,237 | +1,608 | 642,222 |
| /login, /mypage, /mypage/withdraw, /privacy, /terms | 629,063 | 630,671 | +1,608 | 641,644 |
| /ui-preview | 577,363 | 578,983 | +1,620 | 588,910 |
| /ui-preview/layout-demo | 574,112 | 575,732 | +1,620 | 585,594 |
| /ui-preview/colors | 518,114 | 519,734 | +1,620 | 528,476 |
| /_not-found | 514,718 | 516,338 | +1,620 | 525,012 |
- round3 handoff의 Claude 측정치와 바이트 단위로 일치. 라운드 2(+10.9~12.6KB) 대비 약 −9.4KB, 목표(root ≈1~2KB) 충족.

### Evidence Gate (증거 통과 여부)
- intent artifact: PRD/SDD/tasks 존재
- tests: 통과(FAQ 사전 flaky 2건 별도 분류)
- typecheck: 통과
- build: 통과
- additional review: 본 독립 코드 리뷰 — P1 1건, P2 1건, P3 4건
- skipped with reason: e2e(사용자 미지시), GA DebugView·Meta Test Events·Lighthouse(실제 ID 미발급)

### 구조 / VSA 검토 결과
- root `layout.tsx`는 Server Component 유지, `cookies()` 미사용. client leaf는 `shared/analytics/client` + `features/auth/analytics` 보조 진입점만 import → 인증 UI 배럴 미유입(빌드 청크로 확인).
- server-only `server-auth-event.ts`는 Route Handler에서만 import, client 번들 경로 없음.
- 도메인 판정(성공 여부·범주 변환·requestId 중복)은 `features/situation/model`, auth 소비는 `features/auth/model`에 있고 shared는 계약·전송만 소유 — SDD 모듈 경계 준수.
- P3: `features/auth/model/auth-event.ts:2`가 `@/shared/analytics/runtime`을 deep import(라운드 2에서 config deep import를 고친 것과 같은 유형). 지연 로드 목적상 index 경유 불가이므로 runtime을 명시적 보조 public 진입점으로 문서화 권장.
- P3: `AnalyticsScripts`는 더 이상 script를 렌더하지 않는 tracker인데 이름이 그대로라 읽는 사람을 오도함. `runtime.ts`는 trailing comma·영문/한글 주석 혼재 등 주변 코드 대비 포맷 일관성 낮음.

### Failure Taxonomy 또는 미검증 항목
- `doc_mismatch` / `intent_gap` (P1): Meta 자동 URL(`dl`)에 course 플로우 쿼리(requestId·장소명 JSON)가 실려 must-not AC 위반. SDD는 `/login`만 결정, 토론 문서 41행의 "민감 쿼리 경로 Meta 미발행" 대안이 다른 경로에 적용되지 않음.
- `implementation_bug`(가능성, P2): Meta SDK history 자동 PageView 비활성화(`fbq.disablePushState = true`) 부재 → `/course/new`의 `router.push(?step=...)` 쿼리 전환마다 SDK 자동 PageView 및 중복 PageView, 클라이언트 이동 `/login` 진입 시 PageView 가능. 벤더 동작 의존으로 실제 Test Events 확인 필요.
- `implementation_bug`(가능성, P3): `runtime.ts:58-63` `gtag('config')`에 `page_location`·`page_referrer`·`event_timestamp_ms`를 넣으면 config 파라미터가 이후 자동 이벤트(user_engagement·scroll 등)에 유지되어 첫 URL/시각으로 오기록될 수 있음. DebugView 확인 필요.
- `doc_mismatch` (P3): 방침 6항 "입력한 코스 내용은 전송하지 않습니다"가 범주형 입력값 전송 및 P1 상태와 불일치. "Meta 광고 설정에서 수집을 거부"는 실제로는 광고 활용 거부에 가까움.
- `missing_evidence`: GA DebugView, Meta Test Events, 카카오 왕복 실브라우저, Lighthouse 전 지표(실제 ID 발급 후 사용자).

### 남은 리스크 및 후속 작업
1. (P1, 사용자 결정 필요) Meta 처리 방식 택1: (a) `sanitizeUrl(location.href)`가 원본과 다르면(허용 외 쿼리 존재) Meta 이벤트·PageView 생략(GA는 유지) — `/login` 정책의 일반화, (b) course 플로우 상태를 URL 밖(sessionStorage 등)으로 이동 — 범위 큼, (c) Meta는 쿼리 없는 경로(`/`, `/saved` 등)에서만 발행. 결정 후 SDD "URL 정제" 갱신 + 단위 테스트(쿼리 있는 URL에서 fbq 미호출) 추가.
2. (P2) Meta stub 생성 직후 `window.fbq.disablePushState = true`(init 이전) 추가 + 테스트, Test Events에서 쿼리 전환 시 PageView 미발생 확인.
3. (P3) config에서 page_location/page_referrer/event_timestamp_ms 제거(이벤트별 첨부만 유지), auth-event runtime deep import 정리/문서화, `AnalyticsScripts` 명칭, 방침 문구 정정.
4. 수정 후 lint·tsc·unit·build·번들 예산 재측정(lazy 청크 증가만 예상, first-load 영향 미미).

## 라운드 4 — 독립 재검증

### 작업 일시 / 범위
- 2026-10-05 KST, 라운드 3과 같은 독립 Claude 서브에이전트(ValidationAgent). 같은 working tree에서 라운드 3 findings(P1~P3) 반영분과 회귀를 재검토.
- 사용자 결정(P1): "현업 정석" — 1단계로 `/login` 또는 허용 목록 밖 쿼리가 있는 URL에서는 Meta Pixel 차단, GA는 정제 URL로 계속 수집. 2단계(코스 상태를 URL 밖으로 이동)는 별도 후속 이슈로 범위 밖.
- 소스·테스트 수정, e2e, dev 서버, commit 모두 하지 않음.

### 최종 결정
- **`approved_with_notes`** — P1·P2·P3가 모두 해소됐고 evidence gate를 통과했다. 아래 잔여 사항은 모두 P3(문서 정합·벤더 동작 의존 잔여 위험)이며 머지를 막지 않는다. GA DebugView, Meta Test Events, Lighthouse는 실제 ID 발급 후 사용자 확인 항목으로 계속 남는다.

### 라운드 3 findings 해소 확인
| Finding | 판정 | 근거 |
| --- | --- | --- |
| P1 Meta `dl`에 requestId·장소명 포함 | 해소 | `url.ts:36-51` `isMetaBlockedUrl`(`/login`·허용 외 쿼리 키·파싱 실패 시 차단). 아래 3곳 모두 발생 URL(`context.url`)과 실제 제출 시점 URL(`window.location.href`)을 함께 검사 → `runtime.ts:77` Meta stub/init, `runtime.ts:155-160` fbq 제출, `scripts.ts:33` SDK 주입. 차단 URL에서는 fbq 호출 자체가 없으므로 SDK가 `dl`을 만들 기회가 없다. 테스트 `analytics.test.ts:112-131`(requestId·candidatePlaces·notice URL에서 fbq 없음, GA 페이로드에도 해당 값 없음, 분류 케이스) |
| P2 SDK history 자동 PageView | 해소(코드) / 실수신 미검증 | `runtime.ts:97` stub 생성 직후·init·SDK 주입 전에 `disablePushState = true`. 이미 fbq가 있는 경우에도 매번 설정. 테스트 `analytics.test.ts:96`. 실제 효과는 Meta Test Events로 확인 필요 |
| P3 GA config 고정값 | 해소 | `runtime.ts:68` `{ send_page_view: false }`만 전달, 이벤트별 첨부는 `runtime.ts:142-148` |
| P3 runtime deep import | 해소(문서화) | `runtime.ts:1-6` 지연 로드 전용 보조 진입점 규칙과 auth-event 예외를 명시 |
| P3 명칭·포맷 | 해소 | `AnalyticsTracker.tsx`, `client.ts`, `layout.tsx:1,30`. `AnalyticsScripts` 잔존 참조 0건. 한국어 주석, trailing comma 정리 |
| P3 방침 문구 | 해소 | `legal/index.ts` 6항: 범주형 값(목적·이동수단·시간대·장소 수) 명시, 장소명 미전송, 코스 URL·로그인 화면에서 Meta 미실행, Meta는 "맞춤 광고 활용 거부"로 정정. 실제 동작과 일치 |

### 회귀 검토
- 인증 쿠키 소비(Meta 차단 시): `auth-event.ts`는 변경 없음. 차단 URL에서는 `ready.meta=false`, `result.meta=false` → GA만 기록하고 sessionStorage에 `{ga:true, meta:false}` 저장 → 쿠키는 유지 → 다음 pathname 변경 때 GA는 skip하고 Meta만 재시도 → 300초 내 깨끗한 URL에서 소비되면 삭제. GA 중복 제출은 없다. 콜백 성공 시 redirect는 `new URL("/", ...)`(`route.ts:50`)로 쿼리가 없어 정상 경로에서 즉시 소비. 한계: 사용자가 300초 동안 쿼리 URL에만 머물면 Meta `login`/`sign_up`은 누락(수용 가능, 기존 보장 범위 문구와 일치).
- 페이지뷰: `useAnalytics`·`trackPageView`는 변경 없음. 차단 URL에서는 GA page_view만 나가고 Meta PageView는 생략. pathname 중복 억제 상태는 GA·Meta 공통이라, 차단 URL에서 생략된 Meta PageView를 같은 pathname의 이후 쿼리 해제 시점에 다시 보내지는 않는다(의도된 동작).
- 비활성 gate·지연 import: 변경 없음. first-load 바이트가 라운드 3과 동일(아래 표).
- GA: `sanitizeUrl`은 공용 `ALLOWED_QUERY_KEYS`로 리팩터링됐을 뿐 동작은 같다.

### 실행한 검증 명령 (frontend/, 직접 실행)
| 명령 | 결과 |
| --- | --- |
| `npm run lint` | exit 0 — 0 errors / 2 warnings(기존) |
| `npx tsc --noEmit -p .` | exit 0 |
| `npm run test:unit` | 81/82 files, **640 pass / 2 fail** — 실패 2건은 `faq/test/contact-form.test.tsx` 5,000ms timeout(사전 존재 flaky, 이번 작업과 무관) |
| `npm run build` | exit 0 |
| `node scripts/check-route-bundle-budget.mjs` | exit 0. 15개 라우트 전부 라운드 3과 바이트 동일(Δ vs baseline: `/course/new` +3,236, `/saved`·`/saved/[id]` +1,824, ui-preview 계열·`/_not-found` +1,620, 나머지 +1,608) |

### 잔여 findings (모두 P3, 비차단)
1. 문서 정합 — `intent/sdd/2026-10-05-marketing-attribution.md:38`("로딩 전략")에 "Meta는 … /login이면 생략"이 남아 있고, `docs/analytics-setup.md:13`도 "/login에서 이벤트를 발행하지 않습니다"만 적혀 있다. 일반화된 차단 정책(허용 외 쿼리)과 `disablePushState`로 갱신 필요.
2. 마케팅 데이터 손실 위험 — 허용 목록 밖 키(예: `utm_id`, Meta 광고 동적 매개변수 `ad_id`·`campaign_id`)가 랜딩 URL에 붙으면 랜딩에서 Meta가 아예 초기화되지 않는다. 그러면 Meta SDK가 `fbclid`로 `_fbc` 쿠키를 만들 기회도 없어 Meta 클릭 귀속이 사라진다. `docs/marketing-utm-guide.md`에 "허용 키 외 매개변수 추가 금지(추가 시 Meta 측정 불가)"를 명시해야 한다. 같은 문서 12행의 `/course/new?utm_…` 랜딩 예시도 이후 `?step=` 전환에서 Meta가 차단되므로 `/` 랜딩을 권장하도록 정리 권장.
3. 벤더 동작 의존 잔여(추정, Test Events로 확인) — 공식 stub 큐는 SDK 로드 후 재생된다. 재생 시 Meta가 그 시점의 `location.href`를 `dl`로 쓴다면, 깨끗한 URL에서 큐에 넣은 PageView가 SDK 다운로드 중 사용자가 쿼리 URL로 이동한 뒤 그 주소로 전송될 수 있다. requestId·장소가 들어간 단계까지 가려면 생성 API 왕복이 필요해, 아주 느린 네트워크가 아니면 발생 가능성은 낮다. 또한 `rl`(document.referrer)은 검사하지 않는다. 다만 앱은 클라이언트 이동만 써서 referrer가 같은 출처의 쿼리 URL이 되는 경로를 찾지 못했다. 근본 해결은 후속 2단계(코스 상태 URL 제거)다.

### Failure Taxonomy / 미검증
- `doc_mismatch`(P3): 잔여 1·2
- `performance_risk`/`missing_evidence`: Lighthouse 전 지표 미측정(ID 필요)
- `missing_evidence`: GA DebugView, Meta Test Events(`disablePushState`·차단 URL 무전송·큐 재생 URL 포함), 카카오 왕복 실브라우저, e2e(`not_run`, 사용자 미지시)

### 후속 작업
- 잔여 1·2 문서 갱신(머지 전 권장, 코드 영향 없음)
- 후속 이슈: 코스 상태를 URL 밖으로 이동(2단계) → 이후 course 이벤트 Meta 전송 재개 검토
- ID 발급 후: DebugView / Test Events / Lighthouse before/after
