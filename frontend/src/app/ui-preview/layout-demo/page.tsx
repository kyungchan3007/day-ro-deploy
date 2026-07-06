"use client";

import { AppShell, NavBar, Button } from "@/shared/ui";

/**
 * AppShell 표준 골격 데모.
 * 375(모바일) / 768(태블릿) / 1200(데스크탑) 뷰포트에서
 * 컬럼이 640에서 멈추고 좌우가 미색 여백으로 채워지는지 확인한다.
 */
export default function LayoutDemoPage() {
  return (
    <AppShell
      nav={<NavBar showBack />}
      footer={
        <div className="border-t border-border p-4">
          <Button variant="primary" fullWidth>
            표준 하단 CTA
          </Button>
        </div>
      }
    >
      <h1 className="text-xl font-extrabold text-text-strong">app-shell 데모</h1>
      <p className="mt-2 text-sm text-text-muted">
        모바일에선 화면을 꽉 채우고, 640px를 넘으면 이 흰색 컬럼이 가운데에서
        멈춥니다. 좌우 미색 영역이 프레임 여백입니다.
      </p>

      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface-subtle p-4 text-sm text-text-secondary"
          >
            콘텐츠 블록 {i + 1}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
