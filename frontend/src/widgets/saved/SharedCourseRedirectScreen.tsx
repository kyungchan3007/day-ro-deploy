"use client";

import Link from "next/link";

import { AppShell, Illustration, NavBar } from "@/shared/ui";
import { savedStatic } from "@/shared/static/saved";
import { useShareRedirect } from "@/features/saved";

export interface SharedCourseRedirectScreenProps {
  /** 서버가 좌표로 조립한 네이버 길찾기 주소. 공유 링크가 올바르지 않으면 null. */
  naverUrl: string | null;
}

const actionClass =
  "mt-2 inline-flex h-13 w-full max-w-xs items-center justify-center rounded-pill bg-primary px-5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-weak active:bg-primary-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

/**
 * 공유 코스 이동 화면 (widgets/saved, issue #187).
 * 카카오톡 등에서 공유 링크를 연 사람을 네이버 길찾기로 보내고,
 * 자동 이동이 막히면 직접 여는 버튼을, 링크가 올바르지 않으면 홈 안내를 보여준다.
 */
export function SharedCourseRedirectScreen({ naverUrl }: SharedCourseRedirectScreenProps) {
  useShareRedirect(naverUrl);
  const copy = savedStatic.shareRedirect;

  return (
    <AppShell nav={<NavBar showBack={false} />}>
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <Illustration name="date-planning" width={140} />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[15px] font-semibold text-text-strong">
            {naverUrl ? copy.movingTitle : copy.invalidTitle}
          </h1>
          <p className="text-[13px] leading-relaxed text-text-muted">
            {naverUrl ? copy.movingDesc : copy.invalidDesc}
          </p>
        </div>
        {naverUrl ? (
          <a href={naverUrl} rel="noopener noreferrer" className={actionClass}>
            {copy.openLabel}
          </a>
        ) : (
          <Link href="/" className={actionClass}>
            {copy.homeLabel}
          </Link>
        )}
      </div>
    </AppShell>
  );
}
