#!/usr/bin/env bash
# 백엔드 무중단(블루-그린) 배포 스크립트.
# 서버의 ~/dayro/deploy.sh 위치에서 ec2-user로 실행한다(compose.prod.yaml, Caddyfile, .env와 같은 디렉터리).
#
# 흐름: 새 색상 기동 → healthy 확인 → caddy가 새 색상을 가리키게 바꾸고 reload → 이전 색상 graceful 종료
#  - 새 색상이 healthy가 되지 못하면 새 색상만 치우고 종료한다. 이전 색상은 건드리지 않으므로 서비스는 계속된다.
#  - caddy reload는 graceful이라, 전환 순간 이전 색상으로 가던 요청은 끝까지 처리된다.
#  - 여러 번 실행해도 안전하다(매번 "지금 떠 있지 않은 색상"으로 배포한다).
#
# 환경변수
#   SKIP_PULL=1            이미지 pull을 건너뛴다(로컬 이미지로 검증할 때)
#   HEALTH_TIMEOUT_SEC=180 새 색상이 healthy가 될 때까지 기다리는 최대 시간
#   COMPOSE_FILE           compose 파일 목록(기본 compose.prod.yaml, 여러 개면 콜론으로 구분)
set -euo pipefail

cd "$(dirname "$0")"
export COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"

HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-180}"
UPSTREAM_DIR="caddy-upstream"
UPSTREAM_FILE="$UPSTREAM_DIR/active.caddy"
CADDY_CONTAINER="dayro-caddy"
# 블루-그린 도입 전의 단일 백엔드 컨테이너 - 첫 배포 때 활성으로 간주하고, 전환이 끝나면 제거한다
LEGACY_CONTAINER="dayro-backend"
# 이전 색상 종료 대기(초) - compose의 stop_grace_period와 맞춘다
STOP_TIMEOUT_SEC=35

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

is_running() {
    [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]
}

# 현재 트래픽을 받고 있는 색상. caddy가 가리키는 색상을 우선하되, 실제로 떠 있는지까지 확인한다
active_color() {
    local color=""
    if [ -f "$UPSTREAM_FILE" ]; then
        color=$(grep -oE 'backend-(blue|green)' "$UPSTREAM_FILE" | head -1 | sed 's/^backend-//' || true)
        if [ -n "$color" ] && is_running "dayro-backend-$color"; then
            echo "$color"
            return
        fi
    fi
    for color in blue green; do
        if is_running "dayro-backend-$color"; then
            echo "$color"
            return
        fi
    done
    if is_running "$LEGACY_CONTAINER"; then
        echo "legacy"
        return
    fi
    echo "none"
}

write_upstream() {
    # 같은 디렉터리 안에서 mv로 교체해 caddy가 반쯤 쓰인 파일을 읽는 일이 없게 한다
    printf 'reverse_proxy %s:8080\n' "$1" > "$UPSTREAM_FILE.tmp"
    mv "$UPSTREAM_FILE.tmp" "$UPSTREAM_FILE"
}

# caddy가 active.caddy 디렉터리를 마운트한 상태로 떠 있는지 - 아니면 reload로는 전환할 수 없다
caddy_ready_for_reload() {
    is_running "$CADDY_CONTAINER" &&
        docker inspect -f '{{range .Mounts}}{{.Destination}} {{end}}' "$CADDY_CONTAINER" | grep -q '/etc/caddy/upstream'
}

health_status() {
    docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$1" 2>/dev/null || echo "missing"
}

ACTIVE=$(active_color)
if [ "$ACTIVE" = "blue" ]; then
    NEW="green"
else
    NEW="blue"
fi
NEW_SERVICE="backend-$NEW"
NEW_CONTAINER="dayro-backend-$NEW"
log "배포 시작 - 현재 활성: $ACTIVE, 새로 띄울 색상: $NEW"

# docker가 마운트 경로를 먼저 만들면 root 소유가 되어 ec2-user가 active.caddy를 쓸 수 없다
mkdir -p "$UPSTREAM_DIR"

if [ "${SKIP_PULL:-0}" != "1" ]; then
    log "이미지 pull"
    docker compose --profile "$NEW" pull "$NEW_SERVICE"
fi

# 설정이 그대로면 아무 일도 하지 않는다. compose.prod.yaml에서 DB/Redis 설정이 바뀐 경우에만 재생성된다
log "postgres/redis 확인"
docker compose up -d postgres redis

