import type { Metadata } from "next";

import {
  buildCourseShareMetadata,
  getCourseSharePageData,
  type CourseShareSearchParams,
} from "@/features/saved/server";
import { SharedCourseRedirectScreen } from "@/widgets/saved";

interface CourseSharePageProps {
  searchParams: Promise<CourseShareSearchParams>;
}

/**
 * 코스 공유 링크 진입 라우트 (공개, issue #187).
 * 미리보기 메타는 데이로 카드("데이로-코스 일정")로 채우고, 연 사람은 네이버 길찾기로 보낸다.
 */
export async function generateMetadata({
  searchParams,
}: CourseSharePageProps): Promise<Metadata> {
  return buildCourseShareMetadata(await searchParams);
}

export default async function CourseSharePage({ searchParams }: CourseSharePageProps) {
  const pageData = getCourseSharePageData(await searchParams);

  return <SharedCourseRedirectScreen {...pageData} />;
}
