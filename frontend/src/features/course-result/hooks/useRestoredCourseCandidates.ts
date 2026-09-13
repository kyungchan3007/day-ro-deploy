"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";
import { readLastGeneratedCourseCandidates } from "../lib/generated-course-storage";

interface CandidateSnapshot {
  places: PlaceCandidate[];
  requestId?: string;
  remainingRetries?: number;
}

interface RestoreOptions {
  active: boolean;
  candidates: PlaceCandidate[];
  requestId?: string;
  remainingRetries?: number;
}

// This bridge is read on route input changes, not a live storage subscription.
const subscribe = () => () => {};

/** A route-scoped external store; cache snapshots independently of React renders. */
function createCandidateStore({ active, candidates, requestId, remainingRetries }: RestoreOptions) {
  const fallback: CandidateSnapshot = { places: candidates, requestId, remainingRetries };
  let snapshot: CandidateSnapshot | undefined;
  return {
    getServerSnapshot: () => fallback,
    getSnapshot: () => {
      if (snapshot) return snapshot;
      const stored = active ? readLastGeneratedCourseCandidates()?.data : null;
      snapshot = stored && stored.requestId === requestId ? stored : fallback;
      return snapshot;
    },
  };
}

/** Restore a matching generated response after hydration; server props stay authoritative otherwise. */
export function useRestoredCourseCandidates({
  active, candidates, requestId, remainingRetries,
}: RestoreOptions): CandidateSnapshot {
  const store = useMemo(
    () => createCandidateStore({ active, candidates, requestId, remainingRetries }),
    [active, candidates, requestId, remainingRetries],
  );
  return useSyncExternalStore(subscribe, store.getSnapshot, store.getServerSnapshot);
}
