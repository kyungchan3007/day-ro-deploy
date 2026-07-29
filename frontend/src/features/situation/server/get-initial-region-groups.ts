import { buildRegionGroupsFromResponse } from "../model/region-groups";
import { fetchBackendRegions } from "../../../shared/api/server-situation-client";

export async function getInitialRegionGroups() {
  const regions = await fetchBackendRegions({
    cache: "force-cache",
  });

  return buildRegionGroupsFromResponse(regions.data);
}
