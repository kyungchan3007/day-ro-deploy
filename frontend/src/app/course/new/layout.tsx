import type { ReactNode } from "react";

import { WebVitalsLogger } from "@/shared/observability";

/**
 * /course/new 레이아웃.
 *
 * 스텝(`?step=`) 전환은 같은 라우트 세그먼트에서 일어나므로 layout 은 유지된다.
 * 이 자리에 dev 전용 Web Vitals 로거를 마운트해, 스텝 플로우 전체에서
 * INP/CLS 를 끊김 없이 측정한다(페이지에 두면 스텝 전환마다 리마운트될 수 있음).
 */
export default function CourseNewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {process.env.NODE_ENV === "development" ? (
        <WebVitalsLogger route="course/new" />
      ) : null}
      {children}
    </>
  );
}
