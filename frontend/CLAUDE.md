# Claude 운영 규칙

이 프로젝트에서 Claude 앱은 `AGENTS.MD`와 `.agents` 디렉터리를 기준으로 작업한다.

## 시작 절차
작업을 시작하기 전에 다음 순서로 문서를 읽는다.

1. `AGENTS.MD`
2. 작업 성격에 맞는 `.agents/agents/*.md`
3. 해당 역할 문서에 명시된 `.agents/skills/*/SKILL.md`
4. 필요 시 `aiagent.yaml`

## 역할 문서
- 아키텍처 설계: `.agents/agents/architecture.md`
- 기능 구현: `.agents/agents/feature.md`
- 테스트 작성/실행: `.agents/agents/test.md`
- 최종 검증: `.agents/agents/validation.md`
- 도메인/VSA 경계: `.agents/domain/`

## 운영 기준
- MCP 서버는 `.mcp.json`에 정의된 것만 사용한다. (현재: `codex` — 아래 "MCP 서버" 섹션 참고)
- `aiagent.yaml`은 참고용 정책/온톨로지 문서로 사용한다.
- `.agents/onboarding.md`는 **사람용 온보딩 문서**다. Claude·Codex 모두 사용자가 명시적으로 지시하기 전에는 이 문서를 작업 참조로 읽지 않는다.
- 역할별 책임을 섞지 않는다.
- 각 역할은 자기 문서에 연결된 스킬만 사용한다.
- 디자인 의사결정은 하지 않는다.
- 프론트엔드 아키텍처는 VSA 기준을 따른다.

## Claude ↔ Codex 협업 흐름
- Claude는 UI/UX 구현, UI/UX 수정, 디자인 시스템 설계/구현/수정 owner다.
- 비즈니스 로직 설계/구현, 코드리뷰, 단위 테스트, 검증은 Codex owner다.
- Claude 작업 중 비즈니스 로직 경계 판단이 필요하면 `codex` MCP로 Codex architecture gate를 호출한다.
- Claude 작업 후 최종 검증이 필요하면 `codex` MCP로 Codex validation/review gate를 호출한다.
- Claude가 task coordinator인 경우에도 비즈니스 로직, 단위 테스트, 최종 approval은 Codex gate 없이 닫지 않는다.
- e2e 테스트는 사용자가 직접 확인하거나 명시적으로 명령할 때만 실행한다.
- Codex 호출이 pending approval 또는 연결 실패 상태면 `.agents/reports/handoffs/README.md` 기준으로 file-based handoff를 남긴다.
- Claude가 통제하는 경계 있는 토론(아래 "경계 있는 토론" 규칙, 최대 2라운드)은 허용한다. 단 Codex가 스스로 Claude를 재호출하는 무한 재귀 체인은 금지한다.

## 경계 있는 토론 (Bounded Debate)
프로젝트 **아키텍처(구조·경계)를 수정하는 작업**에 한해, Claude와 Codex가 서로 반박·보강해 최적안을 도출할 수 있다.

발동 조건 / 범위:
- 대상: `.agents`/`.claude` 프레임워크·폴더 구조, 레이어·슬라이스 경계(VSA), 파일 배치 규칙, 공용 승격, 크로스커팅 컨벤션 등 **구조·경계 결정**. (일반 기능 구현은 제외)
- AI가 "토론이 필요할 수 있다"고 판단하면 **바로 진행하지 말고**, 사용자에게 아래 3방식 중 택1을 묻는다.
  1. **토론**: Claude ↔ Codex 상호 반박·보강 → 최적안 도출 (2라운드)
  2. **독립 협의**: Claude 답변 → Codex 자문 → Claude 종합 (반박 없음)
  3. **바로 작업**: owner 에이전트(Claude=UI·디자인 / Codex=로직·검증)가 즉시 실행

토론(1) 선택 시 절차 (Claude가 사회자, 최대 2라운드):
- 라운드1: Claude 입장 A 제시 → Codex 반박/대안 B
- 라운드2: Claude 재반박·수정 A′ → Codex 재응답 B′
- 종합: Claude가 최종 최적안을 **사용자에게 제시**한다(사용자가 최종 결정).
- Claude가 매 홉을 통제한다. Codex는 스스로 Claude를 되부르지 않으며, 2라운드를 초과하지 않는다.

