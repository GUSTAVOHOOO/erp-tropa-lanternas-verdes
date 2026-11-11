import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { Lanterna } from '../src/lanternas/lanterna.entity.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'

const senha = 'senha-fixture-etapa-b-4821'
const jwtSecret = 'segredo-fixture-b-com-mais-de-trinta-e-dois-bytes'

function env(databasePath: string): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'test', DATABASE_PATH: databasePath, PORT: '3001',
    JWT_SECRET: jwtSecret, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '20', LOGIN_JANELA_SEGUNDOS: '60', FIXTURE_SENHA: senha,
  }
}

describe('fixture de integração — etapa b', () => {
  let pasta: string

  afterEach(async () => {
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  it('cria fichas distintas em setores distintos e deixa uma conta sem ficha', async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-fixture-b-'))
    const caminhoBanco = join(pasta, 'integracao.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()

    const resultado = spawnSync(process.execPath, [
      'dist/src/testing/fixture-integracao/cli.js', '--etapa', 'b',
    ], { cwd: process.cwd(), env: env(caminhoBanco), encoding: 'utf8', timeout: 30_000 })
    expect(resultado.status).toBe(0)
    const manifesto = JSON.parse(resultado.stdout) as Record<string, any>
    expect(manifesto).toMatchObject({
      etapa: 'b', contagens: { setor: 2, usuario: 5, lanterna: 3 },
    })
    expect(manifesto.fichas.map(({ id }: { id: string }) => id)).toEqual([
      'fixture-hal-2814', 'fixture-kilowog-674', 'fixture-sem-setor',
    ])
    expect(manifesto.vinculos).toHaveLength(2)

    const verificador = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await verificador.initialize()
    const fichas = await verificador.getRepository(Lanterna).find()
    const contas = await verificador.getRepository(Usuario).find()
    expect(fichas.find(({ id }) => id === 'fixture-hal-2814')?.setorId).toBe(2814)
    expect(fichas.find(({ id }) => id === 'fixture-kilowog-674')?.setorId).toBe(674)
    expect(fichas.find(({ id }) => id === 'fixture-sem-setor')?.setorId).toBeNull()
    const l2814 = contas.find(({ email }) => email === 'l2814@fixture.invalid')
    const l674 = contas.find(({ email }) => email === 'l674@fixture.invalid')
    const semFicha = contas.find(({ email }) => email === 'lanterna-sem-ficha@fixture.invalid')
    expect(l2814).toMatchObject({ lanternaId: 'fixture-hal-2814', setorId: 2814 })
    expect(l674).toMatchObject({ lanternaId: 'fixture-kilowog-674', setorId: 674 })
    expect(semFicha).toMatchObject({ lanternaId: null, setorId: 2814 })
    await verificador.destroy()
  }, 20_000)
})
