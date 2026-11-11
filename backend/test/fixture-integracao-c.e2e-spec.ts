import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { Ocorrencia } from '../src/ocorrencias/ocorrencia.entity.js'
import { Evento } from '../src/eventos/evento.entity.js'

const senha = 'senha-fixture-etapa-c-4821'
const referencia = '2026-11-09T12:00:00.000Z'
const jwtSecret = 'segredo-fixture-c-com-mais-de-trinta-e-dois-bytes'

function env(databasePath: string): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'test', DATABASE_PATH: databasePath, PORT: '3001',
    JWT_SECRET: jwtSecret, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '20', LOGIN_JANELA_SEGUNDOS: '60', FIXTURE_SENHA: senha, FIXTURE_INSTANTE: referencia,
  }
}

describe('fixture de integração — etapa c', () => {
  let pasta: string

  afterEach(async () => {
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  it('grava 22 Ocorrências relativas à referência, com prazo, Evento de criação e uma excluída', async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-fixture-c-'))
    const caminhoBanco = join(pasta, 'integracao.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()

    const resultado = spawnSync(process.execPath, [
      'dist/src/testing/fixture-integracao/cli.js', '--etapa', 'c',
    ], { cwd: process.cwd(), env: env(caminhoBanco), encoding: 'utf8', timeout: 45_000 })
    expect(resultado.status).toBe(0)
    const manifesto = JSON.parse(resultado.stdout) as Record<string, any>
    expect(manifesto).toMatchObject({
      etapa: 'c', instanteReferencia: referencia,
      contagens: { setor: 2, usuario: 5, lanterna: 3, ocorrencia: 22, evento: 22, comentario: 0 },
    })
    expect(manifesto.ocorrencias).toHaveLength(22)
    expect(manifesto.eventos).toHaveLength(22)
    expect(manifesto.ocorrencias.filter((item: any) => item.excluidaEm !== null)).toHaveLength(1)
    const vencidas = manifesto.ocorrencias.filter((item: any) => item.vencida)
    expect(vencidas).toHaveLength(1)
    expect(vencidas[0].gravidade).toBe('critica')
    expect(manifesto.eventos.every((evento: any) => evento.tipo === 'criada' && evento.dados.de === null && evento.dados.para === 'aberta')).toBe(true)
    const ativas = manifesto.ocorrencias.filter((item: any) => item.excluidaEm === null)
    expect(ativas.length).toBeGreaterThan(20)
    expect(ativas[0].prazoEm).toBe('2026-11-09T06:00:00.000Z')

    const verificador = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await verificador.initialize()
    expect(await verificador.getRepository(Ocorrencia).count()).toBe(21)
    expect(await verificador.getRepository(Evento).count()).toBe(22)
    await verificador.destroy()
  }, 50_000)
})
