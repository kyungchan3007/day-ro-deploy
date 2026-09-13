import type {
  CourseCandidateResponse,
  RegionPopularKeywordsResponse,
  RegionsResponse,
  SituationInputRequest,
} from "./openapi/dayro.openapi";
import {
  fetchSituationBackendPopularKeywords,
  fetchSituationBackendRegions,
  retrySituationBackendRequest,
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
 * 지역 step 초기 화면에서 보여줄 인기 검색어를 서버에서 읽는다.
 * 기준 데이터 성격이라 기본 캐시는 지역 목록과 같은 `force-cache` 를 사용한다.
 */
export function getSituationPopularKeywords(
  options?: BackendSituationRequestOptions,
): Promise<RegionPopularKeywordsResponse> {
  return fetchSituationBackendPopularKeywords({
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

/**
 * 결과 화면의 다른 코스 보기 요청을 서버에서 전송하는 공통 진입점.
 * 최초 추천 응답에서 받은 requestId 를 backend retry transport 로 전달한다.
 */
export function retrySituation(
  requestId: string,
): Promise<CourseCandidateResponse> {
  return retrySituationBackendRequest(requestId);
}
