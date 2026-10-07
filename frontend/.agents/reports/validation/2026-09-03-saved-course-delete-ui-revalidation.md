# 코스 삭제 UI 재검증

- 검증일: 2026-09-03 (Asia/Seoul)
- 방식: A — 지정 경로 직접 읽기 및 직접 소비처 교차 검토
- 최종 판정: **approved_with_notes**
- 코드 수정/커밋: 없음 (본 검증 리포트만 추가)

## 결론

이전 4개 finding 중 1, 2, 4는 해소됐다. 3은 포커스 복원과 닫힌 다이얼로그의 비활성화는 해소됐지만, `pending` 전환 시 배경으로 포커스가 빠질 수 있는 경로가 남아 있어 부분 해소로 판정한다. 새 HIGH finding이나 saved 화면 역할분담 위반은 확인되지 않았다.

## 이전 finding 재판정

### 1. HIGH 역할분담 (`SavedEmpty`) — 해소

- `src/features/saved/hooks/useSavedEmpty.ts:14-21`이 `useRouter`와 `/course/new` 이동 정책을 소유한다.
- `src/features/saved/ui/SavedEmpty.tsx:14-30`은 훅에서 받은 `goToCreateCourse`를 버튼에 바인딩만 한다.
- `SavedCourseCard`는 주입된 삭제 콜백만 바인딩하고, `SavedCourseListClient`는 `useSavedListScreen`의 상태/핸들러를 조합만 한다.
- `SavedListScreen`은 서버 셸, `SavedCourseDetailScreen`은 기존 화면 훅의 반환값 바인딩 구조를 유지한다.
- 최종적으로 목록·빈 상태·상세를 포함한 saved 화면의 client logic/state/navigation/request orchestration은 훅에 있고 UI는 표현 및 바인딩을 담당한다. 역할분담 기준 충족.

### 2. MEDIUM stale error — 해소

- `src/features/saved/hooks/useDeleteSavedCourse.ts:58-60`에 오류만 초기화하는 `reset()`이 추가됐다.
- `src/features/saved/hooks/useSavedListScreen.ts:49-61`에서 모달을 여는 `requestDelete`와 닫는 `cancelDelete`가 `reset()`을 호출한다.
- 코스 A 실패 → 취소 → 코스 B 모달 열기 시 동일 이벤트 배치에서 오류가 초기화되므로 이전 오류가 B에 노출되지 않는다. 실패 직후 같은 모달에서 오류를 유지하고 재시도하는 기존 동작도 보존된다.

### 3. MEDIUM `ConfirmDialog` 포커스 수명주기 — 부분 해소

해소된 부분:

- `src/shared/ui/dialog/ConfirmDialog.tsx:58-67`에서 열기 직전 활성 요소를 저장하고 확인 버튼에 포커스한 뒤, 닫힘/언마운트 cleanup에서 이전 요소로 복원한다.
- `src/shared/ui/dialog/ConfirmDialog.tsx:97-106`의 `inert={!open}`로 닫힌 portal 내부 버튼이 탭 순서와 상호작용에서 제외된다. `open=true`일 때는 `inert`가 해제되므로 열림 상태의 클릭, Escape, Tab 순환을 막지 않는다.
- 로그아웃, 탈퇴 확인/완료, 문의 완료, saved 삭제 소비처의 `open`/`pending` 계약과 충돌하는 변경은 확인되지 않았다. 탈퇴 확인→완료의 동시 상태 전환에서도 닫히는 다이얼로그와 열리는 다이얼로그의 inert 상태는 독립적이다.

남은 부분은 아래 잔여 finding에 기록한다.

### 4. LOW VSA 공개 API — 해소

- `src/features/saved/index.ts:5-12`는 외부 위젯이 사용하는 UI/화면 훅/화면 모델만 노출한다.
- 내부 삭제 훅, 그 옵션/반환 타입, `SavedCourseDeleteRequestError`, shared OpenAPI `CourseDeleteResponse`의 재노출은 없다.
- 프로덕션 소비 검색에서도 삭제 하위 계층은 feature 내부에서만 사용된다.

## 잔여 finding

### MEDIUM — `pending` 중 모달 배경이 inert하지 않아 키보드 포커스가 탈출할 수 있음

- 근거: `src/shared/ui/dialog/ConfirmDialog.tsx:98-100`의 `inert`는 `!open`일 때만 다이얼로그 자체에 적용된다. 열린 상태의 배경 콘텐츠에는 inert가 적용되지 않는다.
- `src/shared/ui/dialog/ConfirmDialog.tsx:75-80`의 focusable selector는 `:disabled`를 제외하지 않고, `src/shared/ui/dialog/ConfirmDialog.tsx:138-152`는 `pending=true`일 때 모든 다이얼로그 버튼을 disabled로 만든다.
- 확인 버튼을 눌러 pending으로 바뀌면서 브라우저가 disabled된 활성 버튼의 포커스를 해제하면 `document.activeElement`가 focus trap의 `first`/`last` 어느 쪽도 아니게 된다. 이후 Tab에서 82-88행의 어느 분기도 실행되지 않아 배경의 tabbable 요소로 이동할 수 있다.
- 영향: 삭제뿐 아니라 로그아웃·탈퇴처럼 pending을 사용하는 모든 소비처에서 처리 중 모달의 포커스 격리가 완전하지 않다. 닫힌 모달의 ghost focus와 닫힘 후 포커스 복원 문제는 해결됐으며, 이 잔여 문제는 새 `inert`가 열림 상호작용을 깨뜨린 회귀는 아니다.

## 검증 로그

- `npx tsc --noEmit`: 통과
- 지정 변경 파일 ESLint: 통과
- `npx vitest run`: Node 프로젝트 38 files / 170 tests 통과. Storybook 브라우저 프로젝트는 샌드박스 로컬 포트 제한으로 `listen EPERM ::1`이 발생해 명령 종료 코드는 1이었다. 테스트 assertion 실패는 없었다.
- 직접 Chromium 동작 확인 시도: 샌드박스의 Mach port 권한 제한으로 브라우저 기동 불가. 따라서 pending 포커스 경로는 DOM/이벤트 흐름의 정적 검증에 근거한다.
- 현재 테스트에는 `ConfirmDialog`의 inert/포커스 복원/pending 포커스 격리를 직접 검증하는 회귀 테스트가 없다.

