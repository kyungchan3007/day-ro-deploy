# 재추천 실패 시 결과 유지 SDD

## Meta
- sdd_id: 2026-10-05-retry-failure-keeps-result
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시)
- status: approved(design) — 기존 흐름 상태(#129) 안의 버그 수정
- issue: Dayro-dev/dayro#143

## 원인
- 백엔드 `CourseRecommendationServiceImpl.retry`: 성공 후에만 `retryCount + 1` → 실패한 재추천은 미차감(정상)
- 프론트 `useCourseFlowRedirects`: 실패·중단 시 operation 종류와 무관하게 `purpose` 로 replace
- 재추천 loading 스냅샷에 후보가 없어 결과 화면 복원 불가 → purpose → 새 코스 생성 → 새 requestId → 남은 횟수 초기화

## Design Decisions
- `useSituationFlowController.handleReroll`: retry loading 스냅샷에 현재 `candidates` 기록
- `useCourseFlowRedirects`: `operationKind === "retry"` + requestId + 후보 있음 → `result` 스냅샷(같은 requestId·후보, 선택 초기화)으로 replace, 실패 `retryFailed`·중단 `retryInterrupted` 안내
- 최초 생성(initial)·후보 없는 이전 스냅샷 → 기존대로 purpose
- 남은 횟수: `retries[requestId]`는 성공 응답에서만 갱신 → 실패 시 그대로

## Risks
- 선택 중이던 장소는 초기화(결과 화면 재진입과 동일)
