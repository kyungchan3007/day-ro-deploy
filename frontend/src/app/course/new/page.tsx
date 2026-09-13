import { getCourseNewPageData } from "@/features/situation/server/get-course-new-page-data";
import { SituationFlow } from "@/widgets/situation";

/**
 * 코스 생성(상황입력) 진입 라우트.
 * URL query를 서버에서 읽어 step/입력값/후속 결과 데이터를 준비한 뒤 클라이언트 위젯에 전달한다.
 */
interface CourseNewPageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function CourseNewPage({
  searchParams,
}: CourseNewPageProps) {
  const pageData = await getCourseNewPageData(await searchParams);

  return <SituationFlow {...pageData} />;
}
