# 코스 생성 로딩 화면 모바일 맞춤 · 아이폰 입력칸 자동 확대 방지

## Task Meta
- task_id: 2026-10-14-loading-mobile-fit
- date: 2026-10-14
- owner: Claude(UI 수정, 사용자 지시)
- status: review
- task_type: 버그 수정 (사용자 아이폰 확인)
- linked_prd: - (소규모 UI 수정, issue Dayro-dev/dayro#214 범위 추가)
- linked_sdd: - (레이어 경계 변경 없음)
- branch: `fix/#214-loading-mobile-fit` (홈 수정 PR#215 와 별도 브랜치, 같은 이슈)

## 문제
- 아이폰에서 로딩 화면이 확대된 느낌 · 해상도에 안 맞는 느낌 (입력칸 누른 뒤 · 들어가자마자 둘 다)

## 원인
- 아이폰 사파리: 글자 16px 미만 입력칸 포커스 시 화면 자동 확대, 입력 후에도 확대 유지
  - 초성퀴즈 입력 14px
  - 바로 전 단계 동네 검색 15px → 확대가 로딩 화면까지 이어짐 (들어가자마자 확대돼 보인 이유)
  - 그 밖에 FAQ 검색 14px · 문의 폼 14/12px · 탈퇴 사유 13px 등
- 로딩 화면 위 여백 0 · 일러스트 둥둥 애니메이션이 화면 위로 8px 잘림 · 내용이 화면보다 김
  - 수정 전: iPhone 13 664 → 745px · Galaxy S9+ 658 → 773px · Pixel 5 727 → 745px

## 결정 (예시 확인 후 확정)
- 아이폰 · 아이패드 전용 전역 규칙 (`globals.css`, `@supports (-webkit-touch-callout: none)`)
  - input · textarea · select 글자 최소 16px → 앱 전체 입력칸 자동 확대 방지
  - 다른 기기 입력칸 디자인은 그대로
- 초성퀴즈 입력 `text-sm` → `text-base` (예시대로 모든 기기 16px)
- `LoadingScreen`: 위 여백 `safe-area + 1.5rem` · 아래 `safe-area + 1.25rem` · 간격 28 → 16
- `SituationLoadingScreen`: 일러스트 160 → 120 · 내용 간격 20 → 14
- `ChosungQuizCard`: 카드 안쪽 위아래 24 → 18 · 간격 12 → 10
- 문구 · 버튼 크기 · 색 변경 없음

## Evidence Result (기기 에뮬레이션, 임시 스크립트 · 포트 3120)
- 수정 후 내용 높이
  - iPhone 13 696px (화면 664, 건너뛰기 버튼만 일부 아래)
  - iPhone SE 740px (화면 568)
  - Galaxy S9+ 724px (화면 658)
  - Pixel 5 727px (화면 727, 딱 맞음)
- 일러스트 위 여백 16px 이상 (둥둥 애니메이션 포함) · 잘림 없음
- 아이폰 자동 확대는 에뮬레이터 재현 불가 → 실기기 확인 필요
- unit 926 passed · tsc · eslint 오류 0
- `next build` 성공 · `/course/new` 629797B / 예산 681403B

## 후속: 반응형 (사용자 요청 — 웹은 원래 크기, 모바일만 축소)
- 기준: 폭 640 미만 = 모바일 (앱 컬럼 최대 폭 · Tailwind `sm` 기준)
- 일러스트: 160 기준으로 받고 모바일만 CSS 로 120 (`.illustration`, max-width 639.98px)
  - 같은 파일을 줄여 보여줌 → 화질 · 추가 요청 · 레이아웃 밀림 없음, 우선 로딩 유지
- 간격 · 여백: 모바일만 촘촘하게, 웹(`sm:`)은 원래 값
  - `LoadingScreen` 간격 16 / 웹 28
  - 내용 간격 14 / 웹 20
  - 퀴즈 카드 안쪽 18 · 간격 10 / 웹 24 · 12
- 위아래 여백(안전 영역)과 입력칸 16px 은 모든 기기 유지
- 확인 (임시 스크립트)
  - iPhone 13: 일러스트 120 · 내용 696 / 화면 664 (변화 없음)
  - Galaxy S9+: 일러스트 120 · 724 / 658
  - 웹 1280×800: 일러스트 160 · 800 / 800 (한 화면)
- unit 926 passed · tsc · eslint 오류 0
