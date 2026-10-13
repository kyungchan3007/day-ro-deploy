import { redirect } from "next/navigation";

import { getCourseNewPageData } from "@/features/situation/server/get-course-new-page-data";
import { SituationFlow } from "@/widgets/situation";

/**
 * 코스 생성(상황입력) 진입 라우트.
 * 주소의 step·rev 를 서버에서 정규화하고, 조건·후보는 클라이언트 흐름 상태에서 복원한다(issue #129).
 * 레거시 상태 쿼리 등 계약 밖 주소는 생성·분석 없이 첫 단계로 정리한다.
 */
interface CourseNewPageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function CourseNewPage({
  searchParams,
}: CourseNewPageProps) {
  const result = await getCourseNewPageData(await searchParams);

  if (result.kind === "redirect") {
    redirect(result.url);
  }

  return <SituationFlow {...result.data} />;
}
