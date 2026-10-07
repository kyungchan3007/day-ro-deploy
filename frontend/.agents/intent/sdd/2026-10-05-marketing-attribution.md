# 마케팅 유입 추적(UTM·GA4·Meta Pixel) SDD

## Meta
- sdd_id: 2026-10-05-marketing-attribution
- date: 2026-10-05
- owner: Claude(coordinator·초안 A) / Codex(architecture gate)
- status: approved(design) — 토론 2라운드 종합 + 사용자 결정 반영(2026-10-05), 구현 대기
- supersedes: -
- superseded_by: -

## Scope Path
- affected routes: 전역(`src/app/layout.tsx`), `/api/auth/kakao/callback`, `/`, `/course/new`, `/course/*`, `/saved/*`, `/privacy`
- affected slices: 신규 `shared/analytics`, `features/auth`, `features/situation`, `features/course-map`, `features/saved`, `widgets/situation`(#126 소진 분기), `shared/static/legal`
- related guides: `server-client-boundary.md`, `client-logic-separation.md`, `bff.md`(콜백 쿠키), `performance.md`(전역 layout·서드파티 스크립트), `accessibility.md`(해당 없음 예상)
- related domains: `login.md`, `course-situation.md`, `course-map.md`, `saved.md`, `common.md`

## Design Decisions (확정 — 토론 합의 + 사용자 결정)
근거: `reports/handoffs/2026-10-05-marketing-attribution-debate.md`

### 모듈 경계
- `src/shared/analytics/`: 측정 계약(이벤트명·허용 파라미터·벤더 매핑) · 벤더 전송 · 첫 유입 저장만 소유. `shared/observability`(dev Web Vitals)와 분리.
  - 성공 판정·도메인 값 → 분석 파라미터 변환은 shared에 두지 않는다(feature 소유, 필요 시 `features/*/model` 순수 함수).
- `features/auth`: `AuthEventTracker`(1회성 쿠키 소비 → `sign_up`/`login`) 소유. root `layout.tsx`가 조합.
- root `layout.tsx`는 Server Component 유지. 작은 client leaf(스크립트 로더·page view tracker·AuthEventTracker)만 추가. root에서 `cookies()` 읽지 않음.

### 활성화
- 조건: `process.env.NODE_ENV === "production"` AND `NEXT_PUBLIC_ANALYTICS_ENABLED === "true"` AND 벤더별 ID 존재(`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`). 벤더별 독립 gate.
- gate 검사는 전역 객체(`window.dataLayer`/`gtag`/`fbq`) 생성 **전에** 수행. 비활성 시 스크립트·전역 객체·네트워크 요청 없음.
- `.env.example`(또는 README)에 세 변수 문서화 → ID 발급 후 값만 채우면 동작.

### 전송
- 벤더 공식 stub 사용(커스텀 큐 없음). `ensureInitialized()`가 `gtag('js')`·`gtag('config', id, { send_page_view: false })`·`fbq('init', id)`를 이벤트보다 먼저 1회 enqueue. 지연 로드된 script 주입기는 큐를 재설정하지 않음(아래 라운드 3 로딩 전략 적용).
- 공개 `trackEvent(name, params): void`는 절대 throw하지 않음. 내부적으로 벤더별 enqueue 결과를 반환하는 비투척 함수로 분리(한 벤더 실패가 다른 벤더에 영향 없음).
- 이벤트 생성 시점 URL을 GA `page_location`에 첨부(지연 로드 시 마지막 URL로 몰림 방지). Meta 자동 URL은 정제 불가(아래 `/login` 정책으로 대응).
- Meta: `autoConfig` false, 자동 고급 매칭 미사용, 초기 기본 `PageView` 제거.

### 로딩 전략 (라운드 3 — 사용자 요청으로 변경)
root client leaf의 정적 의존성은 pathname 구독, 활성 gate와 작은 작업 예약 계층으로 제한한다. 활성 gate를 통과한 경우에만 track·attribution·URL 정제·이벤트 계약·공식 stub·인증 쿠키 소비 모듈을 동적 import하며, 비활성 시 import 자체가 없다. 모든 작업은 같은 promise 체인에서 호출 순서대로 실행하고 URL·referrer·pathname·타임스탬프를 예약 시 동기 캡처한다. 공개 trackEvent의 void/비투척 계약은 유지하며 GA에는 정제된 발생 URL과 사용자 정의 event_timestamp_ms를 전달한다(벤더 수집 시각을 소급 변경한다고 보장하지 않는다). next/script는 first-load 비용 때문에 제거하고, 공식 stub/config/init enqueue 후 외부 `<script async src>`를 벤더별 한 번만 주입한다. 주입·로드·import 실패는 격리한다. Meta는 발생 URL과 실제 제출 URL 중 어느 하나라도 `isMetaBlockedUrl`(/login 또는 허용 목록 밖 쿼리)에 해당하면 초기화·제출·SDK 주입을 생략하고, stub에 `disablePushState = true`를 설정한다(라운드 4, 아래 URL 정제 참조). auth 소비는 feature 소유를 유지하고 같은 체인 안에서 실제 enqueue 결과를 확인한 후 소비 기록·쿠키 삭제를 수행한다. 페이지뷰 중복 판단은 지연 runtime에서 수행해 A→B→A 예약 순서를 보존한다. 이전 afterInteractive/next/script 지정은 이 단락으로 대체한다.

### 페이지뷰
- pathname 기준 단일 tracker가 GA `page_view`·Meta `PageView`를 소유. 최초 진입 1회 + pathname 변경 시 1회. 같은 pathname 연속 effect는 억제, A→B→A 재방문은 집계.
- `?step=` 등 쿼리 전환은 페이지뷰 아님(`useSearchParams` 불필요).
- GA 관리자 "브라우저 기록 이벤트 기반 페이지 변경" 해제는 사용자 런칭 체크리스트(코드로 불가).

### URL 정제
- `page_location`/`page_referrer`에서 허용 쿼리만 유지: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`. 나머지(`message`·`error`·`next`·`code`·`state` 등) 제거.
- **Meta 발행 차단(`isMetaBlockedUrl`)**: `/login` 경로이거나 허용 목록 밖 쿼리가 붙은 주소에서는 Meta 초기화·이벤트·PageView·SDK 주입을 하지 않는다. GA는 정제된 주소로 계속 제출.
  - 근거: Meta Pixel은 요청마다 `location.href` 전체를 자동 수집(`dl`)하며 코드로 정제할 수 없다. `/course/new` result·course 단계 주소에 `requestId`·`candidatePlaces`·`selectedPlaces`(장소명 포함 JSON)가 실려 must-not AC 위반(독립 검증 라운드 3 P1).
  - 결정: 사용자 "현업 정석" — 1단계로 민감 쿼리 화면 Pixel 차단(이 SDD), 2단계로 코스 상태를 URL 밖으로 옮기는 근본 해결은 별도 이슈(후속).
  - 영향: Meta에는 코스 생성·재추천·소진·저장 이벤트가 전송되지 않음(쿼리 화면). `sign_up`(콜백 후 `/`)·`course_shared`(`/saved/[id]`)·일반 PageView는 전송.
- Meta stub에 `disablePushState = true`(SDK 로드 전) — SDK의 history 기반 자동 PageView 차단(쿼리 전환·클라이언트 이동 중복 방지).
- GA `config`에는 `send_page_view: false`만 둔다. `page_location`·`page_referrer`·`event_timestamp_ms`는 이벤트마다 첨부(config 고정 시 이후 자동 이벤트에 첫 진입 값이 남음).

### 첫 유입(first-touch) UTM
- UTM 키가 하나 이상 유효할 때만, 저장된 값이 없거나 만료됐을 때 저장(직접 방문은 덮어쓰지 않음 = "최초 UTM 방문").
- localStorage, 최초 저장 시각 기준 고정 90일(방문 시 연장 없음). 저장 실패·손상·만료 처리.
- 값 검증: 소문자화 후 `^[a-z0-9_\-.]{1,100}$` 전체 일치, 불일치 키는 폐기(잘라서 수용 금지). `fbclid`/`gclid`는 저장하지 않고 벤더 기본 처리.
- OAuth 이동 전에 캡처(첫 진입 시점). `first_utm_*`는 **GA 전환 이벤트에만** 첨부.

### 이벤트 카탈로그
| 이벤트 | 시점(owner) | 파라미터 | Meta 매핑 |
|---|---|---|---|
| `sign_up` | 카카오 콜백 후 `isNewUser=true` (features/auth) | `method: "kakao"` + first_utm(GA) | `CompleteRegistration` |
| `login` | 콜백 후 `isNewUser=false` (features/auth) | `method: "kakao"` + first_utm(GA) | custom `Login` |
| `course_generated` | 추천 세션 최초 성공 — 성공 응답 `requestId`당 1회, 새로고침 억제는 sessionStorage (features/situation) | 목적·교통수단·시간 길이 등 범주형만 | custom `CourseGenerated` |
| `course_regenerated` | 재추천 성공마다 (최대 5회) (features/situation) | `retry_index`, `remaining_retries` | custom `CourseRegenerated` |
| `course_retry_limit_reached` | 소진 상태 클릭(#126 `handleReroll` 소진 분기) | `retry_limit: 5` | custom `CourseRetryLimitReached` |
| `course_saved` | `useCourseMapScreen`의 `requestCourseSave` 성공 직후 (features/course-map) | 장소 수 | custom `CourseSaved` |
| `course_shared` | 공유 API 완료(`navigator.share` 또는 clipboard) — 취소·실패 제외 (features/saved) | `method: "share_sheet" \| "clipboard"` | custom `CourseShared` |
- `requestId`, user id, 닉네임, 이메일, 토큰, 장소명, 자유 입력은 어떤 이벤트에도 포함하지 않음.
- 복원(`useRestoredCourseCandidates`)·캐시 응답 재사용은 이벤트 없음.

### sign_up/login 신호
- `/api/auth/kakao/callback` 성공 시 1회성 쿠키 `dayro_auth_event` = `{type: sign_up|login, eventId}` 설정.
  - `HttpOnly=false`, `Secure`(production), `SameSite=Lax`, `Path=/`, `Domain` 생략, `Max-Age=300`. 토큰 값 미포함, 인증 판단에 사용 금지. 기존 토큰 쿠키 속성 변경 없음.
- 소비 순서: 쿠키 검증 → sessionStorage로 같은 탭 `eventId` 재소비 확인 → 활성 벤더 stub에 enqueue → 소비 기록 → 같은 Path로 쿠키 삭제.
- 보장 범위: "정상 단일 탭에서 활성 벤더별 클라이언트 제출 1회". 다중 탭 경쟁·enqueue 후 이탈·광고 차단 누락은 범위 밖.

### 기타
- SSR/BFF/client boundary: 신규 BFF endpoint 없음. 브라우저 → GA/Meta 직접. 콜백 Route Handler는 쿠키 1개 추가만.
- 개인정보처리방침(`shared/static/legal`): GA4·Meta Pixel 사용 목적·수집 항목(쿠키·기기·유입 정보)·보관·거부 방법(브라우저 설정·광고 차단·옵트아웃 링크) 고지.
- UTM 링크 작성 규칙표: `frontend/docs/` 또는 `.agents` 밖 사람용 문서로 제공(값 체계 고정, PII 금지 규칙 포함).
- orchestration owner: Claude(coordinator·스크립트 마운트 리뷰·방침 문구·UTM 규칙표) / Codex(analytics·attribution·이벤트 연결·auth 쿠키·단위 테스트·검증).

## Data / Contract Notes
- request path: 브라우저 → `googletagmanager.com/gtag/js`, `google-analytics.com/g/collect`, `connect.facebook.net/.../fbevents.js`, `facebook.com/tr`
- response path: 해당 없음(fire-and-forget)
- model/view-model decision: 이벤트 파라미터 스키마는 `events.ts` 타입으로 고정. 코스 생성 이벤트는 목적·교통수단 등 범주형 값만 첨부(자유 입력 텍스트 금지).

## Risks
- 서드파티 스크립트로 TBT·INP 악화 → 로딩 전략 비교(afterInteractive vs lazyOnload) 측정.
- root layout에 client 컴포넌트 추가 → 전 라우트 first-load JS 증가 → `route-bundle-baseline.json` 갱신 필요 여부.
- 3단계 보안 작업에서 CSP 도입 시 GA/Meta 도메인 허용 필요(inline 스크립트 nonce/hash).
- 광고 차단기 사용자 미집계(수용).
- Cloudflare(OpenNext) 환경에서 `NEXT_PUBLIC_*` 빌드 타임 주입 확인 필요.

## Validation Notes
- what must be reviewed: shared 경계(도메인 로직 누출 여부), server/client import 오염, UI 파일 로직 혼입, PII 미전송, 비활성 환경 no-op, 콜백 쿠키 보안 속성.
- expected evidence: 단위 테스트(track/attribution/auth-event), `npm run lint`, `npm run build` + 번들 예산 검사, GA DebugView·Meta 테스트 이벤트 수동 확인(사용자), Lighthouse 전 지표 비교.
