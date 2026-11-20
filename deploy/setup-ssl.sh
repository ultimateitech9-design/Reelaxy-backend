#!/usr/bin/env bash
# Get (or renew) the Let's Encrypt certificate for all Reelaxy domains,
# then switch nginx from the bootstrap config to the HTTPS config.
# Usage: setup-ssl.sh you@example.com      (first time)
#        setup-ssl.sh --renew              (cron)
set -euo pipefail

ROOT=/opt/reelaxy
COMPOSE=(docker compose --env-file "$ROOT/env/compose.env" -f "$ROOT/Reelaxy-backend/deploy/docker-compose.yml")
CERTBOT=(docker run --rm -v "$ROOT/certbot/conf:/etc/letsencrypt" -v "$ROOT/certbot/www:/var/www/certbot" certbot/certbot:latest)

if [[ "${1:-}" == "--renew" ]]; then
  "${CERTBOT[@]}" renew --webroot -w /var/www/certbot --quiet
  "${COMPOSE[@]}" exec -T nginx nginx -s reload
  exit 0
fi

EMAIL="${1:?usage: setup-ssl.sh you@example.com}"
"${CERTBOT[@]}" certonly --webroot -w /var/www/certbot \
  --cert-name reelaxy.com \
  -d reelaxy.com -d www.reelaxy.com -d api.reelaxy.com -d db.reelaxy.com \
  --email "$EMAIL" --agree-tos --no-eff-email --non-interactive

rm -f "$ROOT/nginx/conf.d/bootstrap.conf"
cp "$ROOT/Reelaxy-backend/deploy/nginx/reelaxy.conf" "$ROOT/nginx/conf.d/reelaxy.conf"
"${COMPOSE[@]}" exec -T nginx nginx -t
"${COMPOSE[@]}" exec -T nginx nginx -s reload
echo "HTTPS is live."
