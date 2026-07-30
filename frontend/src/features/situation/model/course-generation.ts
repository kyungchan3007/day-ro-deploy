/**
 * 코스 생성(로딩) 전환 규칙 — 순수 로직.
 *
 * 로딩 화면은 "최소 노출 시간"과 "API 완료"를 모두 만족해야 결과로 넘어간다.
 * 타이밍/네트워크는 훅(useCourseGeneration)이 다루고, 전환 판단만 여기서 순수 함수로 계산한다.
 */

/** 로딩 화면 최소 노출 시간(ms). API 가 더 빨리 끝나도 이 시간은 반드시 보여준다. */
export const MIN_LOADING_MS = 1000;

/** situations 요청의 진행 상태. */
export type GenerationApiStatus = "pending" | "success" | "error";

/** 로딩 화면이 취해야 할 다음 단계. */
export type GenerationPhase = "pending" | "ready" | "error";

/**
 * 로딩 → 결과 전환 여부를 판단한다.
 *   - error   : API 실패(즉시 error, 최소 시간과 무관)
 *   - ready   : API 성공 AND 최소 노출 시간 경과
 *   - pending : 그 외(둘 중 하나라도 미완료)
 * @param apiStatus situations 요청 상태.
 * @param elapsedMs 로딩 시작 후 경과 시간(ms).
 * @param minMs 최소 노출 시간(ms). 기본 MIN_LOADING_MS.
 */
export function resolveGenerationPhase({
  apiStatus,
  elapsedMs,
  minMs = MIN_LOADING_MS,
}: {
  apiStatus: GenerationApiStatus;
  elapsedMs: number;
  minMs?: number;
}): GenerationPhase {
  if (apiStatus === "error") {
    return "error";
  }
  if (apiStatus === "success" && elapsedMs >= minMs) {
    return "ready";
  }
  return "pending";
}
