# QA 1차 대응 코드 역할분담 · VSA 경계 정리 PRD

## Meta
- prd_id: 2026-10-13-qa-role-separation
- date: 2026-10-13
- owner: Claude(구현, 사용자 지시)
- status: approved
- issue: Dayro-dev/dayro#192

## 문제
- QA 1차 대응(PR#170~#188) 리뷰 결과 규칙 위반 P2 · 구조 정리 P3 발견
  - ui 컴포넌트 안 `useEffect` · 오버레이 제어 · 파생 규칙 (client-logic-separation.md 위반)
  - 같은 규칙의 중복 구현 (잠금 조건 · 로그인 전 인계 · 시트 제어)
- 사용자 영향: 퀴즈 정답 공개 후 입력칸 포커스가 사라져 키보드 사용자가 다시 찾아 들어가야 함
- 리뷰 리포트: `.agents/reports/validation/2026-10-13-qa-round1-review.md`

## 목표
- ui 는 마크업 · 바인딩만, 상태 · 이펙트 · 오버레이 제어는 훅, 순수 규칙은 model
- 중복 규칙 단일화
- 퀴즈 문제 전환 시 입력칸 포커스 복귀

## 비목표
- 정책 변경: 빈 입력 오답 차감 · 공유 닉네임 fallback · 메뉴 로그인 새 탭 · 다른 탭 인계 소비 (기획 확인 후 별도)
- 화면 디자인 변경

## 성공 기준
- 기존 e2e 회귀 없음, 화면 동작 동일
- 퀴즈 정답 공개 → 다음 문제에서 입력칸 포커스 (단위 · e2e)
- lint / tsc / unit / build / 번들 예산 통과
