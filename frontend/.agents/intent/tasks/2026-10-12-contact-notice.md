# 문의하기 화면 상단 안내 문구

## Task Meta
- task_id: 2026-10-12-contact-notice
- date: 2026-10-12
- owner: Claude(UI 구현, 사용자 지시)
- status: done
- task_type: UI 수정 (QA 시트 #7)
- linked_prd: - (소규모 UI 문구, issue Dayro-dev/dayro#177)
- linked_sdd: - (구조 변경 없음)
- branch: `fix/#177-contact-notice`

## 근거
- QA #7 TO-BE · 첨부 기획안 슬라이드 16 이미지
  - 폼 상단 연보라 배경 둥근 박스 · 1줄 보라 굵게 · 2줄 회색

## 결정
- 문구는 `shared/static/faq` `contact.notice` (title · body)
- `ContactForm` 스크롤 본문 맨 위에 안내 박스 (`role="note"`) → 폼과 함께 스크롤
- 스타일은 기존 토큰만 사용: 배경 `--color-primary-200` · 1줄 `--color-primary` 700 · 2줄 `--color-text-muted` · 13px · radius 12px
- 새 색 · 새 컴포넌트 만들지 않음 (디자인 결정 없음)

## Acceptance Criteria
- must: 문의하기 진입 시 안내 박스 2줄 노출 · 제목 입력보다 위
- must: 기존 입력 · 검증 · 완료 모달 흐름 유지

## Evidence Result
- tsc 통과 · lint 0 errors · 전체 unit 829건 통과
- e2e (사용자 지시 2026-10-12): `faq-contact.spec.ts` 1건 추가 + 회귀 5건 → 6/6 통과
  - 안내 문구 2줄 · 제목 입력보다 위
  - 회귀: 문의 흐름(입력 · 완료 모달) · FAQ 검색 4건
  - 수정 전 코드에서 안내 문구 시나리오 실패 확인
  - 로컬 3000 모바일(375px) 화면 확인 · 녹화 영상 → 노션 QA #7
  - 환경: 별도 worktree, e2e 포트 3120 · 목 백엔드 18091
