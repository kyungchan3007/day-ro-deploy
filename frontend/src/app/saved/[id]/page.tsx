import {
  getSavedCourseDetailPageData,
  requireSavedAuth,
} from "@/features/saved/server";
import { SavedCourseDetailScreen } from "@/widgets/saved";

interface SavedCourseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 저장 코스 상세 진입 라우트.
 * 초기 상세 데이터가 바로 필요하므로 서버에서 코스 상세를 준비해 widget 으로 전달한다.
 */
export default async function SavedCourseDetailPage({
  params,
}: SavedCourseDetailPageProps) {
  const { id } = await params;
  await requireSavedAuth(`/saved/${id}`);
  const pageData = await getSavedCourseDetailPageData(id);

  return <SavedCourseDetailScreen {...pageData} />;
}
