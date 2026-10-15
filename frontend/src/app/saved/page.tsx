import { getSavedPageData, requireSavedAuth } from "@/features/saved/server";
import { SavedListScreen } from "@/widgets/saved";

/**
 * 찜한 코스 목록 진입 라우트.
 * 초기 목록이 바로 필요하므로 서버에서 저장 코스 목록을 준비해 widget 으로 전달한다.
 */
export default async function SavedPage() {
  await requireSavedAuth("/saved");
  const pageData = await getSavedPageData();

  return <SavedListScreen {...pageData} />;
}
