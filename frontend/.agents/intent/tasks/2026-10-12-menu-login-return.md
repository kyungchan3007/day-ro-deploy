# 상황입력 중 메뉴 로그인 후 입력하던 단계로 복귀

## Task Meta
- task_id: 2026-10-12-menu-login-return
- date: 2026-10-12
- owner: Claude(구현, 사용자 지시)
- status: done
- task_type: 버그 수정 (QA 시트 #21, 스모크 테스트 중 발견)
- linked_prd: - (소규모 수정, issue Dayro-dev/dayro#181)
- linked_sdd: - (구조 변경 없음 · #169 코스 흐름 인계 재사용)
- branch: `fix/#181-menu-login-return`

## 문제
- 비로그인 상황입력 중 햄버거 메뉴 "로그인" → 로그인 후 홈으로 이동
- 원인: `AccountMenu` 로그인 링크가 `/login` (next 없음) → 콜백 기본값 `/`

## 결정
- `features/auth`
  - `model/menu-login.ts` `buildMenuLoginPath(pathname, search)`: 현재 경로 · 쿼리를 next 로, 홈 · 로그인 화면은 next 없음
  - `useAccountMenu.goLogin`: `onBeforeLogin` 호출 → 메뉴 닫기 → 클릭 시점 주소로 로그인 이동 (정적 화면 `useSearchParams` Suspense 회피)
  - `AccountMenu` · `AccountNavBar` 에 `onBeforeLogin` 옵션 prop
- `widgets/situation` · `course-result` · `course-map`
  - 흐름 컨트롤러 `handleBeforeLogin`: 현재 rev 스냅샷을 `stashCourseFlowHandoff` 로 인계 (새 탭 복귀 대비, #169 재사용)
  - 시간 · 지역 · 목적 · 결과 · 코스 화면이 `AccountNavBar` 에 연결
- 경계: auth 는 콜백만 받고 situation 을 직접 import 하지 않음 (widgets 가 조합)
- 범위 밖: 현재 단계에서 "다음"을 누르기 전 입력값(스냅샷 이전 상태)은 복원 대상 아님

## Acceptance Criteria
- must: 상황입력 단계에서 메뉴 로그인 → 로그인 후 같은 단계(step · rev) 복귀
- must: 새 탭 복귀에도 단계 · 이전 단계 입력값 복원
- must: 정적 화면(FAQ 등)도 같은 화면으로 복귀 · 홈은 next 없음

## Evidence Result
- tsc 통과 · lint 0 errors · unit 834건 (신규 `menu-login.test.ts` 5건)
- e2e (사용자 지시 2026-10-12): `auth/menu-login-return.spec.ts` 3건 + 회귀 19건 → 22/22 통과
  - 2단계 메뉴 로그인 → 콜백이 같은 단계 주소로 복귀 · 새 탭 복귀 단계 · 입력값 복원 · FAQ next
  - 회귀: auth(login-next · auth-profile) · course-new · course-save-login-return · home · faq · saved
  - 수정 전 코드에서 신규 3건 모두 실패 확인
  - 1차 구현에서 메뉴 로그인을 button 으로 바꿔 `auth-profile.spec.ts`(로그인 link · href 확인) 실패 → link 유지 + 클릭 시 preventDefault 후 next 이동으로 수정 (`MenuItem` 이 링크에도 onClick 전달)
  - 카카오 우회 헬퍼 `support/kakao-login.ts` 공용화
  - 녹화: 테스트 서버 콜백이 localhost 로 돌아가 다른 origin 취급 → 콜백 위치를 같은 origin 에서 열어 확인 (운영은 같은 도메인) · 영상 4개 → 노션 QA #21

## 추가 수정: 로그아웃 후 다시 로그인 (사용자 스모크 피드백 2026-10-12)
- 재현: 상황입력 중 로그인 → 같은 단계 복귀 → 로그아웃 → 다시 로그인 → 홈
- 원인: `useLogout` 이 `/login?notice=logged_out` 로만 이동 (next 없음)
- 수정
  - `model/menu-login.ts` `resolveLoginReturnPath` 분리 (메뉴 로그인 · 로그아웃 공용)
  - `buildLoginNoticeSearchParams` 에 `next` (sanitize 후) 추가
  - `useLogout.logout(nextPath)` · `useAccountMenu` 로그아웃 확정 시 `onBeforeLogin` → 현재 경로 next
- unit 신규 5건 (`menu-login.test.ts`) · 전체 839건 통과
- e2e: `menu-login-return.spec.ts` 로그아웃 2건 추가 · auth · saved · course-new · home 포함 15/15 통과 · 로그아웃 수정 전 코드에서 신규 2건 실패 확인
- 녹화 영상 3개 → 노션 QA #21
