/**
 * onboarding feature public API (issue #230, QA #25).
 * 시작 화면(비회원 첫 진입) · 온보딩 조각. 서버 진입 판단은 `@/features/onboarding/server`.
 */
export { StartHero } from "./ui/StartHero";
export { GuestBrowseLink } from "./ui/GuestBrowseLink";
export { OnboardingCarousel } from "./ui/OnboardingCarousel";
export { GUEST_BROWSE_COOKIE_NAME, resolveRootEntry } from "./model/root-entry";
export type { RootEntry } from "./model/root-entry";
