import {
  situationInputRequestSchema,
  type SituationInputRequest,
} from "../../../shared/api/openapi/dayro.openapi";
import { to24Minutes } from "./time";
import type { PurposeChoice, SituationAnswers, Time } from "./types";

const PURPOSE_TO_API_VALUE: Record<PurposeChoice, SituationInputRequest["purpose"]> = {
  date: "CASUAL_DATE",
  blind: "BLIND_DATE",
  friends: "FRIENDS",
  anniversary: "ANNIVERSARY",
};

function formatApiTime(time: Time) {
  const totalMinutes = to24Minutes(time);
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}:00`;
}

export function buildSituationRequest(
  answers: SituationAnswers,
): SituationInputRequest {
  if (!answers.time || !answers.region || !answers.purpose) {
    throw new Error("상황 입력이 아직 완료되지 않았습니다.");
  }

  return situationInputRequestSchema.parse({
    startTime: formatApiTime(answers.time.start),
    endTime: formatApiTime(answers.time.end),
    districtId: answers.region.districtId,
    purpose: PURPOSE_TO_API_VALUE[answers.purpose],
  });
}
