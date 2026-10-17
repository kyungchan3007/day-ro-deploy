/**
 * onboarding feature 루트 레이아웃 전용 공개 API (issue #244).
 * 비회원 "이번 방문" 판단: 첫 로드 guard(`<head>` 인라인 스크립트) + 화면 이동 · 탭 복귀 tracker.
 * 클라이언트 컴포넌트가 섞인 기본 배럴(`index.ts`) 대신 따로 둬 모든 라우트 번들에 온보딩 UI 가 끌려오지 않게 한다
 * (`features/auth/analytics` 와 같은 방식).
 */
export { GuestVisitGuard } from "./ui/GuestVisitGuard";
export { GuestVisitTracker } from "./ui/GuestVisitTracker";
