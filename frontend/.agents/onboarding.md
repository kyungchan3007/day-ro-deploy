<!--
🚫 AI 작업 참조 금지 · 사람(팀원) 온보딩 전용
Claude와 Codex는 이 문서를 작업 참조로 읽지 않는다.
사용자가 명시적으로 "onboarding 읽어"라고 지시할 때만 읽는다.
-->

# 팀 온보딩 — Dayro 프론트엔드 멀티에이전트 개발

> ⚠️ **이 문서는 사람(신규 팀원)용 셋업 가이드입니다.**
> AI(Claude·Codex)는 이 문서를 작업 참조로 읽지 않습니다. 사용자가 명시적으로 지시할 때만 읽습니다.

---

## 1. 목적
- Dayro 프론트엔드는 **Claude(UI·디자인시스템)** 와 **Codex(비즈니스 로직·리뷰·테스트·검증)** 를 MCP로 연결한 멀티에이전트 방식으로 개발한다.
- 설정(`.mcp.json`)은 git으로 공유되지만, **실행 환경·인증은 각자 로컬에서 준비**해야 한다.

## 2. 사전 준비 (각자 1회)
- [ ] Codex CLI 설치: `brew install codex`
- [ ] 로그인: `codex login` (본인 OpenAI/ChatGPT 계정 — **API 키는 공유하지 않는다**)
- Claude Code는 이미 설치돼 있다고 가정한다.

## 3. MCP 연결
`.mcp.json`은 이미 공유되어 있다(실행 명령 `codex mcp-server`만 공유).
- [ ] 이 프로젝트에서 `claude`를 **처음 실행**하면 project MCP 서버 신뢰 여부를 묻는다 → **"Use this MCP server"(이 서버만 신뢰)** 선택 권장
- [ ] `/mcp`에서 `codex`가 **`✔ connected`** 로 뜨는지 확인
- (선택) 반대 방향(Codex→Claude)이 필요하면 개인 로컬에 등록: `codex mcp add claude -- claude mcp serve`

## 4. 하네스(Harness) 구성
하네스 = 작업을 선형 절차가 아니라 **evidence-gated loop**로 운영하는 실행 규칙. 원본은 `.agents/harness/`.

- **표준 작업 루프(7단계):** Intent Capture → Context Load → Plan·Boundary Decision → Implement → Self Check → Evidence Run → Validate
- **하위 축:** Loop / Tool·Environment / Eval / Observability / Guardrails
- **구성·수정 위치:**
  - 루프 단계·loop-back 규칙 → `.agents/harness/README.md`
  - 관측(run log·validation) 규칙 → `.agents/harness/observability.md`
  - evidence gate(작업 유형별 요구 증거) → 위 README의 *Eval Engineering* 섹션
- 공통 실행 규칙이 바뀌면 **`.agents/harness/`만** 수정한다(다른 문서에 중복 금지).

## 5. 온톨로지(Ontology) 구성
온톨로지 = `aiagent.yaml`의 **참고용 개념·정책 정의**. (강제 규칙이 아니라 참고 문서)

- **구조:**
  - `ontology.concepts` — Intent·Agent·Task·Artifact·Loop 등 개념과 그 types
  - `operating_policy` — 실행 모델, intent lifecycle 등 운영 정책
- **구성·수정 위치:**
  - 새 개념/타입 추가 → `ontology.concepts` 아래 항목 추가
  - 운영 정책(모드·lifecycle 등) 변경 → `operating_policy`
- ⚠️ `aiagent.yaml`은 **참고용**이다. 실제 강제 규칙의 원본은 `CLAUDE.md`·`AGENTS.MD`·`.agents/*` 문서이므로, 온톨로지와 규칙이 어긋나지 않게 **함께 갱신**한다.

## 6. 협업 방식 (요약 — 상세·강제 규칙은 `CLAUDE.md`)
- **역할:** Claude = UI/UX·디자인시스템 / Codex = 비즈니스 로직·리뷰·테스트·검증
- **핸드오프:** 한쪽이 구현 → 다른 쪽이 검증. 코드 전달은 A/B 규정(변경 크기·세션 지속·파일 비율)으로 선택.
- **경계 있는 토론:** 아키텍처(구조·경계) 수정 시, 필요하면 토론(2라운드)·독립협의·바로작업 중 **사용자가 선택**.
- **Codex 핸드오프 호출 파라미터:** `cwd=repo 루트`, `sandbox=workspace-write`, `approval-policy=never` (그래야 코드+`.agents` 기록까지 끝까지 가능).
- ※ 상세·강제 규칙은 반드시 **`CLAUDE.md`** 를 본다. (이 문서는 요약·포인터일 뿐)

## 7. 문제 해결
- **/mcp에서 codex가 안 뜨거나 연결 실패** → codex 설치·`codex login` 확인, 프로젝트 MCP 신뢰 승인 여부 확인.
- **Codex가 `.agents`에 기록 못 함(read-only)** → 호출 `cwd`를 **repo 루트**(`.../dayro`)로, `approval-policy=never`로. (`frontend` 하위 cwd면 차단될 수 있음)
- **`/course/new`에서 `fetch failed`** → 백엔드 미기동. `backend/dayro-backend`에서 `docker compose up -d` 후 `./gradlew bootRun`. (프론트 변경과 무관)

## 8. 검증 (재현 확인)
셋업이 끝나면 **로컬에서 검증 스크립트를 실행**해 결과 리포트를 남긴다. 로컬 상태(설치·로그인·MCP 승인)는 PR에 안 올라가므로, 이 결과 파일로 재현을 확인한다.

```bash
# frontend 루트에서
bash scripts/verify-onboarding.sh            # 핵심 3항목
bash scripts/verify-onboarding.sh 홍길동 --deep   # 이름 지정 + codex 왕복까지
```
- [ ] 종합 판정 **PASS** 확인 (항목 1~3 전부 PASS)
- [ ] 생성된 리포트(`.agents/reports/onboarding/<이름>-<날짜>.md`)를 **PR에 포함**해 리뷰어 확인
- 형식·의미·PR 기준은 `.agents/reports/onboarding/README.md` 참고.

## 9. 완료 체크리스트
- [ ] codex 설치·로그인 완료
- [ ] `/mcp`에서 codex `✔ connected`
- [ ] (선택) Codex→Claude 방향 등록
- [ ] `CLAUDE.md` 정독 (권위 규칙)
- [ ] 하네스·온톨로지 위치 파악 (`.agents/harness/`, `aiagent.yaml`)
- [ ] `bash scripts/verify-onboarding.sh` → PASS + 리포트 PR 포함
