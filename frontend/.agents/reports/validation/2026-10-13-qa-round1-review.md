# QA 1차 대응 코드 리뷰 (역할분담 · VSA 경계 중심)

## Meta
- date: 2026-10-13
- reviewer: Claude 서브에이전트 3개 (Codex 사용량 한도로 호출 실패 → 사용자 지시로 대체)
- 취합 · P2 원본 대조: Claude
- 범위: `git diff 2ffafbf 313a927 -- frontend/src frontend/next.config.ts` (82파일, +3101/-222, PR#170~#188)
- 전달 방식: A (경로 지정, 리뷰어가 직접 읽음)
- 관점: ① 역할분담 · VSA 경계 ② 버그 · 엣지케이스 ③ 보안 · 접근성
- 규칙 문서: `frontend/AGENTS.MD` · `.agents/agents/architecture.md` · `.agents/agents/feature.md` · `.agents/guides/client-logic-separation.md` · `.agents/guides/server-client-boundary.md` · `.agents/guides/accessibility.md` · `.agents/guides/storybook.md` · `src/{app,widgets,features,shared}/README.md` · `src/shared/static/README.md`
- 코드 수정 없음 (리뷰 전용)

## 요약
- P1 즉시 수정: 0
- P2 수정 권장: 5 (역할분담 3 · 접근성 1 · 개인정보 1)
- P3 개선 제안: 24
- 핵심 경계(auth ↔ situation 상호 import 없음 · 공개 API 경유 · server-only 분리 · open redirect 차단)는 지켜짐

## P2 수정 권장 (Claude 원본 대조 완료)

### P2-1 역할분담 · `features/course-map/ui/SaveCourseSheet.tsx:47-52`
- 문제: 시트 닫힘 시 안내 문구 리셋용 `useEffect` 를 ui 컴포넌트에 추가 (#179)
- 근거: client-logic-separation.md "`ui` 컴포넌트 안에 `useEffect`를 두지 않는다" · 금지 예시에 `SaveCourseSheet.tsx` 명시 · "예외는 없다"
- 수정 방향: 닫기 경로(`useSaveCourseSheetDialog.handleClose` · 저장 성공 후 닫기)에서 `resetStatus` 호출, 또는 `useSaveCourseSheet({ open, onSubmit })` 가 훅 안에서 리셋

### P2-2 역할분담 · 중복 · `features/saved/ui/ShareOptionsSheet.tsx:35-45`
- 문제: 바깥 클릭 닫기 정책(`handleBackdropClick`) · `useModalDialog` 연결이 ui 파일에 있음, course-map 은 같은 패턴을 `hooks/useSaveCourseSheetDialog.ts` 로 이미 분리 (#183)
- 근거: client-logic-separation.md "ui 컴포넌트 안에 … 바깥 클릭 닫기 같은 오버레이 제어 로직을 두지 않는다"
- 수정 방향: `features/saved/hooks/useShareOptionsSheetDialog` 로 분리, 또는 두 슬라이스 공통 `shared/ui/lib/useSheetDialog` 승격 검토 (재사용 근거 충족)
- 함께: 시트 문구 "길안내 공유" · "링크 복사" · "다른 앱으로 공유" 를 `shared/static/saved` 로 이동

### P2-3 역할분담 · 중복 · `features/loading-quiz/ui/ChosungQuizCard.tsx:46` (+83, 90)
- 문제: 잠금 파생 규칙 `locked = solved || feedback === "revealed"` 를 ui 에서 계산, 같은 조건이 `hooks/useChosungQuiz.ts:105` onSubmit 가드에 중복 (#175)
- 근거: client-logic-separation.md "ui 컴포넌트 안에 `form state -> CTA state` 같은 파생 규칙을 두지 않는다", feature.md self-check "ui에 정책 함수가 남지 않았는가"
- 수정 방향: model 순수 함수(`isQuizLocked`) 또는 훅이 `locked` 를 계산해 내려주고, 카드는 `disabled={locked}` 바인딩만, 훅 가드도 같은 함수 사용

### P2-4 접근성 · `ChosungQuizCard.tsx:83` / `useChosungQuiz.ts:149`
- 문제: 3번째 오답 Enter 제출 시 포커스된 input 이 `disabled` → 포커스가 body 로 빠지고, 2초 뒤 다음 문제에서도 복귀하지 않음 (공개 상태엔 포커스 대상 없음)
- 근거: accessibility.md "상태 전환 후 포커스 손실이 없도록 주의한다"
- 수정 방향: 문제 전환 시 input 으로 포커스 복귀(정책은 훅, ui 는 ref 바인딩), 또는 공개 중 `readOnly` + `aria-disabled` 로 포커스 유지
- 확인 범위: 코드 경로 확인 + 브라우저 재현 완료 (아래 V1)

### P2-5 개인정보 · `features/saved/server/get-saved-course-detail-page-data.ts:30`
- 문제: `normalizeSharerName(user?.nickname ?? user?.name)` → 닉네임이 없으면 `name`(카카오 동의 항목, 실명 가능성)을 공개 공유 URL `n` 쿼리 · og description 에 노출 (#187)
- 수정 방향: `nickname` 만 사용, 없으면 null → 고정 문구 "데이로 코스 일정을 확인해 보세요!" (실명 fallback 이 필요하면 기획 확인)
- 확인 범위: 코드 동작 확인, `name` 이 실명인지는 추정 (타입 주석은 "카카오 동의 범위")

## P3 개선 제안

### 역할분담 · VSA
- `features/situation/lib/course-flow-handoff.ts:27-71` (+ `index.ts:78`) — lib 가 `window.localStorage` 직접 접근 · lib 함수 외부 공개, features/README "lib = 내부 순수 유틸" 과 domain 문서(`course-situation.md:141` 저장소 = lib) 불일치 → 문서 정리
- `widgets/situation/hooks/useSituationFlowController.ts:112-120` — 로그인 전 인계 규칙이 widget 컨트롤러 `toastState` 안에 섞임, `useCourseMapScreen.ts:105-107` 에 중복 → situation 이 `useCourseFlowLoginHandoff(rev)` 공개
- `features/course-map/hooks/useCourseMapScreen.ts:13-17` — course-map → situation 런타임 의존 신규 (공개 API 경유라 위반 아님) → 허용 여부 문서화 또는 widget 콜백 주입
- `features/course-map/lib/resume-course-save.ts` · `lib/pending-course-save.ts` — lib → api import · 토스트 orchestration · 문구 보유 → hooks 계층(`useResumePendingCourseSave`) 이동, 문구는 static/model
- `features/saved/hooks/useSavedCourseDetailScreen.ts` (185줄) — 순서 변경 · 공유 · 클립보드 · 수정완료가 한 훅 → `useCourseShareActions` 분리, 이벤트 핸들러 안 `typeof window` 검사(71줄) 불필요
- `widgets/saved/SharedCourseRedirectScreen.tsx:14-15, 28-47` — Button primary lg 클래스 수동 복제, 문구 삼항 3곳 → Button 링크 렌더 수단 또는 `buttonClassName` 공개, 문구는 한 번 선택
- `features/loading-quiz/ui/ChosungQuizCard.tsx:108-114` — 정답 공개 문구 하드코딩 (기존 퀴즈 문구 관례) → `shared/static/loading-quiz` 일괄 이동 후속
- `features/loading-quiz/index.ts:10-14` — `CHOSUNG_QUIZ_*` · `shouldRevealAnswer` 외부 사용처 0 → 배럴 export 제거
- `widgets/situation/SituationLoadingScreen.tsx:12-24` — `UseChosungQuizResult` 수동 복제, `revealedAnswer` 필수/선택 불일치 → 공개 타입 재사용

### 버그 · 엣지케이스
- `situation/lib/course-flow-storage.ts:33-51` + `course-flow-handoff.ts:44-71` — 인계 기록을 rev 무관하게 첫 읽기 문서가 소비 → 다른 탭이 먼저 열면 로그인 복귀 탭 복원 실패 (흐름 확인 · 재현 추정) → 기대 rev 일치 시에만 소비
- ~~`situation/hooks/useRegionStep.ts:115-118` — 검색어 변경 시 선택 유지~~ → 브라우저 확인 결과 실제 타이핑에서는 재현되지 않아 철회 (V3 참고)
- `auth/hooks/useAccountMenu.ts:45-51` — 항상 `preventDefault` → Cmd/Ctrl 클릭 새 탭 열기가 같은 탭 이동으로 바뀜
- `auth/hooks/useAccountMenu.ts:57-60` — 로그아웃 성공 전 인계 저장 → 실패해도 30분 잔류, 공용 기기 다음 사용자에게 입력값 인계 가능 (민감도 낮음)
- `course-map/hooks/useCourseMapScreen.ts:78-84, 103-108` — 대기 저장을 요청 전 삭제 → 로그인 취소 후 복귀 시 코스명 유실 · bfcache 복귀 시 30분 내 자동 저장 가능 (bfcache 추정)
- `saved/hooks/useSavedCourseDetailScreen.ts:121-130` — 시스템 공유 실패 후 클립보드 대체가 Safari 계열 user activation 소비로 실패 가능 (추정, 토스트는 표시)
- `loading-quiz/hooks/useChosungQuiz.ts:108-115` — 빈 입력 · 같은 오답 연타도 오답 횟수 차감 → 빈 칸 3회로 정답 공개 (정책 확인 필요)

### 보안 · 접근성 · 기타
- `saved/server/get-course-share-page-data.ts:40-55` — `APP_ORIGIN` 미설정 시 Host 헤더로 og 절대 주소, 이상 Host 면 `new URL` TypeError → 운영 `APP_ORIGIN` 필수화 또는 try/catch, `getConfiguredAppOrigin` 을 `shared/config/app-origin` 으로 이동 검토
- `saved/model/course-share-link.ts:50-65` — 서명 없는 `n` 으로 임의 이름 미리보기 생성 가능 (XSS 없음, 현 범위 허용)
- `shared/config/html-limited-bots.ts:1` — `next/dist/...` 비공개 경로 import → Next 업그레이드 시 깨질 수 있음 (단위 테스트로 감지)
- `shared/ui/layout/NavBar.tsx:45-51` — 홈에서 자기 자신 링크에 `aria-current="page"` 없음
- `shared/ui/menu/MenuItem.tsx` — 공용 API 변경(onClick event · href+onClick) 후 story 미갱신 (storybook.md)
- `auth/ui/AccountMenu.tsx:10-17` · `widgets/situation/SituationFlow.tsx:128,153,177` — import 사이 인터페이스 · 들여쓰기 불일치
- import 표기 혼재 (`@/` 별칭 · `../../../` 상대경로) — server 파일 · course-map lib
- 테스트 공백 — `useChosungQuiz` 훅 단위(가짜 타이머) · `useRegionStep` 훅 단위 · `ShareOptionsSheet` · `SharedCourseRedirectScreen` 렌더 단위 (e2e 의존)

## 문제 없음 확인 영역
- auth ↔ situation 상호 import 없음, widget(`SituationFlow`) 이 `onBeforeLogin` 콜백으로 조합
- widget 은 feature 공개 API 만 사용, 내부 파일 우회 import 없음
- `features/saved/index.ts` 는 client-safe export 만, 서버 코드는 `server/index.ts`(server-only) 로만 공개
- app 라우트(`share/course` · `saved/[id]`) 는 server 함수 + widget 조합만
- open redirect: 로그인 `next` 는 `sanitizeLoginNextPath` 로 검증, 공유 페이지는 외부 URL 을 받지 않고 좌표 · 이름으로 네이버 주소 직접 조립(host 고정)
- 쿼리 값은 Metadata · JSX 텍스트로만 들어가 자동 이스케이프, 공유 페이지 noindex
- 저장소 방어: 손상 · 버전 불일치 · TTL · 미래 시각 · 저장소 차단 처리, 단위 테스트 존재
- Strict Mode: `useShareRedirect` 1회 가드, 대기 저장 동기 삭제로 중복 저장 없음, 퀴즈 타이머 cleanup 정상
- model 순수성: `menu-login` · `region-selection` · `course-flow` · `course-share-link` · `attempt-policy` React/DOM 비의존
- ContactForm 안내: 문구 static 분리, `role="note"` 적절
- 로고 링크 접근성 이름 중복 없음 (`aria-label` + `alt=""`)

## 브라우저 재현 결과 (2026-10-13 · 사용자 지시)
- 환경: develop `0203834` 별도 worktree, Playwright Chromium 1280×800, e2e 포트 3120 · 목 백엔드 18091 (저장소 밖 임시 설정 · 시나리오)
- V1 퀴즈 오답 3회째 포커스 (P2-4) → **재현됨**
  - 오답 1 · 2회: 포커스 input 유지
  - 오답 3회(Enter): input disabled → `document.activeElement = body`
  - 2초 뒤 다음 문제: input 다시 활성, 포커스는 body 그대로 (+1초 후에도 body)
  - 이때 키 입력 대상 = BODY (input 값 비어 있음), Tab 1회 → 페이지 앞쪽 버튼으로 이동
- V2 빈칸 제출 3회 → **재현됨**: 빈 입력 Enter 3회만으로 "정답은 ‘…’이에요" 공개
- V3 지역 검색어 변경 → **철회 (재현 방법 오류)**
  - 재현 때 `fill()` 로 검색어를 한 번에 통째로 교체 → 빈 값을 거치지 않는 비현실적 입력
  - 실제 타이핑은 지우는 도중 빈 값이 되어 선택이 해제되고 다음 버튼 비활성 (사용자 화면 · 2026-10-12 스모크 테스트와 일치)
  - #168 수정은 정상 동작, P2 상향 제안 철회
- V4 메뉴 로그인 Cmd 클릭 → **재현됨**: 새 탭이 열리지 않고 현재 탭이 `/login` 으로 이동
- V5 다른 탭의 인계 소비 → **재현됨**
  - 메뉴 로그인 직후 localStorage 인계 기록 있음
  - 다른 탭에서 `/course/new` 를 열자 인계 기록 삭제
  - 로그인 복귀를 새 탭으로 열면 `step=time`(1단계)로 이동 · 지역 입력 유실
- 참고: V5 시나리오는 확인 로그 기록 후 마지막 대기에서 시간 초과로 실패 처리 (확인 값에는 영향 없음)

## 로컬 서버 재확인 (사용자 FE 3000 · BE 8080, develop · 내장 브라우저 실제 클릭 · 키 입력)
- V1 포커스: 오답 1 · 2회 Enter 후 `activeElement = INPUT`, 3회째 공개 직후 `BODY`, 2초 뒤 다음 문제에서도 `BODY` (상호작용 없이 DOM 값으로 판정) → 재확인됨
  - 참고: 내장 브라우저 `type` 동작은 입력 전에 대상 요소를 선택해 키 입력 대상 판정에는 쓰지 않음
- V2 빈칸 제출: 빈 입력칸에서 실제 Enter 3회 → "정답은 '어벤져스'이에요" 공개 → 재확인됨
- 후속 이슈: Dayro-dev/dayro#192 (구조 정리 + 퀴즈 포커스, 정책 항목은 범위 밖)

## 후속 판단 필요 (사용자 · Codex owner)
- P2 5건 수정 진행 여부 (P2-3 · P2-5 는 정책 · 비즈니스 경계 포함)
- 빈 입력 오답 차감 · 검색어 변경 시 선택 유지 · 이름 fallback 은 기획 확인
- Codex 한도 해제 후 교차 검증 여부
