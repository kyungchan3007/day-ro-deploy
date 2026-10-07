# Validation Report - 코스 만들기 상태 URL 밖 이동 (#129)

## Meta
- task_id: 2026-10-05-course-state-out-of-url
- date: 2026-10-05
- validator: 독립 ValidationAgent 세션(Claude, 구현에 참여하지 않음)
- branch: `refactor/#129-course-state-out-of-url` (커밋 전 working tree 기준)
- loop: Full Loop (경계·계약·성능·주요 화면)
- decision: **rejected**

## 검증 시작 응답
- 작업 유형: 아키텍처 경계 변경을 포함한 리팩터의 최종 검증 (server/client 경계, URL 계약, 분석 계약, 성능)
- 읽은 문서: `AGENTS.MD`, `.agents/agents/validation.md`, `.agents/reports/README.md`, PRD/SDD/tasks `2026-10-05-course-state-out-of-url`, 토론 기록 `reports/handoffs/2026-10-05-course-state-out-of-url-debate.md`, domain `course-situation`·`course-result`·`course-map`·`course`(diff), `reports/validation/2026-10-05-marketing-attribution.md`(번들 기준 비교용)
- 구현 기준: SDD "Design Decisions (확정)", 토론 합의안 12항
- 검증 기준: tasks Acceptance Criteria, guides server-client-boundary / client-logic-separation / bff / performance
- guide trigger: server-client-boundary(page.tsx·서버 데이터 함수 변경), client-logic-separation(controller·hooks), bff(생성 API 호출 경로 — BFF 자체 변경 없음), performance(SSR→클라이언트 복원, 번들) — 모두 해당
- 제외: `.agents/onboarding.md`(사람용), e2e 실행(사용자 명시 요청 없음, 지시상 금지)
- 충돌: SDD는 "ADR-26에 rev 전송 허용 명시"를 요구하나 ADR-26 원문이 repo `.agents` 안에 없음(외부 문서로 추정) → 미검증 항목으로 분류

## 작업 요약
`/course/new` 주소에서 조건·requestId·후보·선택 장소를 제거하고 `step` + 8자 `rev`만 남김. rev는 `features/situation/model/course-flow.ts`의 불변 스냅샷을 가리키며 `lib/course-flow-storage.ts`가 sessionStorage(`dayro:course-flow:v1`)에 영속화. 서버 `getCourseNewPageData`의 `submitSituation` 폴백 제거, 레거시 쿼리는 서버 redirect. 생성은 loading 스냅샷 operation 기반으로 `useCourseGeneration`이 수행.

## Evidence (검증자가 직접 실행)
| 명령 | 결과 |
| --- | --- |
| `npm run lint` | 0 errors, 2 warnings (모두 기존: `public/mockServiceWorker.js` unused directive, `useWheelColumn.ts` unused `useMemo` — 이번 diff 밖) |
| `npx tsc --noEmit -p .` | 통과 (exit 0) |
| `npm run test:unit` | 81 files 중 80 pass, 647 tests 중 645 pass / **2 fail** — `src/features/faq/test/contact-form.test.tsx` 5s timeout 2건(기존 flake, develop에서도 실패로 보고됨, 이번 범위 밖) |
| `npm run build` | 통과, `/course/new` ƒ(Dynamic) |
| `node scripts/check-route-bundle-budget.mjs` | 통과 (`/course/new` 674,532B / limit 681,403.86B) |
| 직접 비교 빌드(HEAD 스냅샷을 scratchpad에 추출해 동일 node_modules로 빌드) | `/course/new` 671,279 → 674,532 (**+3,253B**), 일반 라우트 +149~269B(`shared/analytics/url.ts` 변경분), ui-preview·_not-found 0B. HEAD 빌드는 `.env.local` 없이 수행(값 미접근) — ui-preview 계열 0B 차이로 env 영향은 없다고 판단 |
| baseline(`scripts/route-bundle-baseline.json`, 2026-09-13) 대비 | `/course/new` +6,489B, 일반 라우트 +1,620~2,093B — baseline이 #125 이전이므로 차이 대부분은 #125 몫, #129 몫은 위 직접 비교값 |
| 재현 probe(scratchpad 복사본에서만 실행, repo 미변경) | 아래 F1·F2 재현 성공 |

