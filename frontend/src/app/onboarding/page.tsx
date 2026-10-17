import type { Metadata } from "next";

import { OnboardingScreen } from "@/widgets/onboarding";

export const metadata: Metadata = {
  title: "둘러보기 · Dayro",
};

/** 온보딩 (issue #230 · QA #25). 시작 화면의 "로그인 전 둘러보기"에서 들어온다. */
export default function OnboardingPage() {
  return <OnboardingScreen />;
}
