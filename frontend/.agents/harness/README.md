# Harness Engineering

이 디렉터리는 문서 집합이 아니라 실행 하네스의 운영 규칙을 정의한다.

## 목적
- 작업을 선형 절차가 아니라 evidence-gated loop로 운영한다.
- tool 실행, environment 제약, self-check, eval, validation을 같은 흐름으로 묶는다.
- 결과 보고뿐 아니라 실패 지점과 재시도 경로를 기록한다.

## 하위 축
- `Loop Engineering`
  - 어떤 단계로 작업을 순환시키고 어디서 loop back 하는지 정의한다.
- `Tool and Environment Engineering`
  - 어떤 도구를 어떤 원칙으로 고르고, 어떤 실행 환경 제약을 evidence에 반영할지 정의한다.
- `Eval Engineering`
  - 어떤 evidence를 어떤 작업 유형에서 요구할지와 승인 가능한 최소 근거를 정의한다.
- `Observability`
  - run log, validation report, summary artifact로 실행 흔적을 누적 관측한다.
- `Guardrails`
  - gate, 승인 필요 작업, boundary-confirmation 규칙을 정의한다.

## Tool and Environment Engineering
- 문서 탐색은 가능한 한 필요한 범위만 읽는다.
- evidence 명령은 실제 실행 가능한 환경을 기준으로 선택한다.
- 실행하지 못한 명령은 생략이 아니라 미실행 사유로 기록한다.
- tool 선택은 속도보다 증거 품질을 우선한다.

## Eval Engineering
- eval은 모델 평가 실험만 뜻하지 않는다.
- 이 저장소에서 eval은 task별 acceptance criteria를 어떤 evidence로 판정할지 설계하는 활동이다.
- validation은 최종 승인 판정이고, eval은 그 판정에 필요한 측정/증거 설계다.
- evidence는 가능한 한 작업 성격별 `evidence bundle`을 기본값으로 선택한다.

## 표준 작업 루프
모든 구현 작업은 아래 루프를 기본값으로 따른다.

1. `Intent Capture`
   - intent brief, solution notes, acceptance criteria를 정리한다.
2. `Context Load`
   - 역할 문서, 가이드, 도메인 문서를 읽는다.
3. `Plan and Boundary Decision`
   - VSA 배치, SSR/BFF/client 경계, shared 승격 여부를 정한다.
4. `Implement`
   - 최소 변경으로 구현한다.
5. `Self Check`
   - 역할 혼재, import graph, acceptance gap을 스스로 점검한다.
6. `Evidence Run`
   - 테스트, 타입체크, 빌드, 구조 리뷰 등 필요한 증거를 수집한다.
7. `Validate`
   - ValidationAgent 기준으로 최종 판정한다.
8. `Report`
   - final decision, 남은 리스크, 다음 액션을 기록한다.

## 단계별 Entry / Exit 기준

### 1. `Intent Capture`
- entry:
  - 작업 요청을 받음
- exit:
  - Execution Spec이 존재함
  - 중간 이상 작업이면 SDD 필요 여부가 판정됨
  - 큰 작업이면 PRD 필요 여부가 판정됨

### 2. `Context Load`
- entry:
  - Execution Spec이 존재함
- exit:
  - 역할 문서가 선택됨
  - 관련 guide trigger가 식별됨
  - 관련 domain 문서가 식별됨

### 3. `Plan and Boundary Decision`
- entry:
  - 관련 context 문서가 로드됨
- exit:
  - VSA 위치가 정해짐
  - SSR/BFF/client boundary가 정해짐
  - shared 승격 여부가 정해짐
  - 애매한 경계는 사용자 확인 또는 명시적 결정으로 닫힘

### 4. `Implement`
- entry:
  - boundary decision이 닫힘
- exit:
  - 변경이 code/doc로 반영됨
  - 변경 범위가 intent와 일치함

### 5. `Self Check`
- entry:
  - 구현이 끝남
