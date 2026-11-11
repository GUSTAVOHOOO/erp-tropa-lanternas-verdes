import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { LanternasRepository } from '../src/lanternas/lanternas.repository.js'
import { Lanterna } from '../src/lanternas/lanterna.entity.js'
import { OcorrenciasRepository } from '../src/ocorrencias/ocorrencias.repository.js'
import { Ocorrencia } from '../src/ocorrencias/ocorrencia.entity.js'
import { UsuariosRepository } from '../src/usuarios/usuarios.repository.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'

const senhaFixture = 'senha-de-teste-lanternas-628'
const segredo = 'segredo-e2e-lanternas-com-mais-de-trinta-e-dois-bytes'
const gId = 'f1f68873-7ea3-4e5a-817f-aca74d4d2814'

function env(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'development', PORT: '3001', DATABASE_PATH: databasePath,
    JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '30', LOGIN_JANELA_SEGUNDOS: '60', ...extras,
  }
}

function executarFixture(databasePath: string): void {
  const resultado = spawnSync(process.execPath, ['dist/src/testing/fixture-integracao/cli.js'], {
    cwd: process.cwd(), env: env(databasePath, { FIXTURE_SENHA: senhaFixture }),
    encoding: 'utf8', timeout: 30_000,
  })
  if (resultado.status !== 0) throw new Error(`Fixture falhou: ${resultado.stderr}`)
}

async function portaLivre(): Promise<number> {
  const servidor = createServer()
  await new Promise<void>((resolve, reject) => servidor.once('error', reject).listen(0, '127.0.0.1', resolve))
  const endereco = servidor.address()
  if (!endereco || typeof endereco === 'string') throw new Error('Não foi possível alocar porta')
  await new Promise<void>((resolve, reject) => servidor.close((erro) => erro ? reject(erro) : resolve()))
  return endereco.port
}

function ficha(id: string, codinome: string, setorId: number | null, options: { status?: string; mentorId?: string | null; anoIngresso?: number | null } = {}) {
  return {
    id, codinome, identidadeCivil: null, especie: null, planetaNatal: null, setorId,
    status: options.status ?? 'ativo', anoIngresso: options.anoIngresso ?? null,
    primeiraAparicao: null, habilidades: [], mentorId: options.mentorId ?? null,
    citacao: null, biografia: null, fontes: {},
  }
}

function ocorrencia(
  responsavelId: string,
  status: 'aberta' | 'em_andamento' | 'resolvida',
  criadaEm: Date,
  resolvidaEm: Date | null = null,
) {
  return {
    id: randomUUID(), titulo: `Caso ${randomUUID()}`, descricao: 'Descrição de ocorrência para teste.',
    planeta: 'Terra', setorId: 2814, gravidade: 'baixa' as const, status,
    envolvidos: 1, responsavelId, resolucao: status === 'resolvida' ? 'Resolvido para teste.' : null,
    criadaPorId: gId, criadaEm, resolvidaEm,
  }
}