## Codex 리뷰 전달 방식 (A/B 규정)
Claude가 구현물을 Codex 리뷰/검증 gate로 넘길 때, 코드를 전달하는 방식은 아래 기준으로 **반드시** 선택한다. 임의 판단 금지.

정의:
- **방식 B (diff 전달)**: Claude가 `git diff`(또는 staged diff) 결과를 Codex 호출 프롬프트에 실어 보낸다. 바뀐 줄만 전달.
- **방식 A (경로 지정, Codex 직접 읽기)**: Claude는 변경된 파일 경로만 전달하고, Codex가 자기 도구로 해당 파일을 직접 읽는다.

선택 규정 (위에서부터 순서대로 적용, 먼저 걸리는 조건을 따른다):
1. **큰 파일에 소수 변경**(diff가 대상 파일 전체 대비 명백히 작음, 즉 diff÷파일크기 비율이 낮음) → **방식 B**. 변경 크기·세션 길이와 무관하게 항상 B가 유리하다.
2. 리뷰 후 **같은 세션에서 작업을 계속 이어갈 예정**이면 → **방식 A**. diff가 컨텍스트에 남아 남은 턴마다 재전송(재청구)되므로, 세션이 길수록 A가 유리하다.
3. 리뷰에 **변경 밖 맥락**(호출부·타입 정의·설정·인접 모듈 동작)이 필요하면 → **방식 A**.
4. **원샷 리뷰**(리뷰로 이 작업 흐름을 마무리) AND **변경 파일 ≤ 5개** AND **diff ≤ 400줄** → **방식 B**.
5. 그 외(큰 diff 등 위 조건에 안 걸리는 경우) → **방식 A**.

판단 근거: diff 절대 크기보다 **세션 길이(diff가 컨텍스트에 남는 턴 수)**와 **diff÷파일크기 비율**이 총비용을 더 크게 좌우한다. 그래서 "이어서 작업하냐(→A)"와 "큰 파일에 소수 변경이냐(→B)"를 크기 임계보다 먼저 판단한다.

하이브리드: 방식 B로 diff를 넘긴 뒤 Codex가 맥락 부족을 명시하면, Claude는 **Codex가 요청한 파일만** 경로로 추가 제공한다(부분 A). 전체를 통째로 다시 넘기지 않는다.

공통 규정:
- diff 전달 시 lock 파일, 빌드 산출물, 바이너리, 생성물(예: `*.lock`, `dist/`, 이미지)은 **제외**한다.
- Codex 호출 프롬프트에는 리뷰 관점을 **명시**한다: 버그 / 엣지케이스 / 보안 / 컨벤션(VSA 경계 포함) 중 해당 항목.
- Codex 응답은 Claude가 **요약해 반영**하고, 원문 리뷰 로그를 컨텍스트에 통째로 유지하지 않는다. 근거 보존이 필요하면 `.agents/reports/`에 파일로 남긴다.
- 위 방식으로 Codex를 호출할 수 없으면(pending approval·연결 실패) 방식을 바꾸지 말고 `.agents/reports/handoffs/README.md` 기준 file-based handoff로 전환한다.

## MCP 서버
이 프로젝트는 `codex` MCP 서버(OpenAI Codex CLI)를 팀 공용으로 사용한다. 설정은 `.mcp.json`에 커밋되어 공유되지만, 실행 환경과 인증은 각자 로컬에서 준비해야 한다.

팀원 셋업 (각자 1회):
1. Node.js(`npx`) 준비 — MCP 서버는 `.mcp.json`이 `npx -y @openai/codex@0.153.4 mcp-server`로 버전 고정 실행한다(별도 전역 설치 불필요, 첫 실행 시 npx가 내려받음).
2. 로그인: `npx -y @openai/codex@0.153.4 login` 또는 설치된 `codex login` (각자 본인 OpenAI/ChatGPT 계정 — API 키는 공유하지 않는다. 인증은 `~/.codex`에 저장돼 버전과 무관하게 공유된다)
3. `claude`를 처음 실행하면 project MCP 서버 신뢰 여부를 묻는다 → 승인
4. `/mcp`에서 `codex`가 `Connected`로 뜨면 사용 가능

