# 코스 삭제 UI 검증 게이트

- 검증일: 2026-09-03 (Asia/Seoul)
- 전체 판정: **rejected**
- 방식: 지정 파일 및 직접 소비/재사용하는 삭제 훅·`ConfirmDialog`·빈 상태 UI 정적 검토
- 제외: 이미 통과한 TypeScript/ESLint/Vitest 재실행 안 함, E2E 실행 안 함
- 코드 수정/커밋: 없음 (본 검증 리포트만 작성)

## Findings (심각도순)

### HIGH — 빈 상태 UI에 client logic/navigation policy가 남아 있음

- 근거: `src/features/saved/ui/SavedEmpty.tsx:3-4,14-16,25-30`
  - UI 조각인 `SavedEmpty`가 `useRouter()`를 직접 호출한다.
  - 인라인 `onClick={() => router.push("/course/new")}`로 이동 정책과 이벤트 orchestration을 직접 소유한다.
- 연결 경로: `src/widgets/saved/SavedCourseListClient.tsx:37-39`
  - 마지막 코스 삭제 성공 후 실제로 진입하는 렌더 경로가 이 UI다.
- 영향: 카드/위젯/빈 상태 UI는 값과 핸들러 바인딩만 한다는 최우선 `client-logic-separation` 기준을 충족하지 못한다. 삭제 관련 상태는 두 커스텀 훅으로 분리됐지만, 화면 전체의 client logic이 모두 훅에 있다는 조건은 거짓이다.
- 판정 영향: rejection 사유.

### MEDIUM — 실패 오류가 취소 후 다음 삭제 대상에 그대로 노출됨

- 근거:
  - `src/features/saved/hooks/useSavedListScreen.ts:49-56`: `requestDelete`/`cancelDelete`는 대상 ID만 바꾸며 오류를 초기화하지 않는다.
  - `src/features/saved/hooks/useDeleteSavedCourse.ts:35,41-47`: 오류 초기화는 다음 실제 DELETE를 시작한 뒤에만 일어난다.
  - `src/widgets/saved/SavedCourseListClient.tsx:64-73`: 모달이 열리면 현재 대상과 무관하게 기존 `deleteError`를 즉시 표시한다.
- 재현 시나리오: 코스 A 삭제 실패 → 취소 → 코스 B 삭제 버튼 클릭 → B 확인 모달에 A 요청의 오류가 표시됨. 같은 코스를 다시 열어도 확인 전부터 이전 오류가 남는다.
- 영향: 실패 후 대상 전환/재시도 UX가 잘못된 상태를 보여준다. 실패 직후 모달 유지와 즉시 재시도 자체는 정상이다.

### MEDIUM — 재사용한 ConfirmDialog의 포커스 수명주기 결함을 그대로 상속함

- 근거: `src/shared/ui/dialog/ConfirmDialog.tsx:51-55,83-95,125-146`
  - `open=false`여도 portal과 활성화된 버튼을 DOM에 유지하며, `aria-hidden`과 `pointer-events-none`만 적용한다. 이는 키보드 탭 포커스를 제거하지 않는다.
  - 닫기 전 포커스 요소를 저장/복원하는 처리가 없다.
  - pending 시 버튼들이 disabled된 뒤에도 배경을 inert 처리하지 않아 포커스가 배경으로 빠질 가능성이 있다.
- 영향: 취소/성공 후 삭제 버튼으로 포커스가 복귀하지 않고, 닫힌 모달의 보이지 않는 버튼 또는 모달 뒤 콘텐츠에 키보드 포커스가 도달할 수 있다.
- 범위 메모: 새 삭제 UI가 자체 DOM 제어를 추가한 문제는 아니며, 요청대로 공용 `ConfirmDialog`를 재사용하면서 상속한 기존 접근성 리스크다. Escape/backdrop 차단 자체는 pending 중 정상 작동한다.

### LOW — saved public API가 현재 소비 경계보다 넓음

