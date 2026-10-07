#!/usr/bin/env bash
#
# 온보딩 검증 스크립트
# 팀원이 로컬에서 실행해, Claude↔Codex 멀티에이전트 셋업이 재현됐는지 점검하고
# 결과를 커밋 가능한 리포트로 남긴다. (로컬 상태는 PR에 안 올라가므로, 이 결과 파일로 확인한다.)
#
# 사용법:
#   bash scripts/verify-onboarding.sh [이름] [--deep]
#     이름 : 생략하면 git user.name 사용
#     --deep : codex 실제 왕복(nonce)까지 검사 (선택, 강한 증명)
#
set -uo pipefail

# --- 인자 파싱 ---
NAME=""
DEEP=0
for arg in "$@"; do
  if [ "$arg" = "--deep" ]; then
    DEEP=1
  elif [ -z "$NAME" ]; then
    NAME="$arg"
  fi
done
[ -z "$NAME" ] && NAME="$(git config user.name 2>/dev/null || whoami)"

# --- 위치: 이 스크립트의 상위(frontend) = .mcp.json 있는 곳 ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$FRONTEND_DIR" || { echo "frontend 디렉터리로 이동 실패"; exit 1; }

DATE="$(date +%Y-%m-%d)"
TS="$(date '+%Y-%m-%d %H:%M:%S %z')"
REPORT_DIR=".agents/reports/onboarding"
SLUG="$(printf '%s' "$NAME" | tr ' /' '--' | tr '[:upper:]' '[:lower:]')"
REPORT="$REPORT_DIR/${SLUG}-${DATE}.md"
mkdir -p "$REPORT_DIR"

pass=0; fail=0; warn=0
ROWS=()

record() { # 항목  결과(PASS|FAIL|WARN)  상세
  ROWS+=("| $1 | $2 | $3 |")
  case "$2" in
    PASS) pass=$((pass+1)) ;;
    FAIL) fail=$((fail+1)) ;;
    WARN) warn=$((warn+1)) ;;
  esac
}

# 1) codex 설치
if v="$(codex --version 2>/dev/null)"; then
  record "codex 설치" "PASS" "$v"
else
  record "codex 설치" "FAIL" "codex 명령 없음 → brew install codex"
fi

# 2) codex 로그인(인증)
if s="$(codex login status 2>&1)" && printf '%s' "$s" | grep -qiE '^[[:space:]]*logged in'; then
  record "codex 로그인" "PASS" "$(printf '%s' "$s" | head -1)"
else
  record "codex 로그인" "FAIL" "로그인 안 됨 → codex login"
fi

# 3) MCP 연결 (실제 codex mcp-server 기동 + 핸드셰이크)
mcp="$(claude mcp list 2>/dev/null || true)"
if printf '%s' "$mcp" | grep -Ei 'codex.*(connected|✔)' >/dev/null 2>&1; then
  record "MCP 연결" "PASS" "codex connected"
else
  record "MCP 연결" "FAIL" "codex 미연결 → 설치·로그인·project MCP 승인 확인 (frontend/ 에서 실행)"
fi

# 4) (선택) codex 실제 왕복 — nonce echo
if [ "$DEEP" = "1" ]; then
  NONCE="DAYRO-$RANDOM$RANDOM$RANDOM"
  out="$(codex exec --sandbox read-only --ask-for-approval never \
        "설명 없이 이 토큰만 한 줄로 그대로 출력해: $NONCE" 2>/dev/null || true)"
  if printf '%s' "$out" | grep -q "$NONCE"; then
    record "codex 왕복(nonce)" "PASS" "nonce echo 확인 (모델 응답 실측)"
  else
    record "codex 왕복(nonce)" "WARN" "nonce 미확인 — codex exec 환경 확인 필요(핵심 게이트는 1~3)"
  fi
else
  record "codex 왕복(nonce)" "WARN" "미검사 (--deep 로 실행 시 강한 증명)"
fi

# --- 종합 판정: 1~3(핵심 게이트)만 PASS면 통과 ---
overall="PASS"; [ "$fail" -gt 0 ] && overall="FAIL"

# --- 리포트 파일 작성 ---
{
  echo "# 온보딩 검증 리포트 — $NAME"
  echo
  echo "- 실행 시각: \`$TS\`"
  echo "- 실행자: \`$NAME\`"
  echo "- 실행 머신: \`$(uname -s) $(uname -m)\`"
  echo "- 종합 판정: **$overall**  (PASS $pass · FAIL $fail · WARN $warn)"
  echo
  echo "| 항목 | 결과 | 상세 |"
  echo "|---|---|---|"
  for r in "${ROWS[@]}"; do echo "$r"; done
  echo
  echo "> 이 리포트는 \`scripts/verify-onboarding.sh\`가 로컬에서 자동 생성했다."
  echo "> 설치·로그인·MCP 승인 같은 로컬 상태는 PR에 올라가지 않으므로, 이 결과 파일로 재현을 확인한다."
  echo "> 항목 1~3이 핵심 게이트다. 4(nonce)는 선택적 강한 증명이며 WARN이어도 게이트를 막지 않는다."
} > "$REPORT"

# --- 콘솔 요약 ---
echo "════════════════════════════════════════"
echo " 온보딩 검증: $overall  (PASS $pass · FAIL $fail · WARN $warn)"
echo "════════════════════════════════════════"
for r in "${ROWS[@]}"; do echo "$r"; done
echo "리포트 저장: $FRONTEND_DIR/$REPORT"
echo "→ 이 파일을 PR에 포함해 리뷰어가 확인합니다."

[ "$fail" -gt 0 ] && exit 1
exit 0