주의:
- `.mcp.json`은 실행 명령만 공유한다. 로그인이 안 되어 있으면 호출이 실패한다.
- 인증은 개인별이며, 서로의 계정/키를 공유하지 않는다.
- **버전 고정 이유**: Codex CLI `0.154.0`부터 `mcp-server` 서브커맨드가 제거돼 `codex mcp-server`가 PROMPT 인자로 해석되고 즉시 종료된다. 반대로 `0.150.1` 이하는 현재 기본 모델 호출 시 "requires a newer version" 400 에러가 난다(2026-09-13 확인). 전역 `codex`(brew) 버전과 무관하게 동작하도록 npx로 `0.153.4`를 고정한다. 버전을 올릴 때는 `mcp-server` 지원 여부와 기본 모델 호출을 먼저 확인한다.
- MCP 서버 프로세스는 세션 시작 시 한 번 뜬다. CLI/버전을 바꾼 뒤에는 새 Claude 세션을 열어야 반영된다.

### Codex 핸드오프 호출 파라미터
Claude가 `codex` MCP로 구현·검증을 넘길 때, Codex가 코드뿐 아니라 `.agents` 산출물(validation report·run log 등)까지 **끝까지 직접 기록**할 수 있도록 아래를 기본값으로 사용한다.
- `cwd`: **repo 루트** (`.../develop/dayro`). `frontend` 하위로 주면 git 루트와 불일치해 Codex가 `.agents`를 read-only로 처리할 수 있다.
- `sandbox`: `workspace-write` (repo 밖은 쓰지 못한다).
- `approval-policy`: `never` (MCP 비대화 호출이라 `on-request`면 승인 대기에서 막힌다).

근거: cwd=`frontend` + `on-request`로 호출하면 Codex가 `.agents` 쓰기를 차단해 validation 리포트 기록이 실패한다(2026-08-30 확인, 위 파라미터로 해소). 단 `.agents` 자동 쓰기는 정합성 사고 위험이 있으므로, 커밋 전 Claude 또는 사람이 diff를 반드시 검토한다.

리포트 필수: 구현·검증 핸드오프 프롬프트에는 **검증 결과를 `.agents/reports/`에 리포트로 남기라는 지시를 항상 포함**한다. Full Loop(경계·계약·성능·주요 화면) 작업은 `.agents/reports/validation/<날짜>-<slug>.md` validation report를, 소형(Quick Loop) 작업도 최소 run log 한 편을 남긴다. 근거: 명시하지 않으면 Codex가 Quick/Full 판단에 따라 리포트를 생략해 생성이 들쭉날쭉하다(2026-08-31 확인 — 같은 세션에서 FAQ e2e는 리포트를 남기고 저장 빈 상태는 누락). 커밋 전 diff 검토 원칙은 동일하게 적용한다.

## UI/UX Skill Rule
- 사용자가 UI, UX, 레이아웃, spacing, hierarchy, typography, contrast, responsive behavior, component states, accessibility, design review, Figma 기반 구현을 요청하면 먼저 `ui-ux-pro-max` 스킬 사용 여부를 확인한다.
- 특히 로그인 화면, 랜딩 페이지, 대시보드, 폼, 버튼, 카드, 모달, 테이블, 네비게이션, 디자인 리뷰, 디자인 정제 요청에서는 `ui-ux-pro-max`를 우선 참조한다.
- 단, 이 규칙은 새로운 브랜드 방향이나 시각 콘셉트를 임의로 만드는 용도가 아니라, 제공된 시안과 현재 레이아웃을 검토하고 정제하는 용도에 한정한다.

## Figma Review Rule
- Figma 시안, 스크린샷, 기존 레이아웃이 제공된 경우 원본 의도, 구조, 정보 계층을 유지한다.
- 사용자가 명시적으로 재디자인을 요청하지 않으면 전체 레이아웃 방향을 바꾸지 않는다.
- 개선 범위는 spacing, hierarchy, contrast, typography, component states, consistency, accessibility, implementation quality 중심으로 제한한다.
- 지정되지 않은 요소가 있을 때는 새로운 스타일 방향을 발명하지 말고 최소한의 일관된 기본값만 제안한다.

## Minimal UI Rule
- 사용자가 담백한 화면, 과도하지 않은 디자인, 단순한 로그인 화면을 원하면 understated and clean 스타일을 우선한다.
- 불필요한 장식, 과한 애니메이션, 큰 레이아웃 변경은 피한다.
