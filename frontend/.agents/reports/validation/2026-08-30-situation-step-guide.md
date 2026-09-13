# 코스 만들기 진행순서 안내 토스트 검증 리포트

## 작업 일시
- `2026-08-30`

## 의도 출처
- task_id: `2026-08-30-situation-step-guide`
- 의도: 코스 만들기(상황입력 위저드) 첫 진입 시 진행 순서(시간 → 장소 → 목적)를 안내 토스트로 노출한다.
- 입력: 사용자 handoff + 제시된 acceptance criteria (별도 task/SDD 파일 없음 — 소형 작업, inline 명세)

## 역할 분담 (멀티 에이전트)
- UI/디자인시스템 (Claude): 순서 안내 프레젠테이션 컴포넌트
- 비즈니스 로직 · 단위 테스트 · 검증 (Codex): 노출 조건 · persistence · 결선 · 테스트
- 본 리포트 기록: Claude 대행 (사유는 아래 "미검증/제약" 참고)

## 검증 대상
- `src/features/situation/ui/SituationStepGuide.tsx` (Claude, 프레젠테이션)
- `src/features/situation/index.ts` (Claude, 배럴)
- `src/widgets/situation/hooks/useSituationStepGuideVisibility.ts` (Codex, 노출 로직)
- `src/widgets/situation/hooks/useSituationStepGuideVisibility.test.ts` (Codex, 테스트)
- `src/widgets/situation/hooks/useSituationFlowController.ts` (Codex, 결선)
- `src/widgets/situation/SituationFlow.tsx` (Codex, 조건부 조합)
- `src/widgets/situation/css/SituationFlow.module.css` (Codex, 배치)

## 최종 결정
- `approved_with_notes`

## 완료 조건 확인
- 필수: 첫 스텝(`time`)에 새로 진입한 경우만 노출 — 충족 (`?step=...` explicit 진입·결과/코스 복귀는 미노출).
- 필수: 방문자당 1회만 노출 — 충족 (`dayro:course-new:situation-step-guide:v1` localStorage 키로 선점).
- 필수: SSR/hydration 안전 — 충족 (초기 상태 false, storage 접근은 client effect에서만).
- 필수: 자동 소멸 — 충족 (2000ms).
- 필수: Claude UI 컴포넌트 시각/마크업 불변 — 충족.

## 변경 파일 요약
- `SituationStepGuide.tsx`: 순서를 `SITUATION_STEPS`에서 파생해 디자인시스템 `Toast`(info)로 렌더. 프레젠테이션 전용.
- `useSituationStepGuideVisibility.ts`: 진입 판정 + persistence 선점 + 자동 소멸. storage 차단 시 fail-closed.
- `useSituationFlowController.ts`: `stepGuideVisible` boolean view state 결선.
- `SituationFlow.tsx`: `time` 화면에서 boolean에 따라 완성형 안내 Toast 조건부 조합.
- `SituationFlow.module.css`: 안내 토스트 화면 배치.

## 실행 루프 요약
- 루프 유형: `전체 루프`
- 반복 횟수: `1` (localStorage getter 자체가 예외를 던지는 privacy 환경 발견 후 보완)
- handoff 사용 여부: `yes` (Claude UI → Codex 로직·검증, 방식 A 경로 전달)
- 증거 묶음: `단위 테스트 + 타입체크 + 린트`

## 실행한 검증 명령
- `npx vitest run …/useSituationStepGuideVisibility.test.ts` → `11/11` 통과 (Codex 실행, Claude 독립 재실행 동일)
- `npx tsc --noEmit` → 통과 (Codex 실행, Claude 독립 재실행 동일)
- 신규/결선 파일 ESLint → 통과
- `git diff --check` → 통과

## 증거 Gate
- tests: 통과 (11/11)
- typecheck: 통과
- build: `npm run build` 최적화 단계에서 약 3분 정체 후 중단(exit 130) — 성공으로 간주하지 않음
- e2e: 미실행 (사용자 지시 없음)

## 구조 / VSA 검토 결과
- 브라우저 API(localStorage)와 effect는 widget 전용 controller hook에만 존재.
- feature UI(`SituationStepGuide`)는 상태 없는 순수 프레젠테이션으로 유지.
- widget은 boolean에 따라 feature UI를 조합. feature 배럴의 server-only 오염 없음.
- 경계 판정: 통과.

## 실패 분류 또는 미검증 항목
- 미검증: production build (정체로 미완료).
- 제약: Codex 샌드박스에서 `.agents`가 쓰기 불가로 판정되어 본 validation 리포트를 Codex가 직접 생성하지 못함 → Claude 대행 기록. (원인: 호출 시 cwd를 repo 루트가 아닌 `frontend`로 전달 + 샌드박스 보수적 처리. 후속 조치로 handoff 시 cwd=repo 루트 + `.agents` writable 부여 예정.)

## 남은 리스크 및 후속 작업
- production build 미확인 → 사용자 스모크 테스트 권장.
- 사용자가 localStorage를 삭제하면 안내가 재노출된다(설계상 허용 범위).
- 저장소 접근이 차단된 privacy 환경에서는 안내가 생략된다(fail-closed).
- 후속: Codex가 `.agents` 산출물까지 직접 기록할 수 있도록 handoff 호출 규약 정비.
