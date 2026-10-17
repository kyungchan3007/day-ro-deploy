/**
 * 백엔드 quota.course.retry-limit 기본값(5)과 함께 유지해야 하는 재추천 한도.
 * 서버 설정 변경 시 이 값과 분석 이벤트 계약도 함께 갱신한다.
 */
export const COURSE_RETRY_LIMIT = 5;

/**
 * 재추천 잔여 횟수 소진 여부. 0 이하면 재추천 대신 안내만 한다(서버 retry 한도 정책과 동일 기준, issue #229).
 * 잔여 횟수를 아직 모르면(undefined) 소진으로 보지 않는다.
 */
export function isRetryExhausted(remaining: number | null | undefined): boolean {
  return remaining != null && remaining <= 0;
}
