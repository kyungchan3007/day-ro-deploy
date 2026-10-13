# API 계약 zod/mini 전환 및 번들 재발 방지 PRD

## Meta
- prd_id: 2026-09-13-zod-mini-contract
- date: 2026-09-13
- owner: Claude (coordinator) / Codex (구현·검증 owner)

## Problem
- 현재 문제: 공용 API 계약(`shared/api/openapi/dayro.openapi.ts`)이 zod classic을 사용하고, 브라우저 요청/응답 검증(`.parse()`)을 통해 zod classic 전체가 클라이언트 초기 번들에 포함된다. prod `/course/new/` Coverage에서 해당 청크 270,924B 중 221,374B(81.7%) 미사용, 15개 라우트 중 11개 first-load에 포함.
- 사용자 영향: 저사양 모바일에서 초기 JS 다운로드·파싱·하이드레이션 구간이 길어져 화면은 보이지만 입력 반응이 늦는 구간이 생긴다. Lighthouse 시뮬 LCP 2.9s, TBT 여유 감소.
- 운영 영향: 어떤 import가 무거운 라이브러리를 끌어오는지 막는 장치가 없어 같은 유형의 번들 회귀가 재발할 수 있다. CI에 lint·prod build 단계가 없다.

## Goal
- 달성 목표: 기존 검증 정책·동작을 유지한 채 zod 클라이언트 번들을 경량화하고, 동일 유형 회귀를 lint·CI에서 자동 차단한다.

## In Scope
- 계약 파일 전체 `zod/mini` 전환(단일 원본 유지), 영어 locale 명시 설정.
- 모든 런타임 사용처 전환(클라이언트 `.parse()` 사용처 + `course-map/lib/selected-course-storage.ts`, `situation/model/url-state.ts`, `course-result/lib/generated-course-storage.ts`), 서버 에러 판별 `zod/v4/core` `$ZodError` 기준.
- classic↔mini 동작 동등성 회귀 테스트, mini 단독 locale 테스트.
- ESLint zod 진입점 정책, 라우트별 first-load 번들 예산 스크립트·baseline, CI(lint·build·예산) 추가, `performance.md` 규칙.

## Out of Scope
- BFF 요청 검증/upstream 응답 검증 분리(upstream 계약 오류 400 오분류) — 후속 task.
- UI raw zod 메시지 노출(`useSaveCourseSheet.ts:67`) 개선 — 후속 task.
- 계약 모듈 도메인별 분할 — mini 실측 후 불필요 스키마 잔존 확인 시에만.
- 클라이언트 검증 제거, react-dom/Next 런타임 청크 최적화.

## Success Signals
- zod 관련 초기 번들 감소를 prod build 실측으로 확인(`/course/new` 비압축 first-load 913,599B 기준 비율 보고, 공용 청크 절감×라우트 수 합산 보고 금지).
- 동등성 테스트 통과(성공 여부·파싱 결과·issue code/path/message 동일).
- classic zod import 시 lint 실패, 예산 초과·라우트/청크 누락 시 예산 스크립트 실패.
- Lighthouse 5개 지표(FCP·LCP·TBT·CLS·SI) 회귀 없음(사용자 측정).

## Related Domain
- auth, course-situation, course-result, course-map, saved, 공용 API 계약(shared/api).

## Risks / Assumptions
- `z.config(en())`은 `globalThis` 전역 설정 — prod tree-shaking 후 초기화 보존 검증 필요.
- 실제 절감량은 Coverage 미사용량과 다를 수 있다(`dayroOpenApi` 집계 객체가 tree-shaking을 막을 가능성).
- CI 필수 체크(branch protection) 지정 여부 미확인 — 미지정이면 gate가 머지를 막지 못한다.
- 근거: `.agents/reports/handoffs/2026-09-13-zod-client-bundle-debate.md`(Bounded Debate 2라운드 합의).