log "$NEW_SERVICE 기동"
docker compose --profile "$NEW" up -d --no-deps --force-recreate "$NEW_SERVICE"

log "$NEW_SERVICE healthy 대기(최대 ${HEALTH_TIMEOUT_SEC}초)"
deadline=$((SECONDS + HEALTH_TIMEOUT_SEC))
while true; do
    status=$(health_status "$NEW_CONTAINER")
    if [ "$status" = "healthy" ]; then
        break
    fi
    if [ "$status" = "unhealthy" ] || [ "$status" = "exited" ] || [ "$status" = "missing" ] || [ "$SECONDS" -ge "$deadline" ]; then
        log "실패 - $NEW_SERVICE 상태: $status. 새 색상을 정리하고 기존($ACTIVE)을 유지한다"
        docker compose --profile "$NEW" logs --tail 80 "$NEW_SERVICE" || true
        docker compose --profile "$NEW" rm -sf "$NEW_SERVICE" || true
        exit 1
    fi
    sleep 3
done
log "$NEW_SERVICE healthy"

PREVIOUS_UPSTREAM=""
if [ -f "$UPSTREAM_FILE" ]; then
    PREVIOUS_UPSTREAM=$(cat "$UPSTREAM_FILE")
fi
write_upstream "$NEW_SERVICE"

if caddy_ready_for_reload; then
    # caddy 네트워크에서 새 색상이 실제로 보이는지 먼저 확인한다(컨테이너 안 healthcheck만으로는 네트워크 문제를 못 잡는다)
    if ! docker exec "$CADDY_CONTAINER" wget -q -O /dev/null -T 5 "http://$NEW_SERVICE:8080/health"; then
        log "실패 - caddy에서 $NEW_SERVICE 에 접근할 수 없다. 전환하지 않는다"
        if [ -n "$PREVIOUS_UPSTREAM" ]; then
            printf '%s\n' "$PREVIOUS_UPSTREAM" > "$UPSTREAM_FILE"
        fi
        docker compose --profile "$NEW" rm -sf "$NEW_SERVICE" || true
        exit 1
    fi
    log "caddy 전환 → $NEW_SERVICE (reload)"
    if ! docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
        # reload가 실패하면 caddy는 이전 설정으로 계속 동작한다. 파일만 되돌리고 새 색상을 치운다
        log "실패 - caddy reload 실패. 이전 설정을 유지한다"
        if [ -n "$PREVIOUS_UPSTREAM" ]; then
            printf '%s\n' "$PREVIOUS_UPSTREAM" > "$UPSTREAM_FILE"
        fi
        docker compose --profile "$NEW" rm -sf "$NEW_SERVICE" || true
        exit 1
    fi
else
    # 첫 배포이거나, 블루-그린 도입 전 caddy(active.caddy 마운트 없음)인 경우. caddy를 새 설정으로 (재)생성한다.
    # 기존 caddy가 떠 있었다면 이 순간 1~2초 끊긴다 - 최초 전환 때 한 번만 발생한다
    log "caddy (재)생성 → $NEW_SERVICE"
    docker compose up -d caddy
fi

# reload 직후 이전 색상으로 막 들어간 요청이 자리 잡을 여유
sleep 2

case "$ACTIVE" in
    blue | green)
        log "이전 색상 backend-$ACTIVE 종료(graceful, 최대 ${STOP_TIMEOUT_SEC}초)"
        docker compose --profile "$ACTIVE" stop -t "$STOP_TIMEOUT_SEC" "backend-$ACTIVE"
        docker compose --profile "$ACTIVE" rm -f "backend-$ACTIVE"
        ;;
    legacy)
        log "블루-그린 도입 전 컨테이너 $LEGACY_CONTAINER 종료·제거(graceful, 최대 ${STOP_TIMEOUT_SEC}초)"
        docker stop -t "$STOP_TIMEOUT_SEC" "$LEGACY_CONTAINER"
        docker rm "$LEGACY_CONTAINER"
        ;;
esac

# 배포마다 받은 이전 이미지가 쌓여 디스크를 채우지 않게, 태그 없는(dangling) 이미지만 정리한다
docker image prune -f > /dev/null

log "배포 완료 - 활성 색상: $NEW"
