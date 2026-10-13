import {
  BFF_ENDPOINTS,
  buildSituationRetryEndpoint,
} from "../../../shared/api/endpoints";
import {
  courseCandidateResponseSchema,
  type CourseCandidateResponse,
  type SituationInputRequest,
} from "../../../shared/api/openapi/dayro.openapi";
import { CourseCandidatesRequestError } from "../model/generation-failure";

/** 서버 문구로 인정하는 최대 길이. 그보다 길면 HTML 등 예상 밖 본문으로 보고 버린다. */
const MAX_SERVER_MESSAGE_LENGTH = 200;

/**
 * 실패 응답 본문에서 사용자용 문구만 꺼낸다.
 * 본문을 text 로 한 번 읽고 JSON 이면 `message`(1~200자 문자열)만 채택한다. 그 밖은 undefined.
 * @param response 실패한 BFF 응답.
 * @returns 서버 문구. 읽기·파싱 실패나 형식 불일치면 undefined.
 */
async function readServerMessage(response: Response): Promise<string | undefined> {
  try {
    const json: unknown = JSON.parse(await response.text());
    if (typeof json === "object" && json !== null && "message" in json) {
      const { message } = json;
      if (
        typeof message === "string" &&
        message.trim().length > 0 &&
        message.length <= MAX_SERVER_MESSAGE_LENGTH
      ) {
        return message.trim();
      }
    }
  } catch {
    // HTML 차단 페이지 · 빈 본문은 문구 없음으로 처리한다.
  }
  return undefined;
}

async function toRequestError(
  response: Response,
  code: string,
): Promise<CourseCandidatesRequestError> {
  return new CourseCandidatesRequestError(code, response.status, await readServerMessage(response));
}

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
    throw await toRequestError(response, "course_candidates_failed");
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
    throw await toRequestError(response, "course_candidates_retry_failed");
  }

  return courseCandidateResponseSchema.parse(await response.json());
}
