# 코스 생성·재추천 429 원인별 안내 SDD

## Meta
- sdd_id: 2026-10-10-rate-limit-toast
- date: 2026-10-10
- owner: Claude(구현, 사용자 지시)
- status: approved(design)
- issue: Dayro-dev/dayro#161

## 현재 구조
- `features/situation/api/submit.ts`: `!response.ok` → `Error("course_candidates_failed")` (상태 · 본문 버림)
- `features/situation/hooks/useCourseGeneration.ts`: 실패 시 operation 기록 `status: "failed"` → phase `error`
- `widgets/situation/hooks/useCourseFlowRedirects.ts`: `generationFailed` 면 고정 문구(`generationFailed` · `retryFailed`) 토스트 후 이동
- BFF 오류 응답: 백엔드 4xx · 503 은 `{ success: false, message, data: null }` + 백엔드 상태 그대로(`toBackendApiError`)
- Cloudflare WAF 차단: Worker 앞단에서 429 + HTML (BFF 미도달)

## Design Decisions
- `submit.ts`: 실패 시 `CourseCandidatesRequestError(status, serverMessage?)` 던짐
  - 본문은 text 로 한 번 읽고 JSON 이면 `message`(문자열 · 1~200자)만 채택, HTML · 빈 본문 · 파싱 실패는 무시
- `features/situation/model/generation-failure.ts`: `resolveGenerationFailureMessage(error)`
  - 429 + serverMessage → serverMessage
  - 429 + 메시지 없음 → `RATE_LIMITED_MESSAGE` ("요청이 너무 많아요. 10초 후 다시 시도해주세요.")
  - 그 밖(5xx · 네트워크 · 일반 Error) → `undefined` (호출부 기존 문구)
- operation 기록 `failureMessage?: string` 추가 (zod `optional(string)`, 기존 저장값과 호환)
  - 새로고침 후 실패 기록으로 돌아와도 같은 문구
- `useCourseGeneration` 반환에 `failureMessage` 추가
- `useCourseFlowRedirects` 옵션 `generationFailureMessage?: string` → `generationFailed` 일 때 `failureMessage ?? 기존 문구`
- 이동 규칙 변경 없음 (재추천 실패 → result · 남은 횟수 유지, 생성 실패 → purpose)

## 레이어
- 상태 코드 해석 · 문구 결정 = features/situation (model)
- 토스트 표시 · 이동 = widgets/situation (기존 위치)

## Risks
- 백엔드 4xx 문구를 그대로 노출 → 백엔드 ErrorCode 문구는 사용자용으로 관리됨(`backend-error.ts` 계약)
- `COURSE_RETRY_LIMIT_EXCEEDED`(429) 도 서버 문구로 안내됨 → 기존 소진 안내와 의미 일치
