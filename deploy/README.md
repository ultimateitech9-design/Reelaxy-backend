# Reelaxy production deploy

Hostinger VPS (Ubuntu, Docker) at `201.18.193.124`, code in `/opt/reelaxy`.

| URL | Service |
|---|---|
| https://reelaxy.com (www redirects) | Next.js frontend |
| https://api.reelaxy.com | NestJS API + Socket.IO |
| https://db.reelaxy.com | phpMyAdmin (extra password prompt, then MySQL login) |
| `turn:201.18.193.124:3478` | coturn for audio/video calls |

## Layout on the VPS

```
/opt/reelaxy/
  Reelaxy-backend/      git clone (this repo; deploy/ has compose + nginx + scripts)
  Reelaxy-frontend/     git clone
  env/compose.env       MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, TURN_SECRET, PUBLIC_IP
  env/backend.env       backend .env (DB, JWT, SMTP, TURN, staff accounts ...)
  env/face.env          FACE_SERVICE_SECRET
  nginx/conf.d/         active nginx config (bootstrap.conf until SSL, then reelaxy.conf)
  nginx/htpasswd        login for db.reelaxy.com
  certbot/              Let's Encrypt certificates
  bin/gh-deploy         forced command for the GitHub Actions SSH key
```

Secrets are only in `/opt/reelaxy/env/` - never in git.

## Auto deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which SSHes to the VPS with the
`VPS_DEPLOY_KEY` secret. That key is locked in `authorized_keys` to `/opt/reelaxy/bin/gh-deploy`,
which only accepts `frontend` or `backend` and then runs `deploy/deploy.sh`:
pull the repo, `docker compose build`, `up -d`, reload nginx.

Repo secrets (both repos): `VPS_DEPLOY_KEY`, `VPS_KNOWN_HOSTS`, `VPS_HOST`.

The backend runs pending migrations on start (`NODE_ENV=production`).

## Common commands (on the VPS)

```bash
cd /opt/reelaxy/Reelaxy-backend/deploy
C="docker compose --env-file /opt/reelaxy/env/compose.env"
$C ps                          # status
$C logs -f backend             # logs
./deploy.sh all                # manual full deploy
$C exec backend npm run db:seed:core   # staff accounts + roles (first install)
./setup-ssl.sh --renew         # certificate renewal (also in root's crontab)
```
