/**
 * situation feature 좁은 공개 진입점 — 로그인 인계 (issue #247).
 * 코스 지도(features/course-map)가 로그인 직전 흐름 스냅샷을 맡길 때만 쓴다.
 * 기본 배럴(`index.ts`)은 상황입력 화면 조각이 모두 묶여 있어, 거기서 가져오면 찜 · 공유 라우트까지
 * 상황입력 UI 가 첫 로드에 실린다 → 필요한 것만 따로 내보낸다(`features/auth/analytics` 와 같은 방식).
 */
export { useCourseFlowLoginHandoff } from "./hooks/useCourseFlowLoginHandoff";
export type { SituationAnswers } from "./model/types";
export type { PlaceCandidate } from "@/shared/api/openapi/dayro.openapi";