## Acceptance Criteria
| AC | 판정 | 근거 |
| --- | --- | --- |
| 모든 단계 주소에 step·rev(·유입 키)만 | met | `model/url-state.ts:96-117` buildCourseRouteUrl은 step·rev·allowlist 유입 키만 직렬화, controller의 모든 이동이 `recordStepUrl`(`useSituationFlowController.ts:98-104`) 경유. unit `url-state.test.ts:25-77` |
| 같은 탭 새로고침 복원 + 조회·복원 중 생성 API 미호출 | met(코드) / e2e 미검증 | 서버 `get-course-new-page-data.ts:31-61`에 submitSituation 없음, `useCourseFlowSnapshot.ts:44-72` 읽기 전용, done operation 재사용 `useCourseGeneration.ts:146-159`. unit `generation-events.test.ts:115` |
| 뒤/앞으로 가기 시 해당 rev 화면 + 최신 잔여 횟수 | met(코드) / 실브라우저 미검증 | 불변 append `course-flow.ts:271-284`, 잔여 횟수 `retries[requestId]` `useSituationFlowController.ts:80-81`. 단 F1 발생 시 루프가 스냅샷 50개를 채워 기존 history rev를 퇴출함 |
| 재추천·소진 안내(#126)·저장·로그인 왕복 기존과 동일 | **not met** | F2: 마지막 재추천으로 0이 되었을 때의 자동 토스트 "다른 코스 보기를 모두 사용했어요." 회귀(probe 재현). 클릭 시 소진 안내(`:221-226`)는 유지. 로그인 왕복은 `next`를 소비하는 코드가 없어 복귀 자체가 기존에도 미동작(F4, 기존 결함) |
| 복원 실패 시 자동 생성 없이 purpose/첫 미완료 단계 | **not met** | F1: 스냅샷 없음(rev 없음·미지·만료·퇴출, 저장소 차단 후 새로고침, 새 탭)에서 fallback effect가 무한 갱신 → "Maximum update depth exceeded"(probe에서 router.replace 53회, 정크 스냅샷 50개). 자동 생성은 없음 |
| loading 중 실행 주체 상실 → 재전송 없이 안내 후 purpose / 같은 문서 재진입은 기존 요청 재연결 | met | `useCourseGeneration.ts:59-62, 160-167`, `useSituationFlowController.ts:143-156`, StrictMode 재실행 시 map 재연결. unit `generation-events.test.ts:127,139` |
| 레거시/미지 쿼리 → 생성·Meta 없이 `?step=time`(유입 키 보존) | met | `url-state.ts:52-87` isClean, `get-course-new-page-data.ts:35-40`, `app/course/new/page.tsx:22-24` 서버 redirect(HTML 전 응답이라 Meta 미발행). unit `course-new-page-data.test.ts:108` |
| 코스 화면(loading 포함) Meta 발행 + step·rev 외 키·중복 키·fragment 차단 | met | `shared/analytics/url.ts:37-75`, unit `analytics.test.ts` "allows only step and 8-char rev…". 단 fragment·중복 키 차단이 전 라우트로 확대됨(F5) |
| 복원 시 생성 이벤트 재발행 금지 | met | `trackGenerationSuccess`는 `runOperation`의 API 성공 then 안에서만(`useCourseGeneration.ts:73-74`), done 재사용 경로는 미호출 |
| 저장소 실패 시 메모리 폴백 | met | `course-flow-storage.ts:18-29, 51-63`, unit `course-flow.test.ts:205` |
| LCP·CLS 회귀 없음, 번들 예산, 기존 e2e 통과 | partially / unverifiable | 번들 예산 통과(+3,253B). LCP·CLS·e2e는 미실행. 최초 time 진입은 SSR 유지(`useCourseFlowSnapshot.ts:56-58`), rev 있는 진입은 빈 셸(`SituationFlow.tsx:60-62`) 후 복원 |

## Findings
### F1 (P1, implementation_bug) 복원 실패 fallback 무한 갱신 루프
- 위치: `src/features/situation/hooks/useCourseFlowSnapshot.ts:63,70` (`fallbackAnswers: {}` / `snapshot?.answers ?? {}`가 매 계산마다 새 객체) + `src/widgets/situation/hooks/useSituationFlowController.ts:126-140` (effect deps에 `fallbackAnswers`)
- 메커니즘: effect가 `recordStepUrl` → `updateCourseFlowState` → listener → useSyncExternalStore 동기 재렌더 → memo 재계산(state 변경) → 새 `{}` → effect 재실행. `router.replace`는 transition이라 step/rev가 바뀌기 전에 동기 루프가 반복된다.
- 재현: scratchpad 복사본에서 실제 controller + 실제 storage를 react-dom으로 렌더(`step="result"`, rev 없음 / `rev="abcd1234"` 미존재) → 두 경우 모두 `Maximum update depth exceeded`, `router.replace` 53회, 저장소 스냅샷 50개(상한까지 정크로 채움).
- 영향 시나리오: 결과 URL을 새 탭에 붙여넣기, 24h 만료·퇴출 rev 새로고침, `?step=region`처럼 rev 없는 비-time 주소, 저장소 차단 환경에서 새로고침. 프로덕션에서는 React error #185로 클라이언트 예외 화면. 부수적으로 같은 탭의 기존 history rev가 퇴출됨.
- 미검출 이유: fallback 경로를 다루는 unit/e2e 없음(e2e 3개 모두 `/course/new`에서 정상 흐름만 진행, `retry-analytics.test.ts`는 hooks를 mock).
- 수정 제안: (a) `useCourseFlowSnapshot`에서 빈 answers를 모듈 상수로 고정, (b) controller effect를 `${step}:${rev}` 키 ref로 주소당 1회만 실행하도록 가드(둘 다 권장). fallback 경로 단위 테스트(렌더 기반) 추가.

### F2 (P2, implementation_bug / regression #126) 마지막 재추천 후 소진 자동 토스트 누락
- 위치: `src/widgets/situation/hooks/useSituationFlowController.ts:158-169` + `:80-81`
- 메커니즘: retry loading 스냅샷에도 `requestId`가 있어(`:228-231`) loading 단계에서 `remainingRetries = retries[R]`가 계산된다. 응답 도착(loading 화면 체류 중) 시 `retries[R]=0`으로 갱신 → effect의 non-result 분기가 `previousRemainingRetries.current = 0` 저장 → result 진입 시 `0 && prev !== 0` 불성립 → 토스트 미표시. 기존(HEAD)은 loading 단계 잔여 횟수가 undefined라 result 진입 시 표시됐다.
- 재현: probe에서 retries{R:1} → retry 응답 remainingRetries 0 → result rev 렌더 → `show` 호출 0회.
- 수정 제안: ref 갱신을 result 단계에서만 하거나, "직전 result 화면에서 본 값"을 requestId별로 기억. 회귀 테스트 추가.

### F3 (P3, implementation_bug, 기존 동작 유지) 생성 실패 시 loading 정지
- `useSituationFlowController.ts:181-203`이 `generation.phase === "error"`를 화면에 전달하지 않음 → CTA 비활성 상태로 머묾. HEAD도 동일(기존 결함). 추가로 실패 operation은 저장소에 `pending`으로 남아 새로고침 시 "생성 결과를 확인할 수 없어요" 토스트로 안내됨(문구가 실제 원인과 다름). 별도 이슈 권장.

### F4 (P3, 기존 결함 — 이번 변경 범위 밖) 로그인 `next` 미소비
- `useCourseMapScreen.ts:97-101`은 401 시 `/login?next=<현재 경로>` 이동(이제 `/course/new/?step=course&rev=…`로 상태 미포함 — 개선). 그러나 `app/login/page.tsx`는 error·message·notice만 받고, `api/auth/kakao/callback/route.ts`도 next를 읽지 않음 → 로그인 후 원래 코스로 복귀하지 않는다(develop에도 존재). 복귀가 구현되면 같은 탭 sessionStorage로 복원 가능한 구조이므로 AC 문구 "로그인 왕복 → 복귀"는 이번 PR로 충족 불가, 별도 이슈로 분리 권장.

### F5 (P3, doc_mismatch) Meta fragment·중복 키 차단의 전 라우트 확대
- `shared/analytics/url.ts:66-72`는 `/course/new`뿐 아니라 모든 경로에서 hash·중복 키를 차단. SDD 문구("`/course/new[/]`에서 … fragment 차단")보다 넓다. 프라이버시상 보수적이라 동작 문제는 아니나 #125 계약 변경이므로 domain/ADR에 명시 필요. `analytics.test.ts`의 window.location fixture에서 `#private`를 제거한 이유도 이 변경 때문.

### F6 (P3, 정보) 기타
- `model/url-state.ts:1`이 `@/shared/analytics` 배럴(track·dispatch·config 포함)을 서버 데이터 경로에서 import. 빌드·번들 영향은 측정상 미미하나 `./query-keys` 직접 경로가 서버 그래프를 더 좁게 유지함.
- rev 생성 `course-flow.ts:192`의 `byte % 36`은 a–d 문자가 약간 더 자주 나오는 modulo bias가 있음(보안 식별자 용도가 아니므로 영향 미미).

## 구조 / VSA
- page.tsx: 서버 데이터 함수를 `@/features/situation/server/get-course-new-page-data` 직접 경로로 import, 클라이언트 feature 배럴 미import(재확인 완료). widget 배럴(`"use client"` SituationFlow)은 서버→클라이언트 컴포넌트 경계로 정상.
- 순수 모델(`model/course-flow.ts`) / 영속화(`lib/`) / React 연결(`hooks/`) / 화면 조합(`widgets/situation`) 분리 — client-logic-separation 준수.
- hydration: `useSyncExternalStore` server snapshot 상수 → restoring 셸, 최초 time 진입은 SSR 유지.
- zod: `zod/mini`의 기존 API(object·enum·optional·array·check)만 사용, record는 직접 순회(`course-flow.ts:83-101`) — 설명과 일치, 번들 증가 +3,253B로 확인.
- 파일 과밀: `useSituationFlowController.ts`(309줄)가 복원 분기·fallback·interrupted·잔여 횟수 토스트·단계별 핸들러를 모두 소유 — F1·F2가 모두 여기서 발생. fallback/interrupted 처리를 별도 훅으로 분리 권장.

## Failure Taxonomy
- implementation_bug: F1(P1), F2(P2), F3(P3, 기존)
- doc_mismatch: F5, ADR-26 미확인
- missing_evidence: e2e, 실브라우저 뒤/앞으로 가기, Lighthouse(LCP·CLS)
- test_failure: FAQ contact-form timeout 2건(기존 flake, 범위 밖)

## 미검증 항목
- e2e(course-new·course-loading-quiz·course-map-route-guide): 지시에 따라 미실행. 수정된 spec은 정상 흐름만 다루며 fallback·레거시 redirect·interrupted 경로를 다루지 않음.
- 실브라우저 back/forward, 새 탭(opener 복제) 복원, StrictMode 개발 모드 동작, Meta 실제 발행.
- LCP·CLS(rev 있는 진입의 빈 셸 → 복원 전환).
- ADR-26 원문 갱신 여부(repo 밖).

## 최종 결정
**rejected** — F1은 SDD가 확정한 "복원 실패 정책"(AC 5)을 실제로 깨뜨리고 클라이언트 예외로 이어지는 P1, F2는 #126 동작 회귀(AC 4). 나머지 계약(주소 최소화, 서버 생성 제거, operation 재연결, Meta allowlist, 경계, 번들)은 충족.

## 후속 작업
1. F1 수정 + 렌더 기반 fallback 단위 테스트(rev 없음·미지 rev·step 불일치) 추가, 가능하면 e2e에 "미지 rev 직접 진입 → time/purpose 정리" 시나리오 추가.
2. F2 수정 + 마지막 재추천 → result 토스트 회귀 테스트.
3. F5를 domain/ADR에 반영.
4. F3·F4는 별도 이슈.
5. 수정 후 lint·tsc·unit·build·budget 재실행, 사용자 e2e·Lighthouse 확인.

## 라운드 2 — 재검증 (2026-10-05)

### 범위
- 입력: Claude 수정 보고(P1·P2·P3 반영, url-state 배럴 유지·controller 분리 보류·로그인 `next` 별도 이슈 판단).
- 같은 working tree를 같은 규칙으로 재검토. 앱 코드·테스트 수정 없음, e2e·dev 서버 미실행, 커밋 없음.

### Evidence (검증자 직접 실행)
| 명령 | 결과 |
| --- | --- |
| `npm run lint` | 0 errors, 2 warnings(기존, 라운드 1과 동일) |
| `npx tsc --noEmit -p .` | 통과 |
| `npm run test:unit` | 646/648 pass, 실패 2건은 FAQ `contact-form.test.tsx` timeout(기존 flake, 범위 밖) |
| `npm run build` | 통과 |
| `node scripts/check-route-bundle-budget.mjs` | 통과, `/course/new` 674,977B / limit 681,403.86B (HEAD 직접 빌드 671,279B 대비 **+3,698B**, 라운드 1 대비 +445B) |
| 렌더 probe(scratchpad 복사본, react-dom + 실제 controller·storage) | 아래 표 |
| e2e | 검증자 미실행. Claude가 사용자 승인 하에 실행한 16/16 pass는 **보고 evidence**로만 기록 |

| probe | 라운드 1 | 라운드 2 |
| --- | --- | --- |
| P1 `step=result`, rev 없음 | replace 53회 + Maximum update depth | replace **1회**, 오류 없음, 스냅샷 1개 |
| P1 미지 rev `abcd1234` | replace 53회 + 오류 | replace **1회**, 오류 없음 |
| P2 마지막 재추천 → result | 토스트 0회 | "다른 코스 보기를 모두 사용했어요." **1회** |
| 생성 실패(StrictMode, initial) | — | 요청 1회, 실패 토스트 1회, purpose replace 1회, 저장 `failed` |
| 새 문서에서 `failed` 기록된 loading rev | — | 요청 0회, 실패 토스트 1회, replace 1회(재전송 없음) |
| 같은 문서에서 `done` loading rev 재방문(뒤/앞으로) | — | 요청 0회, `ready=true`, 토스트·replace 0회 |
| 기존 저장 상태(`pending`/`done`만) 파싱 | — | 그대로 파싱(enum 확장은 상위 호환) |

### 라운드 1 finding 처리 판정
| finding | 판정 | 근거 |
| --- | --- | --- |
| F1 (P1) fallback 무한 루프 | **해결** | `useCourseFlowSnapshot.ts:36,65,72` 모듈 상수 `EMPTY_ANSWERS`, `useSituationFlowController.ts:130-150` `fallback:${step}:${rev}` 가드. probe 재현 불가. e2e "unrecoverable or legacy course routes…"(`course-new.spec.ts:201`) 추가(Claude 실행 보고) |
| F2 (P2) #126 소진 토스트 회귀 | **해결** | `useSituationFlowController.ts:175-187` result 단계에서만 ref 갱신. probe에서 토스트 1회. e2e `course-new.spec.ts:155` |
| F3 (P3) 생성 실패 시 정지 | **해결** | `useCourseGeneration.ts:84-90` 실패 시 `failed` 기록, `:164-171` failed 기록이면 재전송 없이 error, controller `:152-173` 토스트 + purpose replace. unit `generation-events.test.ts:170` |
| F4 (P3) 로그인 `next` 미소비 | 이관 | 사용자가 별도 이슈·브랜치로 결정. 기존 결함이며 AC "로그인 왕복 → 복귀"는 이 PR에서 충족 불가로 기록 유지 |
| F5 (P3) Meta 차단 범위 확대 문서화 | **해결** | SDD `:65`, `docs/analytics-setup.md:15` |
| F6 url-state 배럴 import | 수용 | `@/shared/analytics` index는 React·window 없는 public API(#125 설계)이며 slice 배럴 규칙상 deep import보다 일관됨. 서버 그래프 영향 측정상 미미 |
| F6 rev modulo bias | **해결** | `course-flow.ts` 252 미만 바이트만 쓰는 rejection sampling |

### 회귀 점검 (요청 항목)
- `handledRedirectKey` 공유: fallback(`fallback:…`)과 operation(`operation:<id>`) 키 문자열이 겹치지 않아 서로 막지 않음. 같은 mount 안에서 store 갱신 재렌더가 반복돼도 1회만 실행(probe 확인). 키는 초기화되지 않으므로 **같은 mount에서 같은 복원 불가 주소를 다시 방문하면 redirect가 생략되고 restoring 셸에 머문다**. 다만 fallback은 `replace`라 해당 주소가 history에 남지 않고, 앱 내부 링크는 rev 없는 `/course/new`(=time, ready)뿐이라 현실적인 진입 경로를 찾지 못함 → P3 메모.
- done/failed operation의 loading rev 뒤/앞으로: done은 저장 응답 재사용(요청·이벤트 없음), failed는 재전송 없이 안내 후 purpose. 성공 후 `onViewCourse`가 `replace`라 일반 흐름에서 loading rev는 history에 남지 않음.
- `failed` 추가에 따른 기존 저장 상태: 상위 호환으로 파싱됨. 배포 전 전제라 하위 호환(구 코드가 `failed` 읽기)은 해당 없음.

### 남은 findings (모두 P3, 차단 아님)
1. `useSituationFlowController.ts:78,136-140` `handledRedirectKey`가 화면 ready 시에도 초기화되지 않음 — 위 이론상 edge. `restore.status === "ready"`일 때 초기화하면 제거 가능.
2. `course-flow.ts` `parseCourseFlowState`는 레코드 하나라도 검증에 실패하면 **전체 상태를 비움**(SDD 정책과 일치). `operations[].response`가 BE 응답 스키마 전체를 저장하므로 배포 사이 응답 계약이 바뀌면 같은 탭의 history rev 전체가 복원 실패(fallback) 처리됨. probe 작성 중 실제로 확인(잘못된 response 하나로 전체 초기화). 레코드 단위 폐기 또는 done 응답 최소화 검토 권장.
3. `useSituationFlowController.ts`(약 330줄) 책임 과밀 — 분리 보류 수용, 후속 리팩터 후보.
4. 로그인 `next` 복귀 — 별도 이슈.

### 미검증 항목 (라운드 1에서 유지)
- e2e(검증자 미실행, Claude 실행 보고만 있음), 실제 브라우저 뒤/앞으로·새 탭 복원, LCP·CLS 측정, ADR-26 원문(repo 밖).

### 라운드 2 결정
**approved_with_notes** — P1·P2 해결을 렌더 probe로 확인했고 P3도 반영됨. lint·tsc·unit(기존 flake 제외)·build·번들 예산 모두 통과. 남은 항목은 P3 메모와 미검증 evidence(e2e는 보고만, Lighthouse 미측정, ADR-26)뿐이다.
