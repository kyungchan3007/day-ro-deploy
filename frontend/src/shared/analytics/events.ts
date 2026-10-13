export interface AnalyticsEvents {
  page_view: Record<string, never>;
  sign_up: {
    method: "kakao";
  };
  login: {
    method: "kakao";
  };
  course_generated: {
    purpose?: "date" | "blind" | "friends" | "anniversary";
    transport?: "car" | "walk" | "subway" | "bus";
    duration?: "under_2h" | "2_to_4h" | "over_4h";
  };
  course_regenerated: {
    retry_index: number;
    remaining_retries: number;
  };
  course_retry_limit_reached: {
    retry_limit: 5;
  };
  course_saved: {
    place_count: number;
  };
  course_shared: {
    method: "share_sheet" | "clipboard";
  };
}

export type EventName = keyof AnalyticsEvents;

export const META_EVENTS: Record<EventName, ["track" | "trackCustom", string]> = {
  page_view: ["track", "PageView"],
  sign_up: ["track", "CompleteRegistration"],
  login: ["trackCustom", "Login"],
  course_generated: ["trackCustom", "CourseGenerated"],
  course_regenerated: ["trackCustom", "CourseRegenerated"],
  course_retry_limit_reached: ["trackCustom", "CourseRetryLimitReached"],
  course_saved: ["trackCustom", "CourseSaved"],
  course_shared: ["trackCustom", "CourseShared"],
};

const oneOf = (...values: string[]) => (value: unknown) =>
  typeof value === "string" && values.includes(value);

const count = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const rules: Record<EventName, Record<string, (value: unknown) => boolean>> = {
  page_view: {},
  sign_up: {
    method: oneOf("kakao")
  },
  login: {
    method: oneOf("kakao")
  },
  course_generated: {
    purpose: oneOf("date", "blind", "friends", "anniversary"),
    transport: oneOf("car", "walk", "subway", "bus"),
    duration: oneOf("under_2h", "2_to_4h", "over_4h")
  },
  course_regenerated: {
    retry_index: v => count(v) && Number(v) >= 1 && Number(v) <= 5,
    remaining_retries: v => count(v) && Number(v) <= 4
  },
  course_retry_limit_reached: {
    retry_limit: v => v === 5
  },
  course_saved: {
    place_count: count
  },
  course_shared: {
    method: oneOf("share_sheet", "clipboard")
  },
};

/**
 * 이벤트별 허용 키와 값만 남겨 자유 입력과 식별자 유입을 차단한다.
 * @param name 이벤트 카탈로그 이름.
 * @param params 검증할 이벤트 파라미터.
 * @returns 허용 목록을 통과한 파라미터 객체.
 */
export function sanitizeParams(
  name: EventName,
  params: object,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) => Object.hasOwn(rules[name], key) && rules[name][key](value),
    ),
  );
}
