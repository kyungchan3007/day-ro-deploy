# 코스 생성 로딩 "코스 보러 가기" CTA 완료 신호 (반짝임 · 팝 · 진동)

## Task Meta
- task_id: 2026-10-13-loading-cta-motion
- date: 2026-10-13
- owner: Claude(UI 구현, 사용자 지시)
- status: review
- task_type: UX 개선 (QA #22 후속)
- linked_prd: - (소규모 UI 수정, issue Dayro-dev/dayro#203)
- linked_sdd: - (레이어 경계 변경 없음, features/situation model · hook 추가 · widgets 조합)
- branch: `style/#203-loading-cta-motion`
- 선행: PR#204 (안내 문구 A안) 머지 eb59885

## 문제
- 완료 시 CTA 가 흐린 색 → 진한 색으로만 바뀌어, 퀴즈 중인 사용자가 완료를 놓치기 쉬움
- 생성 중 CTA 는 단순 비활성이라 "막힌 버튼"처럼 보임

## 결정 (사용자 확정, 데모 확인 후)
- 생성 중: 흐린 CTA 위로 옅은 빛줄기 (2.4초 주기, 이동 약 1.4초 + 쉼)
- 진행률을 모르므로 채워지는 진행 바는 쓰지 않음
- 완료 순간: opacity · 배경색 0.3초 전환 + 팝 1회 (scale 1 → 1.04 → 1, 360ms)
- 완료 순간: 지원 기기 진동 40ms 1회
  - 다른 탭을 보고 있으면 건너뜀
  - 미지원(iOS Safari 등)이면 조용히 건너뜀
  - 예외가 나도 화면 흐름 유지
- 처음부터 완료 상태로 열린 화면: 팝 · 진동 없음
- `prefers-reduced-motion: reduce`: 반짝임 · 팝 없음, 색 전환만

## 파일 배치
- 판단 로직 `features/situation/model/ready-cue.ts`
  - `isReadyTransition`
  - `playReadyHaptic`
  - `READY_HAPTIC_MS`
- 훅 `features/situation/hooks/useCourseReadyCue.ts` (public index 노출)
  - 진동 부수효과
  - `pending` · `pop` 반환
- 스타일 `widgets/situation/css/SituationLoadingScreen.module.css`
  - `.cta`
  - `.ctaPending::after`
  - `.ctaPop`
  - reduced-motion
- 조합 `widgets/situation/SituationLoadingScreen.tsx`
  - UI 파일 안 useEffect 없음 (client-logic-separation)

## Acceptance Criteria
- must: 생성 중 CTA 반짝임
- must: 완료 전환 시 팝 1회 · 색 전환
- must: 완료 전환 시 지원 기기에서 짧은 진동 1회
- must: 동작 줄이기 사용자는 색 전환만
- must: 레이아웃 밀림 없음 (transform 만 사용)

## Evidence Result
- unit `features/situation/test/ready-cue.test.ts` 5 passed
  - 전환 판단
  - 진동 1회 · 40ms
  - 숨은 탭
  - 미지원 기기
  - 예외
- unit 전체 911 passed · tsc 통과 · eslint 신규 오류 0 (기존 `useWheelColumn.ts` 경고 1건 무관)
- `next build` 성공 · `/course/new` 627250B / 예산 681403B
- 빌드 CSS 확인: 모듈 `.cta` 는 레이어 밖, Tailwind utilities 는 `@layer utilities` → `transition-colors` 보다 모듈 transition 이 우선
- 실기기 확인 필요 (사용자 스모크 테스트)
  - 안드로이드 크롬 진동
  - 카카오톡 인앱 브라우저 진동
- e2e: 지시 시 실행