describe('Lanternas HTTP', () => {
  let pasta: string
  let caminhoBanco: string
  let processo: ChildProcess
  let url: string
  let guardiaoToken: string
  let lanternaToken: string

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-lanternas-'))
    caminhoBanco = join(pasta, 'lanternas.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()
    executarFixture(caminhoBanco)

    const dados = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await dados.initialize()
    const lanternas = new LanternasRepository(dados.getRepository(Lanterna))
    const usuarios = new UsuariosRepository(dados.getRepository(Usuario))
    const ocorrencias = new OcorrenciasRepository(dados.getRepository(Ocorrencia))
    await lanternas.salvar(ficha('hal-jordan', 'Hal Jordan', 2814, { anoIngresso: 1959 }))
    await lanternas.salvar(ficha('guy-gardner', 'Guy Gardner', null, { mentorId: 'hal-jordan', anoIngresso: null }))
    await lanternas.salvar(ficha('kilowog', 'Kilowog', 674, { mentorId: 'guy-gardner', anoIngresso: 1986 }))
    await lanternas.salvar(ficha('arisia-rrab', 'Arisia Rrab', 2814, { anoIngresso: 1981 }))
    await lanternas.salvar(ficha('lanterna-agil', 'Lanterna Ágil', 2814, { anoIngresso: 2024 }))
    await lanternas.salvar(ficha('lanterna-vinculada', 'Lanterna Vinculada', 2814))
    await lanternas.salvar(ficha('lanterna-historica', 'Lanterna Histórica', 2814))
    await lanternas.salvar(ficha('ciclo-a', 'Lanterna Ciclo A', null))
    await lanternas.salvar(ficha('ciclo-b', 'Lanterna Ciclo B', null))
    await usuarios.salvar({
      id: '6d77f441-a918-4716-9343-7823028c2814', lanternaId: 'lanterna-vinculada',
    })

    const agora = Date.parse('2026-10-01T00:00:00.000Z')
    await ocorrencias.salvar(ocorrencia('hal-jordan', 'resolvida', new Date(agora - 24 * 3_600_000), new Date(agora)))
    await ocorrencias.salvar(ocorrencia('hal-jordan', 'resolvida', new Date(agora - 48 * 3_600_000), new Date(agora)))
    await ocorrencias.salvar(ocorrencia('hal-jordan', 'resolvida', new Date(agora - 36 * 3_600_000), new Date(agora)))
    await ocorrencias.salvar(ocorrencia('hal-jordan', 'em_andamento', new Date(agora)))
    await ocorrencias.salvar(ocorrencia('hal-jordan', 'aberta', new Date(agora)))
    await ocorrencias.salvar(ocorrencia('hal-jordan', 'aberta', new Date(agora)))
    await ocorrencias.salvar(ocorrencia('arisia-rrab', 'aberta', new Date(agora)))
    const historica = await ocorrencias.salvar(ocorrencia('lanterna-historica', 'resolvida', new Date(agora - 24 * 3_600_000), new Date(agora)))
    await ocorrencias.excluirSuavemente(historica.id)
    await dados.destroy()

    const porta = await portaLivre()
    url = `http://127.0.0.1:${porta}`
    processo = spawn(process.execPath, ['dist/src/main.js'], {
      cwd: process.cwd(), env: env(caminhoBanco, { PORT: String(porta) }),
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    let erro = ''
    processo.stderr?.on('data', (d: Buffer) => { erro += d.toString() })
    const limite = Date.now() + 20_000
    while (Date.now() < limite) {
      try {
        if ((await fetch(`${url}/saude`)).ok) break
      } catch { /* API inicializando */ }
      if (processo.exitCode !== null) throw new Error(`API encerrou: ${erro}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    guardiaoToken = await token('guardiao@fixture.invalid')
    lanternaToken = await token('l2814@fixture.invalid')
  }, 30_000)

  afterAll(async () => {
    if (processo && processo.exitCode === null) {
      processo.kill()
      await new Promise<void>((resolve) => processo.once('exit', () => resolve()))
    }
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  async function token(email: string): Promise<string> {
    const resposta = await fetch(`${url}/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, senha: senhaFixture }),
    })
    const corpo = await resposta.json() as { dados: { token: string } }
    if (!resposta.ok) throw new Error('Não foi possível autenticar fixture')
    return corpo.dados.token
  }

  async function chamar(caminho: string, options: { method?: string; body?: unknown; token?: string } = {}) {
    const resposta = await fetch(`${url}${caminho}`, {
      method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
      headers: {
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    })
    const texto = await resposta.text()
    return { status: resposta.status, corpo: texto ? JSON.parse(texto) as Record<string, any> : undefined, texto }
  }

  it('lista e filtra publicamente com busca literal, paginação e ordenação estável', async () => {
    const primeira = await chamar('/lanternas?busca=AGIL&pagina=1&limite=2')
    expect(primeira.status).toBe(200)
    expect(primeira.corpo.dados.itens).toHaveLength(1)
    expect(primeira.corpo.dados.itens[0].id).toBe('lanterna-agil')
    expect(primeira.corpo.dados.itens[0]).not.toHaveProperty('fontes')
    expect(primeira.corpo.dados.meta).toEqual({ total: 1, pagina: 1, limite: 2, paginas: 1 })

    const ordenada = await chamar('/lanternas?ordenar=setor&ordem=desc&limite=50')
    const itens = ordenada.corpo.dados.itens as Array<{ id: string; setorId: number | null }>
    const primeiroNulo = itens.findIndex(({ setorId }) => setorId === null)
    expect(primeiroNulo).toBeGreaterThanOrEqual(0)
    expect(itens.slice(primeiroNulo).every(({ setorId }) => setorId === null)).toBe(true)
    expect(itens.slice(primeiroNulo).map(({ id }) => id)).toEqual(['ciclo-a', 'ciclo-b', 'guy-gardner'])
    const emMissao = await chamar('/lanternas?status=em_missao&limite=50')
    expect(emMissao.corpo.dados.itens.map(({ id }: { id: string }) => id)).toEqual(['arisia-rrab', 'hal-jordan'])

    const paginaVazia = await chamar('/lanternas?pagina=99&limite=2')
    expect(paginaVazia.corpo.dados.itens).toEqual([])
    expect(paginaVazia.corpo.dados.meta).toMatchObject({ total: 9, pagina: 99, limite: 2, paginas: 5 })
    expect((await chamar('/lanternas?status=inexistente')).status).toBe(400)
    expect((await chamar('/lanternas?ordenar=nome')).status).toBe(400)
    expect((await chamar('/lanternas?pagina=1&extra=1')).status).toBe(400)
  })

  it('devolve Ficha com nulabilidade, resumos e estatísticas agregadas', async () => {
    const hal = await chamar('/lanternas/hal-jordan')
    expect(hal.status).toBe(200)
    expect(hal.corpo.dados).toMatchObject({
      id: 'hal-jordan', identidadeCivil: null, especie: null, planetaNatal: null,
      status: 'em_missao',
      fontes: {}, mentor: null,
      estatisticas: { resolvidas: 3, emAndamento: 1, tempoMedioResolucaoHoras: 36, cargaAtual: 3 },
    })
    expect(hal.corpo.dados.aprendizes.map(({ id }: { id: string }) => id)).toEqual(['guy-gardner'])
    expect(hal.corpo.dados).not.toHaveProperty('codinomeBusca')
    const kilowog = await chamar('/lanternas/kilowog')
    expect(kilowog.corpo.dados.mentor).toMatchObject({ id: 'guy-gardner' })
    expect(kilowog.corpo.dados.estatisticas.tempoMedioResolucaoHoras).toBeNull()
    expect((await chamar('/lanternas/id_invalido')).status).toBe(400)
    expect((await chamar('/lanternas/nao-existe')).status).toBe(404)
  })

  it('restringe escrita a Guardião e valida cadastro e mentorias', async () => {
    const novo = {
      id: 'ficha-nova', codinome: '  Ficha Nova  ', especie: '  Humana ', planetaNatal: ' Terra ',
      mentorId: 'hal-jordan', fontes: { codinome: { estado: 'nao_verificado' } },
    }
    expect((await chamar('/lanternas', { body: {}, })).status).toBe(401)
    expect((await chamar('/lanternas', { body: {}, token: lanternaToken })).status).toBe(403)
    expect((await chamar('/lanternas', { body: novo, token: lanternaToken })).status).toBe(403)

    const criada = await chamar('/lanternas', { body: novo, token: guardiaoToken })
    expect(criada.status).toBe(201)
    expect(criada.corpo.dados).toMatchObject({
      id: 'ficha-nova', codinome: 'Ficha Nova', especie: 'Humana', planetaNatal: 'Terra',
      setorId: null, status: 'ativo', habilidades: [], fontes: { codinome: { estado: 'nao_verificado' } },
      estatisticas: { resolvidas: 0, emAndamento: 0, tempoMedioResolucaoHoras: null, cargaAtual: 0 },
    })
    expect((await chamar('/lanternas', { body: novo, token: guardiaoToken })).corpo.erro.codigo).toBe('LANTERNA_JA_CADASTRADA')
    expect((await chamar('/lanternas', { body: { ...novo, id: 'ficha-sem-setor', setorId: 9999 }, token: guardiaoToken })).status).toBe(404)
    expect((await chamar('/lanternas', { body: { ...novo, id: 'ficha-com-status', status: 'afastado' }, token: guardiaoToken })).status).toBe(400)
    expect((await chamar('/lanternas', { body: { ...novo, id: 'mentor-ausente', mentorId: 'mentor-inexistente' }, token: guardiaoToken })).corpo.erro.codigo).toBe('MENTOR_INVALIDO')
    expect((await chamar('/lanternas', { body: { ...novo, id: 'mentor-proprio', mentorId: 'mentor-proprio' }, token: guardiaoToken })).corpo.erro.codigo).toBe('MENTOR_INVALIDO')

    const ciclo = await chamar('/lanternas/hal-jordan', { method: 'PATCH', body: { mentorId: 'kilowog' }, token: guardiaoToken })
    expect(ciclo.status).toBe(422)
    expect(ciclo.corpo.erro.codigo).toBe('MENTOR_INVALIDO')
  })

  it('preserva a nulabilidade e o objeto fontes substituído no PATCH', async () => {
    const editado = await chamar('/lanternas/ficha-nova', {
      method: 'PATCH', token: guardiaoToken,
      body: { identidadeCivil: null, citacao: null, fontes: { biografia: { estado: 'verificado', url: 'https://example.test/ficha' } } },
    })
    expect(editado.status).toBe(200)
    expect(editado.corpo.dados.fontes).toEqual({ biografia: { estado: 'verificado', url: 'https://example.test/ficha' } })
    expect(editado.corpo.dados.identidadeCivil).toBeNull()
    expect((await chamar('/lanternas/ficha-nova', { method: 'PATCH', body: {}, token: guardiaoToken })).status).toBe(400)
    expect((await chamar('/lanternas/ficha-nova', { method: 'PATCH', body: { status: 'afastado' }, token: guardiaoToken })).status).toBe(400)
    expect((await chamar('/lanternas/ficha-nova', { method: 'PATCH', body: { setorId: 2814 }, token: guardiaoToken })).corpo.dados.setorId).toBe(2814)
  })

  it('protege Setor de conta vinculada e Ocorrência resolvida/excluída, mas permite troca sem incompatibilidade', async () => {
    const conta = await chamar('/lanternas/lanterna-vinculada', { method: 'PATCH', body: { setorId: 674 }, token: guardiaoToken })
    expect(conta.status).toBe(409)
    expect(conta.corpo.erro.codigo).toBe('LANTERNA_EM_USO')
    const historico = await chamar('/lanternas/lanterna-historica', { method: 'PATCH', body: { setorId: null }, token: guardiaoToken })
    expect(historico.status).toBe(409)
    expect(historico.corpo.erro.codigo).toBe('LANTERNA_EM_USO')
    const alterada = await chamar('/lanternas/ficha-nova', { method: 'PATCH', body: { setorId: 674 }, token: guardiaoToken })
    expect(alterada.status).toBe(200)
    expect(alterada.corpo.dados.setorId).toBe(674)
    const semTroca = await chamar('/lanternas/lanterna-vinculada', { method: 'PATCH', body: { codinome: 'Nome Ajustado' }, token: guardiaoToken })
    expect(semTroca.status).toBe(200)
  })

  it('altera status somente fora de missão e mantém a carga calculada', async () => {
    for (const status of ['ativo', 'afastado']) {
      const resposta = await chamar('/lanternas/arisia-rrab/status', { method: 'PATCH', body: { status }, token: guardiaoToken })
      expect(resposta.status).toBe(409)
      expect(resposta.corpo.erro.codigo).toBe('LANTERNA_EM_MISSAO')
    }
    expect((await chamar('/lanternas/lanterna-agil/status', { method: 'PATCH', body: { status: 'em_missao' }, token: guardiaoToken })).status).toBe(400)
    expect((await chamar('/lanternas/lanterna-agil/status', { method: 'PATCH', body: { status: 'afastado' }, token: guardiaoToken })).corpo.dados.status).toBe('afastado')
    expect((await chamar('/lanternas/lanterna-agil/status', { method: 'PATCH', body: { status: 'ativo' }, token: guardiaoToken })).corpo.dados.status).toBe('ativo')
    expect((await chamar('/lanternas/lanterna-agil', { method: 'DELETE' })).status).toBe(404)
  })

  it('serializa duas edições concorrentes para que a mentoria não forme ciclo', async () => {
    const [a, b] = await Promise.all([
      chamar('/lanternas/ciclo-a', { method: 'PATCH', body: { mentorId: 'ciclo-b' }, token: guardiaoToken }),
      chamar('/lanternas/ciclo-b', { method: 'PATCH', body: { mentorId: 'ciclo-a' }, token: guardiaoToken }),
    ])
    expect([a.status, b.status].sort()).toEqual([200, 422])
    const fichas = await Promise.all([chamar('/lanternas/ciclo-a'), chamar('/lanternas/ciclo-b')])
    const fichaA = fichas.find((resposta) => resposta.corpo.dados.id === 'ciclo-a')!.corpo.dados
    const fichaB = fichas.find((resposta) => resposta.corpo.dados.id === 'ciclo-b')!.corpo.dados
    expect(fichaA.mentorId === 'ciclo-b' && fichaB.mentorId === 'ciclo-a').toBe(false)
  })
})
