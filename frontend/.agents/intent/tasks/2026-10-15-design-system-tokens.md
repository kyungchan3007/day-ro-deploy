# 디자인 시스템 토큰 정리 · 공용 승격 · 스토리북 최신화

## Task Meta
- task_id: 2026-10-15-design-system-tokens
- date: 2026-10-15
- owner: Claude(디자인 시스템, 사용자 위임 — 이슈 · PR · 머지까지)
- status: review
- task_type: 리팩터링 (디자인 시스템)
- linked_prd: prd/2026-10-15-design-system-tokens.md
- linked_sdd: sdd/2026-10-15-design-system-tokens.md
- branch: `refactor/#227-design-system-tokens`

## 진행
- [x] 감사: 임의 글자 크기 · 색 · 그림자 · radius · z-index · 모션 사용처 수집
- [x] 승격 후보 조사 (Explore) → 같은 마크업 3건 승격, 모양이 달라지는 후보는 후속 제안
- [x] 토큰 추가 · 52개 파일 교체
- [x] BottomSheet · EmptyState · NavTitle 승격 · 사용처 교체 · 빈 css module 삭제
- [x] 토큰 우회 검사 · 토큰 목록 동기화 테스트
- [x] 스토리북 Foundations 4 · 신규 컴포넌트 스토리 · 기존 스토리 API 반영
- [x] 시각 회귀 비교 (스토리북 · 앱)
- [x] Codex 검증 게이트 3라운드 → approve (`reports/validation/2026-10-15-design-system-tokens.md`)
  - F1 시트 기본 포커스(첫 활성 요소 · 없으면 시트) · 밖에 남은 포커스 Tab 회수 · 빈 시트 잠금
  - F2 가드 강화(z 30+ · 방향별 radius · 인라인 숫자 · css 여러 값 hex/white) · 예외 규칙 단위로 축소
  - F3 문자열 인식 주석 제거 lexer · href 앵커 제외
  - F4 공개 API(루트 · 폴더 배럴) 문서화

## Evidence Result
- 스토리북: 기존 스토리 89개 수정 전후 스크린샷 픽셀 동일 (SaveCourseSheet 포함), 신규 스토리 25개
- 앱(390×844, 모의 백엔드 운영 빌드): 24장 중 22장 동일
  - `/faq` 질문 14.5 → 15px (단계 맞춤)
  - `/saved` 내비 제목 0.5px (공용 NavTitle 행간 통일)
- 토큰 우회 검사: src 전체 위반 0

## Checks
- unit 881 · storybook vitest 114 · tsc · eslint 오류 0
- `next build` 성공 · 번들 예산 통과
- e2e 전체 79 passed (모의 백엔드 운영 빌드)
