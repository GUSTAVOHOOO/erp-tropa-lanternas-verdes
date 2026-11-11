import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { Lanterna } from '../src/lanternas/lanterna.entity.js'
import { LanternasRepository } from '../src/lanternas/lanternas.repository.js'
import { Ocorrencia } from '../src/ocorrencias/ocorrencia.entity.js'
import { OcorrenciasRepository } from '../src/ocorrencias/ocorrencias.repository.js'
import { SetoresRepository } from '../src/setores/setores.repository.js'
import { Setor } from '../src/setores/setor.entity.js'
import { IDS_FIXTURE_INTEGRACAO_B } from '../src/testing/fixture-integracao/ids.js'
import { IDS_FIXTURE_INTEGRACAO_A } from '../src/testing/fixture-integracao/ids.js'

const senha = 'senha-e2e-dashboard-4821'
const segredo = 'segredo-e2e-dashboard-com-mais-de-trinta-e-dois-bytes'

function env(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'development', PORT: '3001', DATABASE_PATH: databasePath,
    JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '30', LOGIN_JANELA_SEGUNDOS: '60', ...extras,
  }
}

function executarFixture(databasePath: string): void {
  const resultado = spawnSync(process.execPath, ['dist/src/testing/fixture-integracao/cli.js', '--etapa', 'b'], {
    cwd: process.cwd(), env: env(databasePath, { FIXTURE_SENHA: senha }), encoding: 'utf8', timeout: 30_000,
  })
  if (resultado.status !== 0) throw new Error(`Fixture falhou: ${resultado.stderr}`)
}

async function portaLivre(): Promise<number> {
  const servidor = createServer()
  await new Promise<void>((resolve, reject) => servidor.once('error', reject).listen(0, '127.0.0.1', resolve))
  const endereco = servidor.address()
  if (!endereco || typeof endereco === 'string') throw new Error('Não foi possível reservar porta')
  await new Promise<void>((resolve, reject) => servidor.close((erro) => erro ? reject(erro) : resolve()))
  return endereco.port
}

function lanterna(id: string, codinome: string, setorId: number | null) {
  return {
    id, codinome, identidadeCivil: null, especie: null, planetaNatal: null, setorId,
    status: 'ativo' as const, anoIngresso: null, primeiraAparicao: null,
    habilidades: [], mentorId: null, citacao: null, biografia: null, fontes: {},
  }
}

function ocorrencia(
  setorId: number,
  status: Ocorrencia['status'],
  gravidade: Ocorrencia['gravidade'],
  criadaEm: Date,
  options: { resolvidaEm?: Date; responsavelId?: string | null; excluida?: boolean } = {},
) {
  return {
    id: randomUUID(), titulo: 'Caso do Dashboard', tituloBusca: 'caso do dashboard',
    descricao: 'Ocorrência usada pela fixture isolada do Dashboard.', planeta: 'Terra', setorId,
    gravidade, status, envolvidos: 1, responsavelId: options.responsavelId ?? null,
    resolucao: status === 'resolvida' ? 'Resolvida na fixture do Dashboard.' : null,
    criadaPorId: IDS_FIXTURE_INTEGRACAO_A.guardiao, criadaEm,
    resolvidaEm: options.resolvidaEm ?? null,
    excluidaEm: options.excluida ? new Date() : null,
  }
}

