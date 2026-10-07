# Handoff - `2026-08-07-course-save-api`

## Meta (기본 정보)
- date: `2026-08-07`
- from: `FeatureAgent`
- to: `ValidationAgent`
- current_stage: `validation`
- handoff_reason: `risk_carryover`
- next_mode: `same-thread`

## Completed (완료된 내용)
- 코스 저장용 BFF route 추가
- 인증된 server transport 추가
- OpenAPI endpoint/schema/type 갱신
- `course-map` feature의 저장 payload 직렬화/model 추가
- browser -> BFF 저장 API 연결
- 저장 시트 입력 계약 정렬
- 로그인 필요 시 리다이렉트 orchestration 연결
- 관련 도메인 문서 갱신

## Remaining Acceptance Criteria (남은 완료 조건)
- 저장 성공 직후 `/saved` 목록에서 사용자가 결과를 확인하는 흐름은 이번 범위 밖이다.
- 저장 목록/상세 BFF 연동은 후속 작업이다.

## Open Risks (미해결 리스크)
- 저장 성공 후 사용자 확인 경로가 토스트 중심이라 후속 UX 작업이 필요할 수 있다.
- `/saved` 화면이 placeholder 데이터에 의존하므로 저장 결과의 end-to-end 확인은 제한적이다.

## Required Evidence (필요한 증거)
- 관련 단위 테스트 실행 결과
- `npx tsc --noEmit`
- `npm run build`
- BFF 경계와 widget/feature 역할 분리 구조 리뷰

## Next Recommended Action (다음 권장 액션)
- ValidationAgent가 BFF boundary, widget 역할 분리, 로그인 필요 처리, 저장 시트 계약 정렬을 기준으로 검증
