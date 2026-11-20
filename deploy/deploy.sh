#!/usr/bin/env bash
# Pull the latest code and rebuild/restart the Reelaxy services on the VPS.
# Usage: deploy.sh frontend|backend|all
# Called by GitHub Actions (through /opt/reelaxy/bin/gh-deploy) on every push to main.
set -euo pipefail

ROOT=/opt/reelaxy
TARGET="${1:-all}"
COMPOSE=(docker compose --env-file "$ROOT/env/compose.env" -f "$ROOT/Reelaxy-backend/deploy/docker-compose.yml")

case "$TARGET" in frontend|backend|all) ;; *) echo "usage: deploy.sh frontend|backend|all" >&2; exit 2 ;; esac

# One deploy at a time; a second push waits for the first to finish.
exec 9>"$ROOT/.deploy.lock"
flock 9

STATUS_DIR="$ROOT/status"
mkdir -p "$STATUS_DIR"
# Publish the status page itself (served by nginx at /deploy-status).
install -m 644 "$ROOT/Reelaxy-backend/deploy/status/index.html" "$STATUS_DIR/index.html"
status() { python3 "$ROOT/Reelaxy-backend/deploy/status/status.py" "$@" || true; }
targets=()
mark() { for t in "${targets[@]}"; do status "$t" "$@"; done; }
trap 'mark failed "${STEP:-deploy}"' ERR

pull() {
  echo "==> Updating Reelaxy-$1"
  git -C "$ROOT/Reelaxy-$1" fetch --quiet origin main
  git -C "$ROOT/Reelaxy-$1" reset --quiet --hard origin/main
  git -C "$ROOT/Reelaxy-$1" log --oneline -1
  targets+=("$1")
  status "$1" deploying "pull"
}

services=()
if [[ "$TARGET" == backend || "$TARGET" == all ]]; then pull backend; services+=(backend face); fi
if [[ "$TARGET" == frontend || "$TARGET" == all ]]; then pull frontend; services+=(frontend); fi

echo "==> Building: ${services[*]}"
STEP=build; mark deploying build
"${COMPOSE[@]}" build "${services[@]}"
echo "==> Starting"
STEP=start; mark deploying start
"${COMPOSE[@]}" up -d --remove-orphans

# Keep nginx routing in sync with the repo once HTTPS is set up.
if [[ -f "$ROOT/certbot/conf/live/reelaxy.com/fullchain.pem" ]]; then
  cp "$ROOT/Reelaxy-backend/deploy/nginx/reelaxy.conf" "$ROOT/nginx/conf.d/reelaxy.conf"
  STEP=nginx
  "${COMPOSE[@]}" exec -T nginx nginx -t && "${COMPOSE[@]}" exec -T nginx nginx -s reload
fi

trap - ERR
mark success done

docker image prune -f >/dev/null
echo "==> Deployed $TARGET at $(date -u +%FT%TZ)"
