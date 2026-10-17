import { AppShell } from "@/shared/ui/layout";
import { OnboardingCarousel } from "@/features/onboarding";

/**
 * 온보딩 화면 (widgets/onboarding, issue #230 · QA #25).
 * 시작 화면에서 "로그인 전 둘러보기"로 들어온다. 장 이동 · 종료는 feature 의 OnboardingCarousel 이 맡는다.
 */
export function OnboardingScreen() {
  return (
    <AppShell bleed className="overflow-hidden">
      <OnboardingCarousel />
    </AppShell>
  );
}
