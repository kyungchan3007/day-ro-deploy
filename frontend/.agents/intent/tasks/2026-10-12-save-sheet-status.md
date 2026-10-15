# 코스 저장 후 바텀시트 재오픈 시 저장 완료 문구 미노출

## Task Meta
- task_id: 2026-10-12-save-sheet-status
- date: 2026-10-12
- owner: Claude(구현, 사용자 지시)
- status: done
- task_type: 버그 수정 (QA 시트 #4)
- linked_prd: - (소규모 수정, issue Dayro-dev/dayro#179)
- linked_sdd: - (구조 변경 없음, features/course-map 내부)
- branch: `fix/#179-save-sheet-status`

## 문제 (QA 원문 · 첨부 캡처)
- AS-IS: 저장 후 "코스 저장하기" 다시 클릭 → 바텀시트 저장하기 버튼 아래 "코스가 저장되었습니다." 노출
- TO-BE: 바텀시트 안 문구 미노출 (저장 결과는 토스트로 안내 중)
- 원인: `useSaveCourseSheet` 저장 성공 시 시트 상태 문구 설정 · 시트는 닫혀도 마운트 유지 → 상태 남음
- 참고: 26주차 QA 정리 때 이 항목을 "문구 노출 필요"로 반대로 해석했던 것을 원문 재확인으로 바로잡음

## 결정
- 저장 성공 시 시트 안 상태 문구를 설정하지 않음 (토스트만)
- 시트를 닫으면 안내 문구(검증 · 실패) 초기화 (`resetStatus`)
- 입력값(코스명 · 설명) 유지 정책은 변경 없음 (QA 범위 밖)

## Acceptance Criteria
- must: 저장 → 토스트 → 시트 다시 열기 → 완료 문구 없음
- must: 검증 오류 후 닫았다 열면 오류 문구 없음
- must: 저장 · 토스트 · 로그인 복귀 저장 흐름 유지

## Evidence Result
- tsc 통과 · lint 0 errors · 전체 unit 829건 통과
- e2e (사용자 지시 2026-10-12): `course-save-sheet-status.spec.ts` 2건 + 회귀 7건 → 9/9 통과
  - 저장 → 토스트 → 재오픈 → 시트 안 완료 문구 없음
  - 코스명 공백 저장 → 검증 문구 → 닫기 → 재오픈 → 문구 없음
  - 회귀: course-save-login-return 3건 · course-map-route-guide 1건 · saved 3건
  - 수정 전 코드에서 신규 2건 모두 실패 확인
  - 최초 실행 시 검증 시나리오 실패: 빈 칸은 input `required` 가 제출을 막아 앱 문구 미노출 → 공백 입력으로 테스트 수정
  - 녹화 영상 2개 → 노션 QA #4
  - 환경: 별도 worktree, e2e 포트 3120 · 목 백엔드 18091

## 추가 수정 (사용자 요청 2026-10-12)
- 코스명 없이 저장 → 브라우저 기본 안내 대신 앱 문구 "코스명을 입력해주세요"
  - 원인: input `required` 로 브라우저가 제출을 먼저 막음
  - 수정: form `noValidate` · input `aria-required="true"` (required 속성은 의미상 유지)
- 같은 코스 중복 저장 제한은 사용자 결정으로 보류
- e2e: `course-save-sheet-status.spec.ts` 3건(빈 코스명 시나리오로 변경 + 공백 코스명 추가) · `course-save-login-return.spec.ts` 3건 통과
  - 1회차에 로그인 복귀 새 탭 1건 간헐 실패(toMatchObject) → 같은 조합 재실행 2회 · 단독 3회 반복 모두 통과, 원인 미특정
- unit 829건 통과 · 녹화 영상 → 노션 QA #4
