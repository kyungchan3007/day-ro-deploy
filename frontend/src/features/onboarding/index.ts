/**
 * onboarding feature public API (issue #230, QA #25).
 * 시작 화면(비회원 첫 진입) · 온보딩 조각. 서버 진입 판단은 `@/features/onboarding/server`.
 * 진입 판단 model(root-entry)은 슬라이스 안(server · ui)에서만 써서 공개하지 않는다(issue #229).
 */
export { StartHero } from "./ui/StartHero";
export { GuestBrowseLink } from "./ui/GuestBrowseLink";
export { OnboardingCarousel } from "./ui/OnboardingCarousel";
