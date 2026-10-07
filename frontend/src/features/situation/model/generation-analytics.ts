import { trackEvent } from "@/shared/analytics";
import type { CourseCandidateResponse } from "@/shared/api/openapi/dayro.openapi";
import { COURSE_RETRY_LIMIT } from "./retry-policy";
import { to24Minutes } from "./time";
import type { SituationAnswers } from "./types";

const submitted = new Set<string>();

/**
 * 신규 성공 응답만 계측하고 최초 생성은 requestId별 중복을 억제한다.
 * @param response 추천 API 성공 응답. 복원·캐시 소비 경로에서는 호출하지 않는다.
 * @param answers 목적·교통·시간 범주로 변환할 입력값.
 * @param retry 재추천 성공 여부.
 * @returns 없음. 분석 오류는 성공 처리에 전파하지 않는다.
 */
export function trackGenerationSuccess(
  response: CourseCandidateResponse,
  answers: SituationAnswers,
  retry: boolean,
): void {
  try {
    if (retry) {
      trackEvent("course_regenerated", {
        retry_index: COURSE_RETRY_LIMIT - response.data.remainingRetries,
        remaining_retries: response.data.remainingRetries
      });
      return;
    }
    const key = `dayro_generated:${response.data.requestId}`;
    if (submitted.has(key)) {
      return;
    }
    try {
      if (sessionStorage.getItem(key)) {
        return;
      }
    } catch {
      // Memory fallback.
    }
    let duration: "under_2h" | "2_to_4h" | "over_4h" | undefined;
    if (answers.time) {
      const minutes =
        (to24Minutes(answers.time.end) - to24Minutes(answers.time.start) + 1440) % 1440;
      if (minutes < 120) {
        duration = "under_2h";
      } else if (minutes <= 240) {
        duration = "2_to_4h";
      } else {
        duration = "over_4h";
      }
    }
    trackEvent("course_generated", {
      purpose: answers.purpose,
      transport: answers.transport?.local,
      duration
    });
    submitted.add(key);
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Memory fallback.
    }
  } catch {
    // Analytics cannot change a successful generation into an error.
  }
}
