# 찜한 코스 빈 상태 CTA 검증 리포트

## 작업 일시 (실행 날짜)
- `2026-08-31`

## Intent Source (의도 출처)
- task_id: `2026-08-31-saved-empty`
- intent artifact: 사용자 요청의 inline Execution Spec 및 확정된 검증 결과
- 의도: 찜한 코스가 없을 때 빈 상태 안내와 `코스 만들러 가기` CTA를 제공하고, CTA를 통해 코스 생성 화면으로 이동할 수 있게 한다.
- 기록 성격: 구현 및 검증 완료 후 작성한 소급 validation 기록이다.

## 검증 대상 (대상 파일 / 범위)
- UI / 디자인시스템 (Claude)
  - `src/features/saved/ui/SavedEmpty.tsx`
  - `src/widgets/saved/SavedListScreen.tsx`
  - `src/shared/static/saved/index.ts`
  - `src/features/saved/index.ts`
- 단위·e2e 테스트 및 mock 지원 (Codex)
  - `src/features/saved/test/saved-empty.test.tsx`
  - `src/e2e/saved/saved-empty.spec.ts`
  - `src/e2e/support/mock-backend-server.mjs`

## 최종 결정 (판정 결과)
- `approved_with_notes`
- 기능 완료조건과 tests/typecheck/lint gate는 모두 통과했다. Next.js가 빈 상태 일러스트를 LCP로 감지해 `loading="eager"` 또는 `priority` 적용을 권장한 경고 1건은 기능 실패가 아닌 성능 힌트로 남긴다.

## Acceptance Criteria 확인 (완료 조건 점검)
- 충족: 찜한 코스가 0건이면 목록 대신 빈 상태 UI가 렌더된다.
- 충족: 빈 상태에 제목 `아직 저장한 코스가 없어요`와 설명 `마음에 드는 코스를 저장하고 여기서 다시 볼 수 있어요`가 노출된다.
- 충족: `코스 만들러 가기` CTA가 보이고 활성화된다.
- 충족: CTA 클릭 시 `/course/new`로 이동한다.
- 충족: 공용 `Button`과 `Illustration`을 재사용하고 빈 상태 문구를 `shared/static/saved`로 분리했다.
- 충족: `SavedEmpty`를 saved feature public API로 노출하고 `SavedListScreen`에서 빈 목록 분기에 결선했다.
- 충족: e2e mock은 테스트 전용 access token에 한해 저장 코스 응답을 빈 배열로 반환한다.
- 충족: 단위 테스트 2건과 e2e 1건이 각각 빈 상태 표현과 CTA 이동을 검증한다.

## 변경 파일 요약 (수정 범위)
- Claude: `SavedEmpty` UI 구현, 공용 `Button`·`Illustration` 재사용, 정적 문구 분리, feature public API 및 빈 목록 화면 결선.
- Codex: 단위 테스트 2건, Playwright e2e 1건, e2e 전용 빈 저장 목록 mock token 분기 구현.
- 검증 owner: 앱/테스트 소스를 수정하지 않고 본 validation report만 추가했다.

## 실행 루프 요약 (작업 흐름 요약)
- loop type: `Quick Loop`
- 역할 분담: UI/디자인시스템 = Claude, 단위·e2e 테스트 및 mock 지원 = Codex
- 독립 확인: Claude가 관련 단위 테스트를 별도로 재실행해 동일하게 `2/2` 통과를 확인했다.
- evidence bundle: `UI Bundle + Validation Bundle`

## 실행한 검증 명령 (검증 커맨드)
- `npx vitest run src/features/saved/test/saved-empty.test.tsx` → 통과 (`1 file`, `2 tests`; `2/2`).
- Claude 독립 재실행 `npx vitest run src/features/saved/test/saved-empty.test.tsx` → 통과 (`2/2`).
- `npm run test:e2e -- src/e2e/saved/saved-empty.spec.ts` → 사용자 허가 하의 로컬 실행에서 통과 (`1/1`).
- `npx tsc --noEmit` → 통과.
- `npx eslint src/features/saved/ui/SavedEmpty.tsx src/widgets/saved/SavedListScreen.tsx src/shared/static/saved/index.ts src/features/saved/index.ts src/features/saved/test/saved-empty.test.tsx src/e2e/saved/saved-empty.spec.ts src/e2e/support/mock-backend-server.mjs` → 통과 (신규/변경 파일).

## Evidence Gate (증거 통과 여부)
- intent artifact: 통과 (사용자 inline Execution Spec 및 명시된 완료조건).
- tests: 통과 (단위 `2/2`, e2e `1/1`; 단위 테스트는 Claude 독립 재실행으로 교차 확인).
- typecheck: 통과 (`npx tsc --noEmit`).
- lint: 통과 (신규/변경 파일 ESLint).
- build: `not_run` — 별도 production build 실행 결과는 이번 소급 검증 evidence에 포함되지 않았다.
- runtime: 통과 — 사용자 허가 하에 샌드박스 밖 로컬 환경에서 실제 Playwright e2e를 실행해 빈 상태 노출, CTA 활성 상태, `/course/new` 이동을 확인했다.
- additional review: 통과 — 빈 목록 조건부 렌더링, feature export, 정적 문구, CTA route, 테스트 전용 mock 분기를 소스에서 직접 확인했다.

## 구조 / VSA 검토 결과 (아키텍처 판단)
- 빈 상태 표현과 CTA 동작은 `features/saved`에 위치하고, `widgets/saved`는 목록 유무에 따라 feature UI를 조합한다.
- 문구는 `shared/static/saved`에 분리됐고, 버튼과 일러스트는 기존 shared 디자인시스템 컴포넌트를 재사용한다.
- `SavedEmpty`는 `features/saved/index.ts` public API를 통해 widget에 제공되어 slice 경계를 유지한다.
- e2e 전용 빈 데이터 제어는 고정 테스트 token의 Authorization header에만 반응하며, 일반 mock 저장 목록 응답은 유지된다.

## Failure Taxonomy 또는 미검증 항목 (실패 분류 / 미검증)
- `environment_blocker`: Codex 샌드박스에서는 포트 listen 권한이 `EPERM`으로 거부되어 e2e를 실행할 수 없었다. 사용자 허가 하의 로컬 실제 실행에서 동일 e2e가 `1/1` 통과해 runtime evidence를 확보했다.
- `performance_note`: Next.js가 빈 상태 일러스트를 LCP 이미지로 감지해 `loading="eager"` 또는 `priority` 적용을 권장하는 경고 1건이 발생했다. assertion 및 e2e 결과에는 영향을 주지 않았다.
- `unverified`: production build는 실행하지 않았다.

## 남은 리스크 및 후속 작업 (후속 조치)
- 빈 상태 일러스트에 LCP 우선순위 속성이 적용되지 않아 초기 이미지 로딩 최적화 여지가 남아 있다. 실제 성능 측정에서 빈 상태 화면의 LCP 영향이 확인되면 `Illustration`의 이미지 전달 경로에서 `priority` 또는 `loading="eager"` 지원·적용을 검토한다.
- 이번 evidence에는 production build 결과가 없으므로 배포 전 표준 CI build gate에서 최종 확인한다.
