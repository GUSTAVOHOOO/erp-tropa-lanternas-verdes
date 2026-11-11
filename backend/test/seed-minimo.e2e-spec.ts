import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { IDS_SEED_MINIMO } from '../src/database/seed/ids.js'
import { Setor } from '../src/setores/setor.entity.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'

const senhaDemo = 'guardiao123'
const jwtSecret = 'segredo-de-seed-minimo-com-mais-de-trinta-e-dois-bytes'

function env(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'development', PORT: '3001', DATABASE_PATH: databasePath,
    JWT_SECRET: jwtSecret, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '20', LOGIN_JANELA_SEGUNDOS: '60', ...extras,
  }
}

function executar(args: string[], ambiente: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, ['dist/src/database/seed/seed.js', ...args], {
    cwd: process.cwd(), env: ambiente, encoding: 'utf8', timeout: 30_000,
  })
}

describe('seed mínimo', () => {
  let pasta: string
  let caminhoBanco: string

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-seed-minimo-'))
    caminhoBanco = join(pasta, 'dev.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()
  })

  afterAll(async () => {
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  it('é idempotente, cria Guardião com hash bcrypt e só limpa em development local explícito', async () => {
    for (let rodada = 0; rodada < 2; rodada += 1) {
      const resultado = executar(['--etapa', 'minima'], env(caminhoBanco))
      expect(resultado.status).toBe(0)
    }
    let banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    expect(await banco.getRepository(Setor).count()).toBe(3)
    expect(await banco.getRepository(Usuario).count()).toBe(1)
    let usuario = await banco.getRepository(Usuario)
      .createQueryBuilder('usuario').addSelect('usuario.senhaHash').getOneOrFail()
    expect(usuario).toMatchObject({
      id: IDS_SEED_MINIMO.guardiao, email: 'ganthet@oa.tropa', papel: 'guardiao', setorId: null,
    })
    expect(usuario.senhaHash).not.toBe(senhaDemo)
    expect(await bcrypt.compare(senhaDemo, usuario.senhaHash)).toBe(true)
    await banco.destroy()

    const prod = executar(['--limpar', '--etapa', 'minima'], env(caminhoBanco, { NODE_ENV: 'production' }))
    expect(prod.status).not.toBe(0)
    expect(prod.stderr).toContain('proibido em produção')

    const relativo = executar(['--limpar', '--etapa', 'minima'], env('dev.sqlite'))
    expect(relativo.status).not.toBe(0)
    expect(relativo.stderr).toContain('DATABASE_PATH absoluto')

    const limpo = executar(['--limpar', '--etapa', 'minima'], env(caminhoBanco))
    expect(limpo.status).toBe(0)
    banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    expect(await banco.getRepository(Setor).count()).toBe(3)
    expect(await banco.getRepository(Usuario).count()).toBe(1)
    usuario = await banco.getRepository(Usuario)
      .createQueryBuilder('usuario').addSelect('usuario.senhaHash').getOneOrFail()
    expect(usuario.id).toBe(IDS_SEED_MINIMO.guardiao)
    await banco.destroy()
  }, 20_000)
})
