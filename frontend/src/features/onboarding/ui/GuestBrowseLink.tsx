import Link from "next/link";

import { onboardingStatic } from "@/shared/static/onboarding";
import { cn } from "@/shared/ui";

/** "로그인 전 둘러보기": 시작 화면 → 온보딩 (issue #230). 흰 바탕 보조 버튼 모양. */
export function GuestBrowseLink({ className }: { className?: string }) {
  const { browseLabel, browseHref } = onboardingStatic.start;
  return (
    <Link
      href={browseHref}
      className={cn(
        "flex h-13 w-full items-center justify-center rounded-card bg-surface text-body font-medium text-text-tertiary",
        "transition-[transform,background-color] duration-(--duration-press) active:scale-[0.98] active:bg-surface-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      {browseLabel}
    </Link>
  );
}
