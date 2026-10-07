import type { PlaceCandidate, SituationAnswers } from "../../situation";
import {
  courseSaveRequestSchema,
  type CourseSaveRequest,
} from "../../../shared/api/openapi/dayro.openapi";

/** 저장 sheet 가 수집하는 코스 저장 초안. */
export interface CourseSaveDraft {
  name: string;
  description: string;
}

const PURPOSE_TO_API_VALUE: Record<
  NonNullable<SituationAnswers["purpose"]>,
  CourseSaveRequest["purpose"]
> = {
  date: "CASUAL_DATE",
  blind: "BLIND_DATE",
  friends: "FRIENDS",
  anniversary: "ANNIVERSARY",
};

function to24Minutes(time: { meridiem: "오전" | "오후"; hour: number; minute: number }) {
  const normalizedHour = time.hour % 12;
  return (time.meridiem === "오후" ? normalizedHour + 12 : normalizedHour) * 60 + time.minute;
}

function formatApiTime(time: { meridiem: "오전" | "오후"; hour: number; minute: number }) {
  const totalMinutes = to24Minutes(time);
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}:00`;
}

/**
 * 저장 sheet 초안과 현재 장소 순서를 백엔드 저장 계약으로 직렬화한다.
 * 코스명/한줄설명을 백엔드 저장 계약으로 함께 전달한다.
 */
export function buildCourseSaveRequest(params: {
  draft: CourseSaveDraft;
  answers: SituationAnswers;
  places: readonly PlaceCandidate[];
}): CourseSaveRequest {
  const { draft, answers, places } = params;

  if (!answers.time || !answers.region || !answers.purpose) {
    throw new Error("코스 저장에 필요한 정보가 부족합니다.");
  }

  return courseSaveRequestSchema.parse({
    title: draft.name,
    description: draft.description || null,
    districtId: answers.region.districtId,
    purpose: PURPOSE_TO_API_VALUE[answers.purpose],
    startTime: formatApiTime(answers.time.start),
    endTime: formatApiTime(answers.time.end),
    places: places.map((place) => ({
      placeId: place.placeId,
      name: place.name,
      category: place.category,
      address: place.address,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      businessHours: place.businessHours,
      latitude: place.latitude,
      longitude: place.longitude,
      photoUrl: place.photoUrl ?? null,
    })),
  });
}
