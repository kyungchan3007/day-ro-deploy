# 둘러보기 쿠키 유효기간 · 로그아웃 삭제

## Task Meta
- task_id: 2026-10-16-guest-browse-cookie
- date: 2026-10-16
- owner: Claude
- status: review
- task_type: 버그 수정 · 정책 반영
- issue: Dayro-dev/dayro#244
- branch: `fix/#244-guest-browse-cookie`

## 할 일
- [x] model: `GUEST_BROWSE_MAX_AGE_SECONDS` · 쿠키 문자열 Max-Age
- [x] server: `expireGuestBrowseCookie` + 배럴 공개
- [x] 로그아웃 route 에서 호출
- [x] unit 테스트 갱신 · 추가
- [x] e2e: 쿠키 유효기간 · 로그아웃 후 시작 화면
- [x] tsc · lint · unit · build · 번들 예산 · e2e
- [x] Codex 검증 gate
- [x] e2e 영상 3개 · 노션

## 2차 (사이트 닫으면 다시 온보딩 · 로그아웃 → 시작 화면)
- [x] 탭 표시(sessionStorage) · visit guard 스크립트 · 루트 레이아웃 head
- [x] 로그아웃 성공 → `/`
- [x] unit · e2e 갱신 (전체 e2e 88 통과)
- [x] 번들 예산 초과 → guard 를 server 배럴로 분리해 해결
- [x] Codex 2차 → changes requested (새 탭이 기존 탭 쿠키 삭제 · 탭 복원) → 3차로 반영

## 3차 (30분 미사용 = 새 방문 · 기존 탭 홈 유지)
- [x] `model/guest-visit` 판단 함수 하나 (인라인 · tracker 공용)
- [x] `GuestVisitTracker` · `visit.ts` 진입점 · 로그아웃 표시 삭제
- [x] unit 1065 · e2e 90 (2회 연속) · start 모드 e2e 21 · build · 예산
- [x] Codex 3차 → changes requested (공유 쿠키 3건) → 4차로 구조 변경

## 4차 (서버 쿠키 제거 · 탭별 판단 · CSS 로 화면 선택)
- [x] 비회원 `/` 두 화면 + `<html data-guest-visit>` CSS
- [x] guard · tracker 속성만 갱신, 쿠키 · BFF 변경 제거
- [x] unit 1052 · e2e 90 (2회 연속) · start 모드 21 · 하이드레이션 경고 없음 · build · 예산
- [x] Codex 4차 → changes requested (숨은 홈 메뉴 포털 Tab · 열린 메뉴 · hook 분리) → 반영
- [x] SideMenu inert · 종료 이벤트 · 숨은 홈 그림 지연 로드 · useGuestVisitTracker
- [x] unit 1054 · e2e 92 (2회) · start 모드 23 · build · 예산 (Tab 테스트는 inert 없이 실패하는 것 확인)
- [x] Codex 5차 approve
- [x] 영상 5개 · 노션 (최종 동작 기준)

## #181 로그아웃 복귀 복원 (사용자 지적 2026-10-17)
- [x] 로그아웃 → `/?next=<직전 화면>` · 시작 화면 카카오 로그인이 next 이어받음
- [x] `onBeforeLogin` · `resolveLoginReturnPath` 되살림, `buildStartScreenPath` + 단위 테스트
- [x] #181 e2e 2건 복원(도착 화면만 시작 화면으로)
- [x] unit 1056 · e2e 93 (2회) · start 모드 24 · build · 예산
- [x] Codex 6차 approve
- [x] 영상 · 노션
