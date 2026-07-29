import { Suspense } from "react";

import { getInitialRegionGroups } from "@/features/situation/server/get-initial-region-groups";
import { SituationFlow } from "@/widgets/situation";

/**
 * 코스 생성(상황입력) 진입 라우트.
 * 스텝은 `?step=` 쿼리스트링으로 전환된다(useSearchParams → Suspense 필요).
 */
export default async function CourseNewPage() {
  const initialRegionGroups = await getInitialRegionGroups();

  return (
    <Suspense>
      <SituationFlow initialRegionGroups={initialRegionGroups} />
    </Suspense>
  );
}
