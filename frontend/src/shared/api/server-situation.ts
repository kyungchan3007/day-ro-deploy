import type {
  CourseCandidateResponse,
  RegionsResponse,
  SituationInputRequest,
} from "./openapi/dayro.openapi";
import {
  fetchSituationBackendRegions,
  submitSituationBackendRequest,
  type BackendSituationRequestOptions,
} from "./server-situation-backend-client";

/**
 * 초기 화면과 BFF 가 함께 쓰는 지역 목록 서버 계약 함수.
 * 선택적 캐시 옵션을 받아 backend transport 로 전달하고,
 * 옵션이 없으면 SSR 기준 데이터 특성에 맞춰 `force-cache` 를 기본값으로 사용한다.
 */
export function getSituationRegions(
  options?: BackendSituationRequestOptions,
): Promise<RegionsResponse> {
  return fetchSituationBackendRegions({
    cache: options?.cache ?? "force-cache",
    next: options?.next,
  });
}

/**
 * 상황 입력 완료 후 추천 요청을 서버에서 전송하는 공통 진입점.
 * UI/BFF 에서 만든 `SituationInputRequest` 를 backend transport 로 넘기고
 * 검증된 `CourseCandidateResponse` 계약을 그대로 반환한다.
 */
export function submitSituation(
  request: SituationInputRequest,
): Promise<CourseCandidateResponse> {
  return submitSituationBackendRequest(request);
}
