# 찜한 코스 길안내 공유 방법 시트 · 무반응 해소

## Task Meta
- task_id: 2026-10-12-share-options
- date: 2026-10-12
- owner: Claude(UI · 구현, 사용자 지시)
- status: done
- task_type: 버그 수정 (QA 시트 #12 · #19)
- linked_prd: - (소규모 수정, issue Dayro-dev/dayro#183)
- linked_sdd: - (구조 변경 없음, features/saved 내부 + widgets/saved 조합)
- branch: `fix/#183-share-options`

## 문제
- #12 (MO-AOS): 길안내 공유 → 링크 복사만, 카카오톡 공유 선택 불가
- #19 (PC · iPad): 길안내 공유 → 완전 무반응
- 원인: `navigator.share` 있으면 그것만 호출 · 취소/실패 조용히 종료, 없으면 바로 복사 (선택지 없음)

## 결정 (사용자 선택: 공유 옵션 시트 먼저)
- `ShareOptionsSheet`: 제목 "길안내 공유" · "링크 복사" · "다른 앱으로 공유"(시스템 공유 미지원이면 숨김)
  - 시트 모양은 코스 저장 시트와 동일 (새 디자인 없음) · 항목은 공용 `MenuItem` · 접근성은 `useModalDialog`
- `useSavedCourseDetailScreen`: shareCourse = 시트 열기 · copyShareLink · shareViaSystem
  - 취소(AbortError)만 조용히, 그 밖 실패는 링크 복사 폴백 + 토스트 · 복사 실패도 토스트
- `lib/share-result.ts`: 문구 · `classifyShareError` · `canUseSystemShare`
- 범위 밖: 카카오 JS SDK 카카오톡 공유 버튼 · 미리보기 제목/이미지 (QA #5 · #6 과 후속)

## Acceptance Criteria
- must: PC(미지원)에서 시트 → 링크 복사 → 토스트 · 클립보드에 네이버 길찾기 링크
- must: 모바일(지원)에서 다른 앱으로 공유 → 성공 토스트 / 실패 시 링크 복사 폴백 토스트 / 취소는 조용히
- must: ESC · 바깥 클릭으로 닫힘

## Evidence Result
- tsc 통과 · lint 0 errors · unit 847건 (신규 `share-result.test.ts` 7건 · `share-analytics.test.ts` 5건 갱신)
- e2e (사용자 지시 2026-10-12): `saved/saved-share.spec.ts` 5건 + 회귀 4건(saved · saved-empty) → 9/9 통과
  - 시스템 공유 미지원 → 시트 · 링크 복사 · 클립보드에 네이버 길찾기 링크
  - 다른 앱으로 공유 성공 · 실패 시 링크 복사 폴백 · 취소 시 조용히 · ESC 닫기
  - 수정 전 코드에서 신규 5건 모두 실패 확인
  - navigator.share 지원/결과는 addInitScript 로 흉내 · 클립보드 권한 부여
  - 녹화 영상 4개 → 노션 QA #19(PC 3) · #12(모바일 1)
  - 환경: 별도 worktree, e2e 포트 3120 · 목 백엔드 18091
