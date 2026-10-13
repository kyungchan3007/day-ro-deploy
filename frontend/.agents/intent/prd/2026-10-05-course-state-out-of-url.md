# 코스 만들기 상태 URL 밖 이동 PRD

## Meta
- prd_id: 2026-10-05-course-state-out-of-url
- date: 2026-10-05
- owner: Claude(coordinator) / Codex(architecture gate·로직·검증)
- issue: Dayro-dev/dayro#129 · ADR-26

## Problem
- 현재 문제: `/course/new` result·course 단계 주소에 `requestId`·`candidatePlaces`·`selectedPlaces`(장소명 JSON)·`selectedPlaceIds`가 실린다(`features/situation/model/url-state.ts`).
- Meta Pixel은 요청마다 현재 주소 전체를 자동 수집하고 코드로 정제할 수 없어, #125에서 민감 쿼리 주소의 Meta를 차단했다 → Meta는 코스 생성·재추천·소진·저장을 모른다.
- 장소명·requestId가 브라우저 방문 기록·서버 로그·referrer에 남고, 주소가 매우 길다.
- 사용자 영향: 기능상 없음(코스 생성은 정상). 운영 영향: 유료 광고 최적화·리타게팅 불가.

## Goal
- 코스 만들기 전 단계에서 Meta Pixel을 안전하게 실행해 코스 이벤트를 Meta에도 전송한다.
- 주소에서 requestId·장소 정보를 제거한다.
- 새로고침·뒤로가기·재추천·저장 등 기존 흐름은 회귀 없이 유지한다.

## In Scope
- result·course 단계 상태(requestId·후보·선택 장소·잔여 횟수) 저장 위치 이동
- 주소 계약(`url-state.ts`)·서버 페이지 데이터 준비(`get-course-new-page-data.ts`)·클라이언트 복원 경로 재설계
- 조건 값(시간·지역·목적) 주소 처리 방식 결정
- `isMetaBlockedUrl` 허용 범위 조정 → 코스 화면 Meta 재활성
- 단위·e2e 테스트 갱신

## Out of Scope
- 코스 추천 로직·UI 디자인 변경
- 저장된 코스(`/saved/[id]`) 구조
- (결정 전) 백엔드 API 추가 — 토론 결과에 따라 범위 확정

## Success Signals
- result·course 단계 주소에 requestId·장소 정보가 없다.
- 새로고침 시 같은 후보가 유지되고 불필요한 재생성(Gemini 호출)이 늘지 않는다.
- 코스 화면에서 Meta 코스 이벤트가 전송되고 민감 정보는 전송되지 않는다.
- 기존 e2e(course-new) 통과.

## Risks / Assumptions
- "URL = 상태" 전제(#63)로 SSR·복원·재추천이 설계돼 있어 변경 범위가 크다.
- 새 탭·링크 공유 시 상태 복원 범위가 줄어들 수 있다(현재 기능적 공유 요구는 없음으로 가정, 확인 필요).
- 백엔드 변경 시 담당자(AI 코스 생성: 한혜민) 협의 필요.
