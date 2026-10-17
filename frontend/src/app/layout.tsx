import { AnalyticsTracker } from "@/shared/analytics/client";
import { AuthEventTracker } from "@/features/auth/analytics";
import { GuestVisitGuard, GuestVisitTracker } from "@/features/onboarding/visit";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dayro",
  description: "우리에게 맞는 데이트 코스를 한 번에",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // <head> guard 가 그리기 전에 data-guest-visit 을 건다(issue #244) — 서버 HTML 과 다른 속성은 의도된 것
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        {/* 이번 탭 둘러보기 중인지 그리기 전에 판단 — 비회원 `/` 의 홈 · 시작 화면 선택 (issue #244) */}
        <GuestVisitGuard />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <AnalyticsTracker />
          <AuthEventTracker />
        </Suspense>
        <GuestVisitTracker />
        {children}
      </body>
    </html>
  );
}
