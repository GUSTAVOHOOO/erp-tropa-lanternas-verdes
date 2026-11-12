#!/usr/bin/env bash
# Prepara e inicia o sistema completo: API NestJS (backend/, porta 3001) e front Next.js (porta 3000).
# Uso: npm run iniciar (Bash, Git Bash, WSL, macOS ou Linux). Ctrl+C encerra os dois.
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
  echo "Instalando dependências do front..."
  npm install
fi

if [ ! -d backend/node_modules ]; then
  echo "Instalando dependências da API..."
  (cd backend && npm install)
fi

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo ".env.local criado a partir de .env.example."
fi

if [ ! -f backend/.env ]; then
  # Segredo JWT aleatório e banco SQLite em caminho absoluto dentro de backend/data.
  node <<'NODE'
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

let content = fs.readFileSync('backend/.env.example', 'utf8')
content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`)
content = content.replace(/^DATABASE_PATH=.*$/m, `DATABASE_PATH=${path.resolve('backend/data/dev.sqlite')}`)
fs.writeFileSync('backend/.env', content)
console.log('backend/.env criado com JWT_SECRET aleatório.')
NODE
fi

port_is_busy() {
  node -e "const net = require('node:net'); const socket = net.createConnection({ host: 'localhost', port: Number(process.argv[1]) }); socket.once('connect', () => { socket.destroy(); process.exit(0) }); socket.once('error', () => process.exit(1))" "$1" >/dev/null 2>&1
}

for port in 3000 3001; do
  if port_is_busy "$port"; then
    echo "Erro: a porta $port já está em uso. Encerre o servidor que a utiliza e tente novamente." >&2
    exit 1
  fi
done

if [ ! -d backend/dist ]; then
  echo "Compilando a API..."
  (cd backend && npm run build)
fi

echo "Aplicando migrations e o seed de demonstração (idempotente)..."
(cd backend && npm run migration:run && npm run seed -- --etapa completa)

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

echo "Iniciando a API em http://localhost:3001..."
(cd backend && exec node dist/src/main.js) &
api_pid=$!

for _ in $(seq 1 60); do
  if port_is_busy 3001; then break; fi
  sleep 1
done

echo "Iniciando a aplicação em http://localhost:3000..."
node node_modules/next/dist/bin/next dev &
next_pid=$!

echo "Sistema disponível em http://localhost:3000"
echo "Contas de demonstração: ganthet@oa.tropa (Guardião), hal@oa.tropa e kilowog@oa.tropa (Lanternas); senhas em backend/README.md."
echo "Pressione Ctrl+C para encerrar a aplicação e a API."

wait "$next_pid"
