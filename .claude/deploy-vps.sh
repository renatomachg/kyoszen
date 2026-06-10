#!/bin/bash
set -e

# Un solo deploy a la vez: evita builds solapados (causa del lock "Another next build process is already running")
exec 9>/tmp/kyoszen-deploy.lock
if ! flock -n 9; then
  echo "== Ya hay un deploy en curso. Saliendo."
  exit 0
fi

cd /home/kyoszen

echo == pull...
git pull origin main

echo == ecosystem.config.js...
if [ ! -f ecosystem.config.js ]; then
  cat > ecosystem.config.js << 'ECOEOF'
const fs = require('fs'), path = require('path');
const envFile = path.join(__dirname, '.env.local');
const env = {};
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  });
}
module.exports = {
  apps: [{
    name: 'kyoszen',
    script: 'npm',
    args: 'start',
    cwd: '/home/kyoszen',
    env: { NODE_ENV: 'production', PORT: 3000, ...env }
  }]
};
ECOEOF
  echo == creado.
fi

echo == limpiando builds colgados...
pkill -f 'next build' 2>/dev/null || true
sleep 1

echo == run build...
if ! npm run build; then
  echo "== build fallo: limpio .next y reintento una vez..."
  pkill -f 'next build' 2>/dev/null || true
  rm -rf .next
  npm run build
fi

echo == restart...
pm2 startOrRestart ecosystem.config.js --update-env
pm2 save --force
echo == completado.