- 근거: `src/features/saved/index.ts:11-19`
  - 외부 위젯이 필요한 것은 `useSavedListScreen`이지만, 내부 조합용 `useDeleteSavedCourse`, 전송 오류 클래스, shared OpenAPI 응답 타입까지 feature 배럴에서 공개한다.
  - 현재 프로덕션 소비자는 `useSavedListScreen`뿐이며 하위 삭제 훅/오류 클래스는 feature 내부에서만 사용된다.
- 영향: 즉시 런타임 문제는 없으나 하위 transport/controller 계약을 feature 공개 계약으로 고정하고, shared 계약을 feature가 재-export하는 불필요한 결합이 생긴다.

## 역할분담 검증 결과

- `SavedCourseCard.tsx`: 통과. hook/state/async/DOM 제어가 없고 삭제 클릭은 주입된 콜백 바인딩뿐이다. 삭제 버튼은 `Link` 바깥 형제라 interactive element 중첩이 없다.
- `SavedCourseListClient.tsx`: 삭제 UI 범위는 통과. 허용된 controller hook `useSavedListScreen`만 호출하고 목록·모달에 값을 바인딩한다. 인라인 화살표는 course ID를 주입하는 어댑터이며 별도 이벤트 정책은 없다.
- `SavedListScreen.tsx`: 통과. 서버 컴포넌트 상태를 유지하며 정적 shell/navigation과 client island 경계가 분리됐다.
- `useSavedListScreen.ts`: 목록, 선택 대상, confirm/cancel 정책, 성공 후 제거 orchestration을 소유한다.
- `useDeleteSavedCourse.ts`: async DELETE, pending/error, 동기 ref 기반 중복 실행 차단을 소유한다.
- `SavedEmpty.tsx`: 실패. client hook 및 이동 이벤트 정책을 UI가 직접 소유한다.
- 종합: 새 삭제 상태/orchestration의 훅 분리는 양호하지만, 삭제 후 화면까지 포함한 saved UI 경로 전체는 역할분담 기준 미달이다.

## 기능/접근성 체크

- 중복 클릭: 통과. UI disabled와 별개로 `pendingRef`가 같은 tick의 이중 호출도 차단한다.
- 마지막 항목 삭제: 통과. 성공 콜백에서 목록을 제거하고 `courses.length === 0`이면 `SavedEmpty`로 전환한다.
- 삭제 실패/재시도: 부분 통과. 실패 시 대상 ID가 유지되어 모달이 열려 있고 다음 confirm에서 error를 지운 후 재시도한다. 단, 취소/대상 변경 시 stale error finding이 있다.
- pending 중 취소/Escape/backdrop: 통과. 훅의 `cancelDelete` guard와 `ConfirmDialog`의 disabled/Escape/backdrop guard가 중복 방어한다.
- 삭제 버튼 이름: 통과. `${name} 삭제` aria-label 제공.
- Link/button 중첩: 통과. 형제 구조.
- 모달 focus/Escape: 부분 통과. 최초 confirm focus와 Escape 정책은 있으나 위 포커스 수명주기 finding이 남는다.
- 아이콘/public export: `TrashIcon`은 shared icon 구현 → icon 배럴 → shared UI 배럴 경로로 정상 노출된다.

## 남은 리스크

- `useSavedListScreen`은 `initialCourses`를 최초 state로만 사용한다(`src/features/saved/hooks/useSavedListScreen.ts:31-35`). 동일 client instance에 서버 props가 갱신되는 탐색/refresh가 발생하면 새 목록과 동기화되지 않을 수 있다.
- controller/UI 통합 테스트가 검토 대상 테스트 목록에서 확인되지 않았다. 개별 삭제 훅 테스트는 중복 요청을 보장하지만, 마지막 항목 전환·실패 모달 유지·pending Escape 잠금·stale error 대상 전환은 실제 컴포넌트 결합 수준에서 회귀 방지되지 않는다.
- E2E는 지시대로 실행하지 않았으므로 실제 브라우저 포커스 순서, portal stacking, 모바일 터치 영역은 미검증이다.
