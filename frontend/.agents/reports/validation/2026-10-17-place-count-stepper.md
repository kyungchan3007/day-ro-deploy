# 장소 수 스테퍼 검증 리포트

- 일시: 2026-10-17
- 대상: Dayro-dev/dayro #247 (QA #9), `feat/#247-place-count-stepper`
- 기준: `36ac45f` → `904b248`, `1d10f8b` (HEAD)
- 작업 유형: 검증 / 코드 리뷰, method A(파일 직접 읽기)
- 최종 결정: **approved_with_notes**

## 판정

SDD에 명시된 **다음 CTA에서 저장하는 방식**을 기준으로 차단할 기능 결함은 발견하지 않았다. 2~5곳·기본 3곳, 단계 이동 시 answers 저장, 저장된 값 복원, 기존 스냅샷 호환, API 미전송 및 좁은 handoff 진입점은 요구에 부합한다. 아래 접근성 보완과 저장 범위 명확화는 후속 조치가 필요하다. 실제 스크린리더·시각 렌더링까지 검증한 승인은 아니다.

## Findings (심각도)

### F1 — P3: 일반 span의 aria-label 대신 명확한 상태 의미를 제공할 것

- 위치: `src/features/situation/ui/PlaceCountStepper.tsx:47–54`
- 현재 값은 일반 `span`에 `aria-live="polite"`, `aria-label="장소 N곳"`을 붙인다. 일반 span의 implicit generic 역할은 accessible naming이 금지되어 있어 이 label의 스크린리더 노출에 의존하면 안 된다. `aria-live`만으로 naming이 허용되는 역할이 생기지는 않는다.
- 숫자와 “곳”은 실제 텍스트로 남아 있으므로 값 자체가 전혀 전달되지 않는다고 판단하지는 않는다. 다만 getByLabelText / Playwright accessible-name assertion 통과는 실제 보조기기 읽기 계약의 증명이 아니다.
- 권고: `output` 또는 `role="status"` 등 적절한 의미와 원자적인 상태 전달을 사용하고, 필요한 “장소” 문맥도 실제 접근 가능한 텍스트로 제공한다. 키보드 조작 및 VoiceOver 등으로 값 변경 읽기를 확인한다.

### F2 — P3: 로그인·새로고침 복원은 다음 CTA로 확정한 값에 한정됨

- 위치: `src/widgets/situation/SituationTimeScreen.tsx:80–91`, `src/widgets/situation/hooks/useSituationFlowController.ts:127–130`, `src/features/situation/hooks/usePlaceCountStep.ts:20`
- 첫 시간 화면에서 3→4로 바꾼 뒤 다음을 누르지 않고 메뉴 로그인으로 이동하면 local state인 4는 인계되지 않는다. rev가 없으면 handoff는 아무것도 하지 않는다. 이미 저장된 시간 화면에서도 4→5로 수정 후 로그인하면 기존 rev의 4만 인계된다. 즉시 새로고침도 같은 제한이다.
- SDD는 CTA 시 저장을 명시하므로 이를 신규 차단 결함으로 판정하지 않았다. PRD의 “로그인 복귀 시 복원”은 **저장된 값**이라는 범위를 명확히 해야 한다. 현재 편집 중 값까지 보존하려면 별도 draft 또는 새 snapshot/rev 인계가 필요하며 기존 rev를 덮어써서는 안 된다.
- 현재 신규 e2e는 다음→화면 뒤로→새로고침만 검증하며 로그인 왕복을 직접 검증하지 않는다.

### F3 — P3: 프로토타입 아이콘의 실제 선 굵기는 조금 다름

- 위치: `src/shared/ui/icon/Icon.tsx:24`, `src/shared/ui/icon/icons.tsx:259–275`, `src/features/situation/ui/PlaceCountStepper.tsx:45,62`
- 시안은 16×16 viewBox, stroke 2, 선 길이 10이다. 공용 IconBase는 24×24 viewBox를 16px로 축소하므로 strokeWidth=2의 실제 선은 약 1.33px, 길이는 약 9.33px이다.
- 전체 구조·크기는 일치하나 픽셀 단위 동일 구현은 아니다. 공용 아이콘 체계 재사용에 따른 경미한 차이로 기록한다.

## Acceptance Criteria 및 경계 확인

