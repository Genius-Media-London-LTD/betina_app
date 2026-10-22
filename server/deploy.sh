#!/usr/bin/env bash
# Deploy BETina's server code to betina-server.
#   ./server/deploy.sh          -> ship API code + config, install deps, restart
# Requires the "betina-server" SSH host alias (~/.ssh/config).
set -euo pipefail
cd "$(dirname "$0")"

HOST=betina-server
VERSION="$(git rev-parse --short HEAD)$(git diff --quiet -- . || echo '-dirty')"

echo "==> shipping api ($VERSION)"
tar -C api -cz --exclude node_modules . | ssh "$HOST" '
  set -e
  id betina >/dev/null 2>&1 || useradd --system --home /opt/betina-api --shell /usr/sbin/nologin betina
  mkdir -p /opt/betina-api /etc/betina
  rm -rf /opt/betina-api.new && mkdir /opt/betina-api.new
  tar -xz -C /opt/betina-api.new
'

echo "==> config"
cat deploy/betina-api.service | ssh "$HOST" 'cat > /etc/systemd/system/betina-api.service'
cat deploy/Caddyfile        | ssh "$HOST" 'cat > /etc/caddy/Caddyfile'

echo "==> install + switch + restart"
ssh "$HOST" "
  set -e
  cd /opt/betina-api.new && npm install --omit=dev --no-audit --no-fund --loglevel=error
  touch /etc/betina/api.env && chmod 600 /etc/betina/api.env && chown root:root /etc/betina/api.env
  grep -q '^BETINA_API_VERSION=' /etc/betina/api.env \
    && sed -i 's/^BETINA_API_VERSION=.*/BETINA_API_VERSION=$VERSION/' /etc/betina/api.env \
    || echo 'BETINA_API_VERSION=$VERSION' >> /etc/betina/api.env
  rm -rf /opt/betina-api.old
  [ -d /opt/betina-api ] && mv /opt/betina-api /opt/betina-api.old
  mv /opt/betina-api.new /opt/betina-api
  chown -R root:root /opt/betina-api
  systemctl daemon-reload
  systemctl enable betina-api >/dev/null 2>&1
  systemctl restart betina-api
  caddy validate --config /etc/caddy/Caddyfile >/dev/null && systemctl reload caddy
  sleep 2
  systemctl is-active betina-api
  curl -fsS http://127.0.0.1:3000/health
"
echo
echo "==> done"
