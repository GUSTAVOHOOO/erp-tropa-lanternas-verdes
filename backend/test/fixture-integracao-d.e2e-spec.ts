import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { Evento } from '../src/eventos/evento.entity.js'
import { Lanterna } from '../src/lanternas/lanterna.entity.js'
import { Ocorrencia } from '../src/ocorrencias/ocorrencia.entity.js'

const senha = 'senha-fixture-etapa-d-4821'
const referencia = '2026-11-09T12:00:00.000Z'
const jwtSecret = 'segredo-fixture-d-com-mais-de-trinta-e-dois-bytes'

function env(databasePath: string): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'test', DATABASE_PATH: databasePath, PORT: '3001',
    JWT_SECRET: jwtSecret, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '20', LOGIN_JANELA_SEGUNDOS: '60', FIXTURE_SENHA: senha, FIXTURE_INSTANTE: referencia,
  }
}

describe('fixture de integração — etapa d', () => {
  let pasta: string

  afterEach(async () => {
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  it('monta status, responsabilidades e histórico por transições reais', async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-fixture-d-'))
    const caminhoBanco = join(pasta, 'integracao.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()

    const resultado = spawnSync(process.execPath, [
      'dist/src/testing/fixture-integracao/cli.js', '--etapa', 'd',
    ], { cwd: process.cwd(), env: env(caminhoBanco), encoding: 'utf8', timeout: 60_000 })
    expect(resultado.status).toBe(0)
    const manifesto = JSON.parse(resultado.stdout) as Record<string, any>
    expect(manifesto).toMatchObject({
      etapa: 'd', instanteReferencia: referencia,
      contagens: { setor: 2, usuario: 5, lanterna: 3, ocorrencia: 22, evento: 32, comentario: 0 },
    })
    const ocorrencias = new Map(manifesto.ocorrencias.map((item: any) => [item.id, item]))
    expect(ocorrencias.get('a0800000-0000-4000-8000-000000000001')).toMatchObject({ status: 'em_andamento', responsavelId: 'fixture-hal-2814' })
    expect(ocorrencias.get('a0800000-0000-4000-8000-000000000002')).toMatchObject({ status: 'em_andamento', responsavelId: 'fixture-hal-2814' })
    expect(ocorrencias.get('a0800000-0000-4000-8000-000000000003')).toMatchObject({ status: 'resolvida', responsavelId: 'fixture-hal-2814' })
    expect(ocorrencias.get('a0800000-0000-4000-8000-000000000004')).toMatchObject({ status: 'resolvida', setorId: 674, responsavelId: 'fixture-kilowog-674' })
    expect(manifesto.eventos.filter((evento: any) => evento.tipo === 'atribuida')).toHaveLength(4)
    expect(manifesto.eventos.filter((evento: any) => evento.tipo === 'status_alterado')).toHaveLength(4)
    expect(manifesto.eventos.filter((evento: any) => evento.tipo === 'resolvida')).toHaveLength(2)
    expect(manifesto.eventos.every((evento: any) => evento.criadoEm === referencia || evento.criadoEm < referencia)).toBe(true)

    const verificador = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await verificador.initialize()
    const hal = await verificador.getRepository(Lanterna).findOneByOrFail({ id: 'fixture-hal-2814' })
    const kilowog = await verificador.getRepository(Lanterna).findOneByOrFail({ id: 'fixture-kilowog-674' })
    expect(hal.status).toBe('em_missao')
    expect(kilowog.status).toBe('ativo')
    expect(await verificador.getRepository(Ocorrencia).count()).toBe(21)
    expect(await verificador.getRepository(Evento).count()).toBe(32)
    await verificador.destroy()
  }, 60_000)
})