| 항목 | 결과 / 근거 |
| --- | --- |
| 2~5, 기본 3, 양 끝 비활성 | 순수 모델·함수형 state updater·native disabled 확인, 관련 테스트 통과 |
| answers.placeCount 저장 | setTime에서 기존 answers를 spread하고 time/placeCount를 새 스냅샷에 전달 |
| 이전 스냅샷 호환 | optional 필드이므로 placeCount 없음 허용, 화면에서 3으로 해석 |
| 저장된 값 복원 | schema가 필드를 보존하고 화면에 전달. 화면 뒤로→새로고침 e2e 코드 확인 및 사용자 제공 통과 결과 |
| 로그인 handoff | 기존 hook 그대로 재export. snapshot 전체 직렬화→parse→merge 경로에서 placeCount 유지. 미확정 draft는 F2 |
| 브라우저 뒤/앞 | append가 새 rev를 만들고 기존 rev를 수정하지 않음. 브라우저 뒤로는 과거 값, 화면 뒤로는 최신 answers를 가진 새 snapshot이라는 기존 의미 유지 |
| 같은 time 화면의 rev 교체 | 훅 initial은 mount 시만 사용. 일반 단계 왕복은 화면 교체로 remount되나, time→time 직접 rev 교체는 별도 UI 검증 없음 |
| POST /api/situations 미전송 | buildSituationRequest는 startTime/endTime/districtId/purpose만 명시적으로 구성. 새 unit·e2e 검증 확인 |
| 접근성 | section/h2 연결, 버튼 이름, type=button, disabled, 장식 SVG aria-hidden, 2px focus-visible 확인. live 영역은 F1 |
| 시안 | 문구, 24px 상단 간격, 박스 77px/16px/12px, 버튼 40px, gap 6px, 값 최소폭 64px, 22px 숫자/15px 단위, 그림자/pressed scale 일치. 설명색 #767676은 SDD의 의도적인 대비 보완 |

### 잘못된 저장값의 실제 경로

직접 parseCourseFlowSnapshot과 resolvePlaceCount를 호출했다.

| 저장값 | 결과 |
| --- | --- |
| 없음 | 스냅샷 유지, 화면 기본 3 |
| 1 / 9 | 스냅샷 유지, 화면 2 / 5로 보정 |
| 0 / -1 / 2.5 / 문자열 "4" / null | 스냅샷 전체 검증 실패 |

따라서 resolvePlaceCount의 방어 로직이 모든 손상 저장값을 복구하는 것은 아니다. 전체 state에서는 해당 revision만 제외되고, handoff에서는 해당 기록을 버린다. 기존 손상 snapshot 폐기 정책과 일관되며 정상 UI는 이런 값을 만들지 않는다. 다른 answers까지 유지해야 하는 정책이라면 필드 단위 정규화를 별도로 설계해야 한다. 신규 테스트는 이 parser 경계를 직접 다루지 않으므로 회귀 테스트 보강을 권장한다.

## 구조 / VSA / 공용 UI

- 순수 수량 규칙은 model, React state는 hook, 마크업은 UI, 화면 조합은 widget에 배치되어 있다.
- `features/situation/handoff.ts`는 feature 소유의 명시적 공개 진입점이다. 다른 slice가 내부 hook 파일을 직접 참조하지 않으며, UI 배럴 대신 동일 hook과 type-only export를 제공한다. 새로운 server-only 의존성은 없다.
- `features/course-map/test/save-analytics.test.ts`의 mock 경로 변경도 새 진입점과 일치한다. 이 테스트는 저장 analytics 검증이며 handoff 통합 테스트 자체는 아니다.
- `--shadow-control`은 globals와 token-catalog 양쪽에 등록되어 있고 CSS는 토큰을 소비한다.
- 기존 AppShell/Button/Container/StepProgress 및 IconBase를 재사용한다. 수량 도메인 UI는 feature에 유지하여 불필요한 shared 승격을 피했다. 네이티브 원형 버튼은 전용 수량 컨트롤의 크기·disabled·focus 계약을 구현한다.
- index.ts 주석의 “이 배럴을 통해서만”은 새 narrow entry 예외를 설명하도록 갱신하는 것이 좋다. feature-local story는 task에 명시된 산출물이며 현재 Storybook guide의 feature 제외 문구와는 정리가 필요하다.

## Evidence

직접 실행:

1. `npx vitest run src/features/situation/test/place-count.test.ts src/features/situation/test/course-flow.test.ts src/features/situation/test/course-flow-handoff.test.ts src/features/course-map/test/save-analytics.test.ts`
   - **4 files / 31 tests passed**, exit 0.