- exit:
  - acceptance gap 여부가 점검됨
  - 역할 혼재와 import graph 오염 여부가 점검됨
  - 다음 단계로 넘길 self-check note 또는 동등한 요약이 존재함

### 6. `Evidence Run`
- entry:
  - self-check가 끝남
- exit:
  - loop 타입이 요구하는 최소 evidence가 수집됨
  - 실패한 명령이 있으면 원인과 조치가 기록됨
  - 구현 owner와 evidence 판정 owner가 다르면 handoff log 또는 동등한 인계 요약이 존재함

### 7. `Validate`
- entry:
  - 최소 evidence가 존재함
- exit:
  - `approved`, `approved_with_notes`, `rejected`, `blocked` 중 하나가 결정됨
  - failure taxonomy 또는 미검증 항목이 분류됨

### 8. `Report`
- entry:
  - validation decision이 존재함
- exit:
  - validation report가 기록됨
  - 필요 시 handoff log 또는 run log가 기록됨

## Guardrails
Guardrails는 실행 전후를 통제하는 최소 안전장치다.

### Gate 규칙
- `Intent Gate`:
  - acceptance criteria가 없으면 구현에 들어가지 않는다.
- `Boundary Gate`:
  - SSR/BFF/client 경계가 애매하면 구현 전에 사용자 확인이 우선이다.
- `Evidence Gate`:
  - 필요한 검증 명령 결과가 없으면 approved 계열 판정을 하지 않는다.
  - Claude가 UI/UX 또는 디자인 시스템 owner인 작업은 Codex가 evidence 판정 owner가 된다.
  - 구현자가 작성하거나 실행한 evidence는 최종 판정 전에 Codex가 재검토한다.
- `Report Gate`:
  - 리스크와 미검증 항목이 없다고 주장하려면 근거가 있어야 한다.

### Owner Separation 규칙
- 기본 운영에서 Codex는 비즈니스 로직 설계/구현, 코드리뷰, 단위 테스트, validation, review gate owner다.
- 기본 운영에서 Claude는 UI/UX 구현, UI/UX 수정, 디자인 시스템 설계/구현/수정 owner다.
- e2e 테스트는 사용자가 직접 확인하거나 명시적으로 명령할 때만 실행한다.
- 같은 runtime이 구현과 최종 검증을 모두 닫는 것은 fallback 상황에서만 허용한다.
- fallback을 사용하면 최종 보고에 사용 이유와 보완 evidence를 남긴다.

### MCP Invocation 규칙
- Claude와 Codex가 서로를 MCP로 호출할 수 있어도 task coordinator는 하나만 둔다.
- 호출받은 runtime은 요청받은 역할 output만 반환하고 recursive MCP 호출을 시작하지 않는다.
- MCP 연결 또는 승인 상태가 불완전하면 file-based handoff로 대체하고 사유를 evidence에 남긴다.
- MCP 호출 결과는 validation 전에 coordinator가 task state와 handoff contract에 반영한다.

### 승인 필요 작업
- 의존성 설치
- 파일 삭제
- 대규모 리팩터링
- 프로덕션 설정 변경
- 외부 네트워크 접근
- `git push`
- `git reset`
- `git clean`

## Loop 선택 기준
- `Quick Loop`
  - 파일 2개 이하 수정
  - 경계 판단이 이미 명확함
  - SSR/BFF/auth/session/shared UI/performance 영향이 없음
- `Full Loop`
  - 중간 이상 작업
  - BFF/API/auth/session/cookie 관련 작업
  - server/client boundary 변경
  - 공용 UI/API 계약 변경
  - 주요 진입 화면, 성능, 전역 구조 관련 작업

## Loop Back 규칙
- 구현 중 경계 충돌 발견:
  - `Plan and Boundary Decision`으로 되돌아간다.
- 테스트 실패:
  - `Implement` 또는 `Self Check`로 되돌아간다.
