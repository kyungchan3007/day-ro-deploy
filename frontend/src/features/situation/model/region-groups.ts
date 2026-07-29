import type { RegionGroup } from "./types";
import type { RegionResponseItem } from "../../../shared/api/openapi/dayro.openapi";

export function buildRegionGroupsFromResponse(
  items: readonly RegionResponseItem[],
): RegionGroup[] {
  return items
    .map((item) => ({
      id: item.category,
      label: item.category,
      areas: item.regions
        .filter((region) => region.districtIds.length > 0)
        .map((region) => ({
          id: region.districtIds[0],
          label: region.name,
        })),
    }))
    .filter((group) => group.areas.length > 0);
}
