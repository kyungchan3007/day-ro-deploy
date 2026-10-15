# 헤더 데이로 로고 클릭 시 홈 이동

## Task Meta
- task_id: 2026-10-12-header-logo-home
- date: 2026-10-12
- owner: Claude(UI 구현, 사용자 지시)
- status: done
- task_type: UI 버그 수정 (QA 시트 #14)
- linked_prd: - (소규모 UI 수정, issue Dayro-dev/dayro#173)
- linked_sdd: - (구조 변경 없음, shared/ui/layout 내부)
- branch: `fix/#173-header-logo-home`

## 문제
- 메인 · 상황입력 · 코스 만들기 · 코스 생성 화면 헤더 로고 클릭 → 동작 없음
- 원인: `NavBar` 기본 가운데 영역이 로고 이미지만 렌더, 링크 없음

## 결정
- `NavBar` 기본 로고를 `Link href="/"` 로 감쌈
  - 접근성 이름 `데이로 홈으로` (로고 이미지는 장식 처리 `alt=""` → 중복 낭독 방지)
  - 포커스 링 · 눌림 표시는 기존 링크 스타일(`focus-visible:ring-primary/40`, `active:opacity-60`)과 동일
- `center` 를 직접 넘기는 화면(FAQ · 약관 · 찜한 코스 · 내 정보 · 탈퇴 · 문의) 제목은 변경 없음
- 홈 푸터 로고 · 로그인 화면 로고는 범위 밖 (헤더 아님)

## Acceptance Criteria
- must: 상황입력 · 코스 화면 헤더 로고 클릭 → `/` 이동
- must: 홈 헤더 로고도 링크(같은 화면)
- must: 제목을 넘기는 화면 헤더는 그대로

## Evidence Result
- tsc 통과 · lint 0 errors · 전체 unit 823건 통과 (로고 대체 텍스트 의존 테스트 없음)
- e2e (사용자 지시 2026-10-12): `layout/header-logo-home.spec.ts` 4건 + 회귀 10건 → 14/14 통과
  - 홈 로고 링크 · 상황입력 → 홈 · 코스 화면 → 홈 · 제목 화면 유지
  - 회귀: home · course-new · faq-search · saved
  - 수정 전 NavBar 에서 로고 이동 3건 실패 확인 (제목 화면 유지 1건은 기존 동작이라 통과)
  - 녹화 영상 4개 → 노션 QA #14
  - 환경: 별도 worktree, e2e 포트 3120 · 목 백엔드 18091
