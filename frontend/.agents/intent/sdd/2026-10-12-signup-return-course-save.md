# 코스 저장 중 로그인·회원가입 후 저장 화면 복귀 SDD

## Meta
- sdd_id: 2026-10-12-signup-return-course-save
- date: 2026-10-12
- owner: Claude(구현, 사용자 지시)
- status: approved(design)
- issue: Dayro-dev/dayro#169

## 현재 구조
- `features/course-map/hooks/useCourseMapScreen.ts`: 저장 401 → `/login?next=<코스 화면 주소(step=course&rev=…)>` 이동
- `next` 는 로그인 → 카카오 시작(쿠키) → 콜백 redirect 까지 정상 전달 (`app/api/auth/kakao/*`)
- 코스 흐름 상태(조건·후보·선택)는 `features/situation/lib/course-flow-storage.ts` 의 **sessionStorage**(탭 단위)
- 복귀 시 rev 스냅샷이 없으면 `useCourseFlowRedirects` 가 첫 미완료 단계(조건 없음 → time)로 replace
- 저장 시트 입력값(코스명·설명)은 메모리 state 뿐 → 이동하면 사라짐, 복귀 후 저장 재개 로직 없음

## 원인
- 모바일 카카오 로그인·회원가입은 카카오톡 앱·브라우저 전환을 거쳐 **새 탭 / 다른 브라우저 컨텍스트**로 돌아올 수 있음 → sessionStorage 없음 → 1단계 폴백 · 입력 유실 (QA AS-IS 와 일치)
- 같은 탭으로 돌아와도 저장은 재개되지 않음(토스트 없음)

## Design Decisions
- 로그인 이동 직전 두 가지를 **localStorage** 에 잠깐(30분) 보관
  - ① 코스 흐름 인계(`features/situation/lib/course-flow-handoff.ts`): 현재 rev 스냅샷
    - 흐름 상태를 처음 읽을 때(`readFromStorage`) 인계 스냅샷을 같은 rev 로 합친 뒤 인계 기록 삭제
    - sessionStorage 에 이미 있으면 덮어쓰지 않음 (같은 탭 복귀)
  - ② 대기 중인 저장(`features/course-map/lib/pending-course-save.ts`): rev + 저장 요청 본문(현재 순서 · 코스명 · 설명)
- 코스 화면 진입 시 현재 rev 와 같은 대기 저장이 있으면 **먼저 지우고** 저장 요청 재개
  - 성공 → `course_saved` 이벤트 + "코스가 저장되었습니다."
  - 401 → "로그인 후 다시 저장해주세요." (무한 로그인 왕복 방지)
  - 그 밖 → "코스를 저장하지 못했어요. 다시 시도해주세요."
- 저장 요청 본문은 `courseSaveRequestSchema` 로, 스냅샷은 흐름 상태 스냅샷 스키마로 다시 검증 (손상 · 버전 불일치 → 무시)

## 레이어
- 흐름 스냅샷 인계 = features/situation (흐름 상태 소유자) · 공개 API `stashCourseFlowHandoff`
- 대기 저장 · 재개 = features/course-map (저장 소유자)
- course-map → situation 공개 API 만 사용 (기존 의존 방향 유지)

## Risks
- localStorage 는 탭 간 공유 → 30분 TTL · 한 번 쓰면 삭제로 범위 제한
- 저장 요청 본문(코스명 · 설명 · 장소)이 잠깐 브라우저에 남음 → 개인정보 아님, 토큰 미포함
