#!/bin/bash
# Arrancar el servidor de desarrollo de Kyoszen
# Carga las variables de entorno y lanza Next.js

cd "$(dirname "$0")"

set -a
source .env.local
set +a

npm run dev
