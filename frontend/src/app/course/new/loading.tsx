import { SituationLoadingScreen } from "@/widgets/situation";

/**
 * `/course/new` 서버 데이터 준비 중에 보여줄 route-level 로딩 화면.
 * result/course 단계에서 서버가 URL 상태를 해석해 데이터를 준비하는 동안 같은 경험을 유지한다.
 */
export default function Loading() {
  return <SituationLoadingScreen />;
}
