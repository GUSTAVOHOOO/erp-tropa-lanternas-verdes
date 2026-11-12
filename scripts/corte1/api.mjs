// Sobe a API NestJS real para o E2E do Corte 1: banco SQLite novo, migrations e fixture de integração.
// Uso: node scripts/corte1/api.mjs  (exige `npm ci` e `npm run build` em backend/).
// Cada execução usa um arquivo SQLite próprio em uma pasta temporária, apagada no encerramento.
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const backend = join(raiz, 'backend')
const pasta = mkdtempSync(join(tmpdir(), 'corte1-api-'))
const manifesto = join(raiz, '.corte1', 'manifesto.json')
mkdirSync(dirname(manifesto), { recursive: true })
// A fixture não sobrescreve arquivo existente; cada execução grava o manifesto do próprio banco.
rmSync(manifesto, { force: true })

const ambiente = {
  ...process.env,
  NODE_ENV: 'development',
  PORT: process.env.CORTE1_API_PORT ?? '32134',
  DATABASE_PATH: join(pasta, 'integracao.sqlite'),
  JWT_SECRET: randomBytes(32).toString('hex'),
  JWT_EXPIRES_IN: '8h',
  CORS_ORIGIN: process.env.CORTE1_SITE_URL ?? 'http://127.0.0.1:32133',
  // O E2E faz muitos logins seguidos; o 429 do throttle é provado nos testes do provedor e do consumidor.
  LOGIN_LIMITE: '1000',
  LOGIN_JANELA_SEGUNDOS: '60',
  FIXTURE_SENHA: process.env.CORTE1_SENHA ?? 'senha-local-corte1',
}

function executar(rotulo, argumentos) {
  const resultado = spawnSync(process.execPath, argumentos, { cwd: backend, env: ambiente, stdio: 'inherit' })
  if (resultado.status !== 0) {
    console.error(`[corte1] ${rotulo} falhou (exit ${resultado.status})`)
    rmSync(pasta, { recursive: true, force: true })
    process.exit(1)
  }
}

executar('migrations', [join(backend, 'node_modules', 'typeorm', 'cli-ts-node-esm.js'), 'migration:run', '-d', 'src/database/data-source.ts'])
executar('fixture', [join(backend, 'dist', 'src', 'testing', 'fixture-integracao', 'cli.js'), '--etapa', 'e', '--saida', manifesto])

const api = spawn(process.execPath, [join(backend, 'dist', 'src', 'main.js')], { cwd: backend, env: ambiente, stdio: 'inherit' })

function encerrar() {
  api.kill()
}

api.on('exit', (codigo) => {
  rmSync(pasta, { recursive: true, force: true })
  process.exit(codigo ?? 0)
})
process.on('SIGINT', encerrar)
process.on('SIGTERM', encerrar)
