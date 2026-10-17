"use client";

import Link from "next/link";

import { AppShell, EmptyState, NavBar, buttonClassName } from "@/shared/ui";
import { savedStatic } from "@/shared/static/saved";
import { useShareRedirect } from "@/features/saved";

export interface SharedCourseRedirectScreenProps {
  /** 서버가 좌표로 조립한 네이버 길찾기 주소. 공유 링크가 올바르지 않으면 null. */
  naverUrl: string | null;
}

/** 링크를 공용 primary · lg 버튼 모양으로 그린다(토큰은 Button 과 공유). */
const actionClass = buttonClassName({
  variant: "primary",
  size: "lg",
  fullWidth: true,
  className: "mt-2 max-w-xs",
});

/**
 * 공유 코스 이동 화면 (widgets/saved, issue #187).
 * 카카오톡 등에서 공유 링크를 연 사람을 네이버 길찾기로 보내고,
 * 자동 이동이 막히면 직접 여는 버튼을, 링크가 올바르지 않으면 홈 안내를 보여준다.
 */
export function SharedCourseRedirectScreen({ naverUrl }: SharedCourseRedirectScreenProps) {
  useShareRedirect(naverUrl);
  const copy = savedStatic.shareRedirect;
  const message = naverUrl
    ? { title: copy.movingTitle, desc: copy.movingDesc }
    : { title: copy.invalidTitle, desc: copy.invalidDesc };

  return (
    <AppShell nav={<NavBar showBack={false} />}>
      <EmptyState
        titleAs="h1"
        title={message.title}
        description={message.desc}
        action={
          naverUrl ? (
            <a href={naverUrl} rel="noopener noreferrer" className={actionClass}>
              {copy.openLabel}
            </a>
          ) : (
            <Link href="/" className={actionClass}>
              {copy.homeLabel}
            </Link>
          )
        }
      />
    </AppShell>
  );
}