2. `node scripts/check-route-bundle-budget.mjs`
   - 기존 로컬 빌드 산출물 기준 전 라우트 예산 통과, exit 0.
   - `/saved`, `/saved/[id]`, `/share/course`: 각각 **663669B**.
   - `/course/new`: **639057B**.
   - 이전 689557B는 사용자 제공 기준치이며, 이전 커밋을 재빌드하지 않았다. 차이는 25888B(약 25.9KB).
3. Node + TypeScript in-memory transpile로 위 저장값 행렬 확인, exit 0. 최초 시도는 `@/` alias 미해석으로 실패했으며 alias resolver 적용 후 성공했다. 소스/테스트 파일은 추가하지 않았다.
4. 지정된 파일, 두 커밋 diff, 프로토타입 `pc-stepper` CSS·장소 수 markup·stepPlace JS 직접 비교.

사용자/Claude 제공 결과(이번 리뷰에서 전체 재실행하지 않음): tsc OK, eslint 0 errors, vitest 146 files / 1065 tests, Playwright 96 pass, next build OK. e2e는 요청에 실행 지시가 없어 재실행하지 않았다. Storybook play, 실제 브라우저 키보드/포커스, 스크린리더, 스크린샷 시각 비교는 not_run이다. CSS/마크업 대조를 실제 렌더 검증으로 표현하지 않는다.

## Intent 및 적용 문서

Intent source: `.agents/intent/{prd,sdd,tasks}/2026-10-17-place-count-stepper.md`. 핵심 기준은 UI+상태만, 다음 CTA 저장, 2~5/기본3, 예전 snapshot 호환, API 미전송이다.

| 읽은 문서 | 판단에 반영한 내용 |
| --- | --- |
| `AGENTS.MD`, `.agents/README.md`, `intent/README.md`, `intent/active/index.md` | 검증 역할·기준 문서 선택·기존 변경 보존 |
| `agents/validation.md`, `reports/README.md` | source 변경 금지, severity/evidence/판정 기록 |
| `guides/accessibility.md` | 시맨틱·이름·disabled·focus·상태 전달 |
| `guides/client-logic-separation.md` | UI/hook/model 책임 분리 |
| `guides/server-client-boundary.md` | 공개 엔트리의 client-safe graph |
| `guides/storybook.md` | 기본/최소/최대 및 상호작용 story 검토 |
| `domain/course-situation.md` | step/rev 상태 복원과 immutable snapshot 정책 |
| `harness/README.md`, `harness/observability.md` | 직접 실행과 인계 evidence 구분, 미검증 기록 |
| `skills/verification-before-completion/SKILL.md` | 직접 실행한 범위만 통과로 주장 |
| `skills/next-best-practices/SKILL.md` 및 bundling 문서 | bundle graph 검토 |
| `skills/vercel-react-best-practices/SKILL.md` 및 bundle-barrel-imports | narrow entry와 지연 의존성 검토 |

남은 문서 불일치: `guides/performance.md` 없음, active index가 #230을 가리킴, 도메인 answers 목록에 placeCount 없음, 위 index/Storybook 설명 불일치. 이번 요청의 명시적 intent를 우선했다. BFF 구현과 사람용 onboarding 문서는 범위 밖이다. 추가 사용자 확인은 필요하지 않았다.

## 실행 루프 / 최종 상태

- Full Loop의 독립 validation 단계, 1회 검토, 구현 수정·재시도 없음.
- handoff: 사용자 제공 Claude 변경/검증 요약. Evidence bundle: Validation + UI 구조 리뷰.
- Evidence Gate: 제한된 범위에서 충족. 전체 빌드·e2e는 인계 결과이며 위 미검증 범위를 유지한다.
- taxonomy: `doc_mismatch`, `missing_evidence`(실제 AT/시각 검증), 경미한 접근성 개선 사항.
- 후속: F1 접근성 의미 보완, F2 저장 범위 문서화, 손상값·login·browser history 테스트 보강.
- 사용자 지정 산출물 하나에 run summary도 포함했다. 수정 문서는 이 보고서뿐이며 source는 변경하지 않았다. 시작부터 존재한 `frontend/AGENTS.MD` 변경은 건드리지 않았다.

## 2차 확인 — 217ecd6 (2026-10-17)

### 최신 판정: approved

이번 판정은 앞선 1차 판정을 대체한다. F1~F3가 모두 반영되었으며, 해당 수정 범위에서 새로운 차단 결함은 발견하지 않았다. 아래 결론은 코드·문서 직접 검토와 명시한 실행 증거 범위에 한정한다.

