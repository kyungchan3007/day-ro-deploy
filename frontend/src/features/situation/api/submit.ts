import {
  BFF_ENDPOINTS,
  buildSituationRetryEndpoint,
} from "../../../shared/api/endpoints";
import {
  courseCandidateResponseSchema,
  type CourseCandidateResponse,
  type SituationInputRequest,
} from "../../../shared/api/openapi/dayro.openapi";

export async function requestCourseCandidates(
  request: SituationInputRequest,
): Promise<CourseCandidateResponse> {
  const response = await fetch(BFF_ENDPOINTS.situations, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("course_candidates_failed");
  }

  return courseCandidateResponseSchema.parse(await response.json());
}

export async function requestRetriedCourseCandidates(
  requestId: string,
): Promise<CourseCandidateResponse> {
  const response = await fetch(buildSituationRetryEndpoint(requestId), {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("course_candidates_retry_failed");
  }

  return courseCandidateResponseSchema.parse(await response.json());
}
