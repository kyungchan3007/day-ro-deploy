# 온보딩 검증 리포트

팀원이 온보딩(Claude↔Codex 셋업)을 완료한 뒤, `scripts/verify-onboarding.sh`가 로컬 환경을 점검해 이 디렉터리에 결과 리포트를 생성한다.

설치·로그인·MCP 승인 같은 **로컬 상태는 PR에 올라가지 않으므로**, 이 결과 리포트를 커밋해 **재현 여부를 PR에서 확인**한다.

## 생성 방법
```bash
# frontend 루트에서
bash scripts/verify-onboarding.sh            # 핵심 3항목 검증
bash scripts/verify-onboarding.sh 홍길동 --deep   # 이름 지정 + codex 왕복까지
```
- 파일명: `<이름-slug>-<날짜>.md`
- 종합 판정이 `PASS`면 스크립트 exit 0, `FAIL`이면 exit 1.

## 리포트 형식 (스크립트가 자동 생성)
```md
# 온보딩 검증 리포트 — <이름>

- 실행 시각: `YYYY-MM-DD HH:MM:SS +0900`
- 실행자: `<이름>`
- 실행 머신: `Darwin arm64`
- 종합 판정: **PASS**  (PASS 4 · FAIL 0 · WARN 0)

| 항목 | 결과 | 상세 |
|---|---|---|
| codex 설치 | PASS | codex-cli x.y.z |
| codex 로그인 | PASS | Logged in using ChatGPT |
| MCP 연결 | PASS | codex connected |
| codex 왕복(nonce) | PASS | nonce echo 확인 |
```

## 검증 항목의 의미
| 항목 | 무엇을 증명하나 |
|---|---|
| codex 설치 | `codex` CLI가 PATH에 있음 |
| codex 로그인 | 본인 계정으로 인증됨(키 비공유) |
| **MCP 연결** | `claude mcp list`가 실제 `codex mcp-server`를 띄워 핸드셰이크 성공 → 설치+로그인+**project MCP 승인**+프로세스 배선이 그 PC에서 모두 맞음 (핵심 게이트) |
| codex 왕복(nonce) | (선택) codex가 난수를 그대로 되돌려줌 → 모델 응답까지 실측 (강한 증명) |

## PR 확인 기준
- 리포트의 **종합 판정이 PASS**이고 항목 1~3이 모두 PASS여야 한다.
- 4(nonce)는 선택적 강한 증명이며 `WARN`이어도 게이트를 막지 않는다.

## 한계 (정직 고지)
- 이 리포트는 **자가 신고(self-attestation)**다. 커밋 파일은 위조 가능하므로 신뢰 기반이며, 강한 보증이 필요하면 `--deep`(nonce 왕복)으로 난이도를 올린다.
- **CI로는 자동화 불가** — CI에는 각자의 codex 개인 로그인이 없어 서버가 뜨지 않는다. 그래서 로컬 실행 + 결과 커밋 방식을 쓴다.