describe('Dashboard HTTP', () => {
  let pasta: string
  let processo: ChildProcess | undefined
  let url: string
  let gToken: string
  let l2814Token: string
  let l674Token: string
  let hoje: Date

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-dashboard-'))
    const caminhoBanco = join(pasta, 'dashboard.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()
    executarFixture(caminhoBanco)

    const dados = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await dados.initialize()
    hoje = new Date()
    const meiaNoiteUtc = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()))
    const ocorrencias = new OcorrenciasRepository(dados.getRepository(Ocorrencia))
    const lanternas = new LanternasRepository(dados.getRepository(Lanterna))
    const setores = new SetoresRepository(dados.getRepository(Setor))
    await setores.salvar({ id: 0, nome: 'Setor 0', descricao: 'Setor vazio para teste agregado.' })

    for (let indice = 1; indice <= 12; indice += 1) {
      const id = `dashboard-lanterna-${String(indice).padStart(2, '0')}`
      await lanternas.salvar(lanterna(id, `Lanterna ${String(indice).padStart(2, '0')}`, 2814))
    }

    await ocorrencias.salvar(ocorrencia(2814, 'aberta', 'critica', new Date(hoje.getTime() - 48 * 3_600_000)))
    await ocorrencias.salvar(ocorrencia(2814, 'aberta', 'baixa', new Date(hoje.getTime())))
    await ocorrencias.salvar(ocorrencia(2814, 'em_andamento', 'alta', new Date(hoje.getTime() - 10 * 86_400_000)))

    for (let indice = 1; indice <= 12; indice += 1) {
      const id = `dashboard-lanterna-${String(indice).padStart(2, '0')}`
      const resolvidaEm = indice === 12
        ? new Date(meiaNoiteUtc.getTime() - 10 * 86_400_000)
        : new Date(meiaNoiteUtc.getTime() + 12 * 3_600_000)
      const duracao = indice % 2 === 0 ? 48 : 24
      await ocorrencias.salvar(ocorrencia(
        2814, 'resolvida', indice % 2 === 0 ? 'media' : 'critica',
        new Date(resolvidaEm.getTime() - duracao * 3_600_000), { resolvidaEm, responsavelId: id },
      ))
    }
    await ocorrencias.salvar(ocorrencia(
      2814, 'resolvida', 'alta',
      new Date(meiaNoiteUtc.getTime() - 2 * 86_400_000 - 36 * 3_600_000),
      { resolvidaEm: new Date(meiaNoiteUtc.getTime() - 2 * 86_400_000), responsavelId: 'dashboard-lanterna-01' },
    ))
    await ocorrencias.salvar(ocorrencia(
      2814, 'resolvida', 'baixa', new Date(hoje.getTime() - 100 * 3_600_000),
      { resolvidaEm: new Date(hoje.getTime() - 4 * 3_600_000), responsavelId: 'dashboard-lanterna-01', excluida: true },
    ))

    await ocorrencias.salvar(ocorrencia(
      674, 'resolvida', 'alta', new Date(hoje.getTime() - 60 * 3_600_000),
      { resolvidaEm: new Date(hoje.getTime() - 24 * 3_600_000) },
    ))
    for (let indice = 0; indice < 4; indice += 1) {
      const resolvidaEm = new Date(hoje.getTime())
      const criadaEm = new Date(resolvidaEm.getTime() - 1.125 * 3_600_000)
      await ocorrencias.salvar(ocorrencia(0, 'resolvida', 'media', criadaEm, { resolvidaEm }))
    }
    await dados.destroy()

    const porta = await portaLivre()
    url = `http://127.0.0.1:${porta}`
    processo = spawn(process.execPath, ['dist/src/main.js'], {
      cwd: process.cwd(), env: env(caminhoBanco, { PORT: String(porta) }), stdio: ['ignore', 'ignore', 'pipe'],
    })
    let stderr = ''
    processo.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
    const limite = Date.now() + 20_000
    while (Date.now() < limite) {
      try {
        if ((await fetch(`${url}/saude`)).ok) break
      } catch { /* API inicializando */ }
      if (processo.exitCode !== null) throw new Error(`API encerrou: ${stderr}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    gToken = await token('guardiao@fixture.invalid')
    l2814Token = await token('l2814@fixture.invalid')
    l674Token = await token('l674@fixture.invalid')
  }, 30_000)

  afterAll(async () => {
    if (processo && processo.exitCode === null) {
      processo.kill()
      await new Promise<void>((resolve) => processo!.once('exit', () => resolve()))
    }
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  async function token(email: string): Promise<string> {
    const resposta = await fetch(`${url}/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })
    const corpo = await resposta.json() as { dados: { token: string } }
    if (!resposta.ok) throw new Error('Não foi possível autenticar a fixture do Dashboard')
    return corpo.dados.token
  }

  async function consultar(query = '', tokenAtual?: string) {
    const resposta = await fetch(`${url}/dashboard${query}`, {
      headers: tokenAtual ? { authorization: `Bearer ${tokenAtual}` } : {},
    })
    const texto = await resposta.text()
    return { status: resposta.status, corpo: texto ? JSON.parse(texto) as Record<string, any> : undefined }
  }

  it('agrega o histórico inteiro, a série UTC preenchida, o arredondamento e o ranking limitado', async () => {
    const resposta = await consultar('?dias=7', gToken)
    expect(resposta.status).toBe(200)
    expect(resposta.corpo.dados).toMatchObject({
      porStatus: { aberta: 2, em_andamento: 1, resolvida: 18 },
      porGravidade: { baixa: 1, media: 10, alta: 3, critica: 7 },
      vencidas: 2,
      tempoMedioResolucaoHoras: 28.25,
    })
    const dados = resposta.corpo.dados as {
      serie: Array<{ dia: string; abertas: number; resolvidas: number }>
      ranking: Array<{ lanternaId: string; resolvidas: number }>
    }
    expect(dados.serie).toHaveLength(7)
    const ultimoDia = dados.serie.at(-1)?.dia
    const primeiroDiaEsperado = new Date(`${ultimoDia}T00:00:00.000Z`)
    primeiroDiaEsperado.setUTCDate(primeiroDiaEsperado.getUTCDate() - 6)
    expect(dados.serie[0]?.dia).toBe(primeiroDiaEsperado.toISOString().slice(0, 10))
    expect(dados.serie.at(-1)?.dia).toBe(new Date().toISOString().slice(0, 10))
    expect(dados.serie.reduce((total, ponto) => total + ponto.abertas, 0)).toBe(19)
    expect(dados.serie.reduce((total, ponto) => total + ponto.resolvidas, 0)).toBe(17)
    expect(dados.serie.some(({ abertas, resolvidas }) => abertas === 0 && resolvidas === 0)).toBe(true)
    expect(dados.ranking).toHaveLength(10)
    expect(dados.ranking.map(({ lanternaId }) => lanternaId)).toEqual([
      'dashboard-lanterna-01', 'dashboard-lanterna-02', 'dashboard-lanterna-03', 'dashboard-lanterna-04',
      'dashboard-lanterna-05', 'dashboard-lanterna-06', 'dashboard-lanterna-07', 'dashboard-lanterna-08',
      'dashboard-lanterna-09', 'dashboard-lanterna-10',
    ])
    expect(dados.ranking[0]?.resolvidas).toBe(2)
  })

  it('aplica setor opcional para Guardião e força o setor autenticado para Lanternas', async () => {
    const setor2814 = await consultar('?setor=2814', gToken)
    if (setor2814.status !== 200) throw new Error(JSON.stringify(setor2814))
    expect(setor2814.corpo.dados).toMatchObject({
      porStatus: { aberta: 2, em_andamento: 1, resolvida: 13 }, vencidas: 2,
      tempoMedioResolucaoHoras: 36,
    })

    const setorVazio = await consultar('?setor=0', gToken)
    expect(setorVazio.corpo.dados).toMatchObject({
      porStatus: { aberta: 0, em_andamento: 0, resolvida: 4 },
      vencidas: 0, tempoMedioResolucaoHoras: 1.13, ranking: [],
    })

    const l2814 = await consultar('?setor=674', l2814Token)
    expect(l2814.corpo.dados).toMatchObject(setor2814.corpo.dados)
    const l674 = await consultar('?setor=2814', l674Token)
    expect(l674.corpo.dados).toMatchObject({
      porStatus: { aberta: 0, em_andamento: 0, resolvida: 1 },
      tempoMedioResolucaoHoras: 36, ranking: [],
    })
  })

  it('retorna zero e média null em setor sem dados e valida autenticação e queries', async () => {
    expect((await consultar()).status).toBe(401)
    const vazio = await consultar('?setor=1417', gToken)
    expect(vazio.corpo.dados).toMatchObject({
      porStatus: { aberta: 0, em_andamento: 0, resolvida: 0 },
      porGravidade: { baixa: 0, media: 0, alta: 0, critica: 0 },
      vencidas: 0, tempoMedioResolucaoHoras: null, ranking: [],
    })
    expect(vazio.corpo.dados.serie.every(({ abertas, resolvidas }: { abertas: number; resolvidas: number }) => abertas === 0 && resolvidas === 0)).toBe(true)
    for (const query of ['?dias=3', '?dias=200', '?dias=abc', '?setor=-1', '?campo=1']) {
      expect((await consultar(query, gToken)).status).toBe(400)
    }
  })
})
