#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Erro: Node.js 26 ou mais novo é necessário." >&2
  exit 1
fi

if ! node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 26 ? 0 : 1)"; then
  echo "Erro: Node.js 26 ou mais novo é necessário. Versão atual: $(node --version)" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Instalando dependências..."
  npm install
else
  echo "Dependências já instaladas."
fi

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo ".env.local criado a partir de .env.example."
fi

node <<'NODE'
const crypto = require('node:crypto')
const fs = require('node:fs')

const file = '.env.local'
let content = fs.readFileSync(file, 'utf8')
const secret = /^SESSION_SECRET=(?:troque-por-um-segredo-aleatorio|\s*)$/m

if (secret.test(content)) {
  content = content.replace(secret, `SESSION_SECRET=${crypto.randomBytes(32).toString('base64')}`)
  fs.writeFileSync(file, content)
  console.log('SESSION_SECRET gerado automaticamente.')
}
NODE

port_is_busy() {
  node -e "const net = require('node:net'); const socket = net.createConnection({ host: 'localhost', port: Number(process.argv[1]) }); socket.once('connect', () => { socket.destroy(); process.exit(0) }); socket.once('error', () => process.exit(1))" "$1" >/dev/null 2>&1
}

for port in 3000 3001; do
  if port_is_busy "$port"; then
    echo "Erro: a porta $port já está em uso. Encerre o servidor que a utiliza e tente novamente." >&2
    exit 1
  fi
done

api_pid=''
next_pid=''

cleanup() {
  status=$?
  trap - EXIT INT TERM
  if [ -n "$next_pid" ]; then kill "$next_pid" 2>/dev/null || true; fi
  if [ -n "$api_pid" ]; then kill "$api_pid" 2>/dev/null || true; fi
  exit "$status"
}

trap cleanup EXIT INT TERM

echo "Iniciando API em http://localhost:3001..."
node node_modules/json-server/lib/cli/bin.js --watch db.json --port 3001 &
api_pid=$!

echo "Iniciando aplicação em http://localhost:3000..."
node node_modules/next/dist/bin/next dev &
next_pid=$!

echo "Sistema disponível em http://localhost:3000"
echo "Pressione Ctrl+C para encerrar a aplicação e a API."

wait "$next_pid"
