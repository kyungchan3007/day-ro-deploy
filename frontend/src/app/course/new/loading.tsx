import { SituationLoadingScreen } from "@/widgets/situation";

/**
 * `/course/new` 서버 데이터 준비 중에 보여줄 route-level 로딩 화면.
 * 서버는 step·rev 정규화와 지역 기준정보만 준비한다(issue #129). 코스 생성은 loading 단계에서 클라이언트가 수행한다.
 */
export default function Loading() {
  return <SituationLoadingScreen />;
}