- acceptance gap 발견:
  - `Intent Capture` 또는 `Plan and Boundary Decision`으로 되돌아간다.
- validation reject:
  - reject 사유를 분류한 뒤 해당 단계로 되돌아간다.

## Quick Loop / Full Loop
- `Quick Loop`:
  - 로컬 수정 범위가 작고 리스크가 낮을 때 사용한다.
  - 시작 전에 아래 3가지를 닫는 경량 모드로 운영한다.
    - `intent brief 3줄 이내`
    - `self-check 3항목`
    - `evidence 1개 이상`
  - 최소 self-check + 관련 테스트 또는 필요한 구조 리뷰를 수행한다.
  - 필수 산출물:
    - Execution Spec
    - self-check note 또는 동등한 체크리스트
    - 관련 테스트 또는 구조 리뷰 근거
  - 권장 self-check 3항목:
    - acceptance criteria 충족 여부
    - boundary 또는 역할 혼재 여부
    - evidence 누락 여부
  - `Full Loop` 승격 조건:
    - 구현 중 boundary ambiguity가 새로 생김
    - 파일 3개 이상 수정으로 범위가 커짐
    - shared UI/API, SSR/BFF/auth/session/performance 영향이 확인됨
    - evidence 1개로 판정하기 어렵다고 드러남
- `Full Loop`:
  - SSR/BFF/auth/session/shared UI/performance/major screen 변경에 사용한다.
  - acceptance, boundary review, tests, typecheck, build, validation report를 모두 포함한다.
  - 최소 evidence:
    - Execution Spec
    - 필요 시 SDD / PRD
    - self-check note
    - 관련 테스트 결과
    - `typecheck`
    - `build` 또는 미실행 사유
    - validation report

## Evidence Bundle 기준
- evidence bundle은 task 성격별 기본 증거 묶음이다.
- bundle은 명령 강제가 아니라 기본값이며, 실행하지 못한 항목은 `미실행 사유`를 남긴다.
- `Doc Bundle`:
  - 문서 diff
  - 상호 참조 또는 키워드 검색
  - 수동 구조 리뷰
- `Quick Code Bundle`:
  - 관련 테스트 1개 이상 또는 구조 리뷰 1개 이상
  - 필요한 경우 대상 범위 타입체크 또는 추가 리뷰
- `UI Bundle`:
  - 관련 테스트
  - 시각 또는 구조 리뷰
  - 빌드 또는 미실행 사유
- `BFF Bundle`:
  - 관련 테스트
  - 타입체크
  - 빌드 또는 미실행 사유
  - 계약 또는 경계 리뷰
- `Validation Bundle`:
  - intent artifact 확인
  - evidence 명령 재검토 또는 추가 구조 리뷰
  - 미실행 항목 사유 기록

## 미실행 Evidence 기록 원칙
- evidence를 실행하지 못했으면 생략으로 끝내지 않는다.
- 아래 중 하나를 반드시 남긴다.
  - 실행 대상이 아닌 작업 유형임
  - 현재 환경 제약으로 실행 불가함
  - 범위상 불필요하지만 대체 리뷰 근거가 있음
- `approved` 또는 `approved_with_notes` 결론에서는 핵심 evidence의 미실행 사유가 판정 가능해야 한다.

## 판정별 최소 기준
- `approved`
  - required evidence가 모두 존재함
  - 미검증 항목이 없거나 경미한 참고 수준임
- `approved_with_notes`
  - 핵심 evidence는 존재함
  - 후속 작업 또는 제한적 리스크가 남아 있음
- `rejected`
  - acceptance criteria 미충족, 구조 위반, evidence 실패, 중요한 리스크가 존재함
- `blocked`
  - 같은 blocker로 meaningful progress가 불가능함
  - 사용자 입력 또는 외부 상태 변경이 필요함

## 출력물
- intent artifact
- code or doc changes
- evidence logs
- validation report
- run log