| 항목 | 확인 결과 | 상태 |
| --- | --- | --- |
| F1 접근성 | 일반 span의 aria-label 제거. `output`의 implicit `status` 역할, `aria-live="polite"`, `aria-atomic="true"`를 사용한다. `sr-only`의 `valuePrefix`("장소") + 공백 + 숫자 + "곳"으로 상태 텍스트 전체를 제공한다. e2e는 이름 있는 region 안의 status 텍스트, story는 status 텍스트를 확인하도록 변경되어 잘못된 accessible-name 의존도 제거되었다. | 해소 |
| F2 저장 범위 | PRD 목표·성공 기준과 SDD 저장 시점에 다음 CTA에서 확정, 편집 중 값은 로그인 왕복·새로고침 미보존을 명시했다. 화면 뒤로가기와 브라우저 뒤로가기의 불변 snapshot 의미도 구분한다. 기존 구현과 일치하며 정책 변경은 없다. | 해소 |
| F3 아이콘 | 24 viewBox에서 path 시작 4.5, 길이 15, strokeWidth 3을 16px로 렌더한다. 배율 16/24 적용 시 시작 3, 길이 10, 선 굵기 2가 되어 시안의 기하 수치와 일치한다. Plus의 세로 선에도 동일하게 적용된다. | 해소 |

### 2차 검증 evidence

- `git diff 1d10f8b 217ecd6`로 해당 UI·static·아이콘·story·e2e·PRD·SDD 변경을 직접 대조했다. 수량 규칙·저장 로직·요청 계약·handoff 진입점 변경은 없다.
- `rg`로 관련 경로의 기존 `valueLabel` 사용이 제거되고 `valuePrefix`로 연결됨을 확인했다.
- 직접 재실행: `npx vitest run src/features/situation/test/place-count.test.ts src/features/situation/test/course-flow.test.ts src/features/situation/test/course-flow-handoff.test.ts src/features/course-map/test/save-analytics.test.ts` → **4 files / 31 tests passed**, exit 0. 이 단위 테스트 결과를 수정된 story/e2e의 실행 결과로 취급하지 않는다.
- 직접 재실행: `node scripts/check-route-bundle-budget.mjs` → 로컬 빌드 산출물 기준 전 라우트 예산 통과, exit 0. `/saved`, `/saved/[id]`, `/share/course` 각각 **663675B**, `/course/new` **639117B**. 1차 대비 각각 +6B, +60B로 예산 이내다.
- 사용자 제공 Claude evidence: tsc·eslint 오류 0, vitest 1065, e2e 96, build·예산 통과. 전체 suite·타입체크·린트·빌드는 이번 2차에서 중복 실행하지 않았다.
- 실제 스크린리더 음성 출력, 브라우저 포커스, 픽셀 스크린샷 대조 및 Storybook play는 이번에도 not_run. F1은 의미 구조의 수정, F3는 SVG 수치 일치로 확인했으며 실제 AT/시각 검증 완료를 주장하지 않는다.

### 기준 / 범위 / 후속

- Intent source: 같은 task의 갱신된 PRD·SDD와 기존 tasks. AC는 2~5/기본3, CTA 확정값 복원, API 미전송이며 변경되지 않았다.
- 적용 문서·스킬은 1차의 검증·접근성·상태 분리·경계·evidence 기준을 이어 사용했다. 이번에는 보고서, 갱신된 PRD·SDD 및 커밋 diff를 다시 읽어 F1~F3 종결 여부에 반영했다.
- UI/static/shared icon/story 변경이므로 접근성·Storybook·공용 UI 기준이 적용된다. BFF 구현과 사람용 onboarding은 이번에도 범위 밖이다. 요청과 기준 문서의 충돌은 없으며 추가 사용자 확인도 필요하지 않았다.
- VSA와 공용 IconBase 재사용은 유지된다. 새 state/effect/API 의존성이 UI에 추가되지 않았다.
- 1차의 손상 저장값 정책, 추가 로그인/history 회귀 테스트 권고, 저장소 문서 정리 사항은 참고 후속으로 남는다. F1~F3 미해결 사항으로 보지 않으며 이번 수정의 차단 사유도 아니다.
- 실행 루프: 독립 validation 2차, 소스 수정 없이 검토·관련 테스트·예산 검사·보고. 새로운 failure taxonomy 없음. Evidence Gate 통과(위 미실행 범위 명시).
- 수정한 문서는 이 보고서 하나다. 기존 `frontend/AGENTS.MD` 변경은 그대로 보존했다.
