import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { LanternasRepository } from '../src/lanternas/lanternas.repository.js'
import { Lanterna } from '../src/lanternas/lanterna.entity.js'
import { OcorrenciasRepository } from '../src/ocorrencias/ocorrencias.repository.js'
import { Ocorrencia } from '../src/ocorrencias/ocorrencia.entity.js'
import { OcorrenciasService } from '../src/ocorrencias/ocorrencias.service.js'
import { EventosRepository } from '../src/eventos/eventos.repository.js'
import { Evento } from '../src/eventos/evento.entity.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'
import { UsuariosRepository } from '../src/usuarios/usuarios.repository.js'
import { SetoresRepository } from '../src/setores/setores.repository.js'
import { Setor } from '../src/setores/setor.entity.js'
import { IDS_FIXTURE_INTEGRACAO_A } from '../src/testing/fixture-integracao/ids.js'
import { EventosService } from '../src/eventos/eventos.service.js'
import { LanternasService } from '../src/lanternas/lanternas.service.js'
import { CicloVidaService } from '../src/ocorrencias/ciclo-vida.service.js'

const senha = 'senha-e2e-ocorrencias-4821'
const segredo = 'segredo-e2e-ocorrencias-com-mais-de-trinta-e-dois-bytes'
const ids = {
  critica: 'f613fc52-7ea8-46ab-8cb2-e88f9c440201',
  recente: 'f613fc52-7ea8-46ab-8cb2-e88f9c440202',
  setor674: 'f613fc52-7ea8-46ab-8cb2-e88f9c440203',
  resolvida: 'f613fc52-7ea8-46ab-8cb2-e88f9c440204',
  excluida: 'f613fc52-7ea8-46ab-8cb2-e88f9c440205',
}

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

describe('Ocorrências HTTP', () => {
  let pasta: string
  let caminhoBanco: string
  let processo: ChildProcess
  let url: string
  let gToken: string
  let g2Token: string
  let l2814Token: string
  let l674Token: string
  let semFichaToken: string
  let logApi = ''

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-ocorrencias-'))
    caminhoBanco = join(pasta, 'ocorrencias.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()
    executarFixture(caminhoBanco)

    const dados = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await dados.initialize()
    const ocorrencias = new OcorrenciasRepository(dados.getRepository(Ocorrencia))
    const agora = Date.now()
    await ocorrencias.salvar({
      id: ids.critica, titulo: 'Ameaça Ártica % literal', descricao: 'Descrição longa de teste da ocorrência.',
      planeta: 'Terra', setorId: 2814, gravidade: 'critica', status: 'aberta', envolvidos: 2,
      responsavelId: 'fixture-hal-2814', resolucao: null, criadaPorId: IDS_FIXTURE_INTEGRACAO_A.lanterna2814,
      criadaEm: new Date(agora - 30 * 60 * 60 * 1000), resolvidaEm: null,
    })
    await ocorrencias.salvar({
      id: ids.recente, titulo: 'Ocorrência recente', descricao: 'Descrição longa de teste da ocorrência.',
      planeta: 'Terra', setorId: 2814, gravidade: 'alta', status: 'aberta', envolvidos: 1,
      responsavelId: 'fixture-hal-2814', resolucao: null, criadaPorId: IDS_FIXTURE_INTEGRACAO_A.lanterna2814,
      criadaEm: new Date(agora - 60 * 60 * 1000), resolvidaEm: null,
    })
    await ocorrencias.salvar({
      id: ids.setor674, titulo: 'Registro no setor 674', descricao: 'Descrição longa de teste da ocorrência.',
      planeta: 'Bolovax Vik', setorId: 674, gravidade: 'baixa', status: 'aberta', envolvidos: 1,
      responsavelId: 'fixture-kilowog-674', resolucao: null, criadaPorId: IDS_FIXTURE_INTEGRACAO_A.lanterna674,
      criadaEm: new Date(agora - 20 * 24 * 60 * 60 * 1000), resolvidaEm: null,
    })
    await ocorrencias.salvar({
      id: ids.resolvida, titulo: 'Registro encerrado', descricao: 'Descrição longa de teste da ocorrência.',
      planeta: 'Terra', setorId: 2814, gravidade: 'critica', status: 'resolvida', envolvidos: 1,
      responsavelId: 'fixture-hal-2814', resolucao: 'Ameaça resolvida e relatório enviado.',
      criadaPorId: IDS_FIXTURE_INTEGRACAO_A.lanterna2814,
      criadaEm: new Date(agora - 30 * 24 * 60 * 60 * 1000), resolvidaEm: new Date(agora - 20 * 24 * 60 * 60 * 1000),
    })
    await ocorrencias.salvar({
      id: ids.excluida, titulo: 'Registro removido', descricao: 'Descrição longa de teste da ocorrência.',
      planeta: 'Terra', setorId: 2814, gravidade: 'baixa', status: 'aberta', envolvidos: 1,
      responsavelId: null, resolucao: null, criadaPorId: IDS_FIXTURE_INTEGRACAO_A.guardiao,
      criadaEm: new Date(agora - 60 * 60 * 1000), resolvidaEm: null,
    })
    await ocorrencias.excluirSuavemente(ids.excluida)
    const lanternas = new LanternasRepository(dados.getRepository(Lanterna))
    await lanternas.atualizar('fixture-hal-2814', { status: 'em_missao' })
    for (const [id, codinome, status] of [
      ['fixture-agil-2814', 'Lanterna Ágil', 'ativo'],
      ['fixture-afastado-2814', 'Lanterna Afastada', 'afastado'],
      ['fixture-race-2814', 'Lanterna Concorrente', 'ativo'],
      ['fixture-concorrente-a', 'Lanterna Concorrente A', 'ativo'],
      ['fixture-concorrente-b', 'Lanterna Concorrente B', 'ativo'],
      ['fixture-ciclo-afastado-2814', 'Lanterna de Ciclo Afastado', 'ativo'],
      ['fixture-rollback-2814', 'Lanterna de Rollback', 'ativo'],
      ['fixture-carga-2814', 'Lanterna para Carga', 'ativo'],
    ] as const) {
      await lanternas.salvar({
        id, codinome, identidadeCivil: null, especie: 'Humana', planetaNatal: 'Terra', setorId: 2814,
        status, anoIngresso: 2024, primeiraAparicao: null, habilidades: [], mentorId: null,
        citacao: null, biografia: null, fontes: {},
      })
    }
    await dados.destroy()

    const porta = await portaLivre()
    url = `http://127.0.0.1:${porta}`
    processo = spawn(process.execPath, ['dist/src/main.js'], {
      cwd: process.cwd(), env: env(caminhoBanco, { PORT: String(porta) }), stdio: ['ignore', 'ignore', 'pipe'],
    })
    processo.stderr?.on('data', (dadosLog: Buffer) => { logApi += dadosLog.toString() })
    const limite = Date.now() + 20_000
    while (Date.now() < limite) {
      try { if ((await fetch(`${url}/saude`)).ok) break } catch { /* API iniciando */ }
      if (processo.exitCode !== null) throw new Error(`API encerrou: ${logApi}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    ;[gToken, g2Token, l2814Token, l674Token, semFichaToken] = await Promise.all([
      token('guardiao@fixture.invalid'), token('guardiao-secundario@fixture.invalid'),
      token('l2814@fixture.invalid'), token('l674@fixture.invalid'), token('lanterna-sem-ficha@fixture.invalid'),
    ])
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
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, senha }),
    })
    const corpo = await resposta.json() as { dados: { token: string } }
    if (!resposta.ok) throw new Error(`Não foi possível autenticar ${email}`)
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
    return { status: resposta.status, corpo: texto ? JSON.parse(texto) as Record<string, any> : undefined }
  }

  it('filtra por escopo, busca literal normalizada, ordena e pagina no banco', async () => {
    expect((await chamar('/ocorrencias')).status).toBe(401)
    const l = await chamar('/ocorrencias?setor=674&limite=1&ordenar=prazo&ordem=asc', { token: l2814Token })
    expect(l.status).toBe(200)
    expect(l.corpo.dados.itens).toHaveLength(1)
    expect(l.corpo.dados.itens[0].setorId).toBe(2814)
    expect(l.corpo.dados.meta).toEqual({ total: 3, pagina: 1, limite: 1, paginas: 3 })
    const busca = await chamar('/ocorrencias?busca=%25', { token: l2814Token })
    expect(busca.corpo.dados.itens.map((item: any) => item.id)).toEqual([ids.critica])
    expect((await chamar('/ocorrencias?busca=artica&setor=2814', { token: gToken })).corpo.dados.itens.map((item: any) => item.id)).toEqual([ids.critica])
    expect((await chamar('/ocorrencias?vencida=true&setor=2814', { token: gToken })).corpo.dados.meta.total).toBe(1)
    expect((await chamar('/ocorrencias?status=aberta&gravidade=alta&responsavel=fixture-hal-2814', { token: gToken })).corpo.dados.itens.map((item: any) => item.id)).toEqual([ids.recente])
    expect((await chamar('/ocorrencias?limite=51', { token: gToken })).status).toBe(400)
    expect((await chamar('/ocorrencias?vencida=sim', { token: gToken })).status).toBe(400)
    expect((await chamar('/ocorrencias?sort=anything', { token: gToken })).status).toBe(400)
    expect((await chamar('/ocorrencias?desconhecido=1', { token: gToken })).status).toBe(400)
  })

  it('expõe detalhe no Setor, inclui prazo calculado e oculta excluída ou alheia', async () => {
    const detalhe = await chamar(`/ocorrencias/${ids.critica}`, { token: l2814Token })
    expect(detalhe.status).toBe(200)
    expect(detalhe.corpo.dados).toMatchObject({ id: ids.critica, status: 'aberta', prazoEm: expect.any(String), vencida: true })
    expect((await chamar(`/ocorrencias/${ids.setor674}`, { token: l2814Token })).status).toBe(404)
    expect((await chamar(`/ocorrencias/${ids.excluida}`, { token: gToken })).status).toBe(404)
    expect((await chamar('/ocorrencias/invalido', { token: gToken })).status).toBe(400)
  })

  it('minha fila exige Lanterna vinculada e ordena pendências por prazo, gravidade e id', async () => {
    const fila = await chamar('/ocorrencias/minha-fila?limite=1', { token: l2814Token })
    expect(fila.corpo.dados.meta).toEqual({ total: 2, pagina: 1, limite: 1, paginas: 2 })
    expect(fila.corpo.dados.itens[0].id).toBe(ids.critica)
    expect((await chamar('/ocorrencias/minha-fila', { token: gToken })).status).toBe(403)
    const semFicha = await chamar('/ocorrencias/minha-fila', { token: semFichaToken })
    expect(semFicha.status).toBe(409)
    expect(semFicha.corpo.erro.codigo).toBe('CONTA_SEM_LANTERNA')
    expect((await chamar('/ocorrencias/minha-fila?status=aberta', { token: l2814Token })).status).toBe(400)
  })

  it('cria Ocorrência no Setor do Lanterna ou Setor informado pelo Guardião com Evento atômico', async () => {
    const payload = { titulo: 'Incidente recém criado', descricao: 'Descrição válida para este teste.', planeta: 'Terra', gravidade: 'alta', envolvidos: 2 }
    const l = await chamar('/ocorrencias', { token: l2814Token, body: payload })
    expect(l.status).toBe(201)
    expect(l.corpo.dados).toMatchObject({ setorId: 2814, status: 'aberta', responsavelId: null, resolucao: null })
    const g = await chamar('/ocorrencias', { token: gToken, body: { ...payload, setorId: 674 } })
    expect(g.status).toBe(201)
    expect(g.corpo.dados.setorId).toBe(674)
    expect((await chamar('/ocorrencias', { token: l2814Token, body: { ...payload, setorId: 2814 } })).status).toBe(400)
    expect((await chamar('/ocorrencias', { token: gToken, body: payload })).status).toBe(400)
    expect((await chamar('/ocorrencias', { token: gToken, body: { ...payload, setorId: 9999 } })).status).toBe(404)
    expect((await chamar('/ocorrencias', { token: gToken, body: { ...payload, setorId: 674, status: 'resolvida' } })).status).toBe(400)

    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    const evento = await new EventosRepository(banco.getRepository((await import('../src/eventos/evento.entity.js')).Evento))
      .listarDaOcorrencia(l.corpo.dados.id)
    expect(evento).toHaveLength(1)
    expect(evento[0]).toMatchObject({ tipo: 'criada', autorId: IDS_FIXTURE_INTEGRACAO_A.lanterna2814, dados: { de: null, para: 'aberta' } })
    await banco.destroy()
  })

  it('edita pelo Guardião ou Lanterna criador, recalcula prazo sem alterar criação e respeita precedência', async () => {
    const payload = { titulo: 'Título alterado de ocorrência' }
    const alterada = await chamar(`/ocorrencias/${ids.recente}`, { method: 'PATCH', token: l2814Token, body: payload })
    expect(alterada.status).toBe(200)
    expect(alterada.corpo.dados.titulo).toBe(payload.titulo)
    const anterior = await chamar(`/ocorrencias/${ids.resolvida}`, { method: 'PATCH', token: l674Token, body: { titulo: 'Título indevido alterado' } })
    expect(anterior.status).toBe(404)
    expect((await chamar(`/ocorrencias/${ids.resolvida}`, { method: 'PATCH', token: gToken, body: payload })).corpo.erro.codigo).toBe('OCORRENCIA_RESOLVIDA')
    expect((await chamar(`/ocorrencias/${ids.recente}`, { method: 'PATCH', token: semFichaToken, body: payload })).status).toBe(403)
    expect((await chamar(`/ocorrencias/${ids.recente}`, { method: 'PATCH', token: gToken, body: { gravidade: 'critica' } })).status).toBe(200)
    expect((await chamar(`/ocorrencias/${ids.recente}`, { method: 'PATCH', token: gToken, body: {} })).status).toBe(400)
    expect((await chamar(`/ocorrencias/${ids.recente}`, { method: 'PATCH', token: gToken, body: { status: 'resolvida' } })).status).toBe(400)
    expect((await chamar(`/ocorrencias/${ids.recente}`, { method: 'PATCH', token: gToken, body: { titulo: null } })).status).toBe(400)
  })

  it('exclui suavemente só com Guardião, preserva Evento e reavalia carga da Ficha', async () => {
    expect((await chamar(`/ocorrencias/${ids.critica}`, { method: 'DELETE', token: l2814Token })).status).toBe(403)
    const antes = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await antes.initialize()
    await new LanternasRepository(antes.getRepository(Lanterna)).atualizar('fixture-kilowog-674', { status: 'em_missao' })
    await new EventosRepository(antes.getRepository(Evento)).salvar({
      id: '3ee4a63b-9249-4f56-8495-004f2f47b001', ocorrenciaId: ids.setor674,
      autorId: IDS_FIXTURE_INTEGRACAO_A.guardiao, tipo: 'criada', dados: { de: null, para: 'aberta' },
    })
    await antes.destroy()
    expect((await chamar(`/ocorrencias/${ids.setor674}`, { method: 'DELETE', token: gToken })).status).toBe(204)
    const resposta = await chamar(`/ocorrencias/${ids.setor674}`, { token: gToken })
    expect(resposta.status).toBe(404)
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    const ficha = await banco.getRepository(Lanterna).findOneByOrFail({ id: 'fixture-kilowog-674' })
    expect(ficha.status).toBe('ativo')
    const fixture = await banco.getRepository(Usuario).findOneByOrFail({ id: IDS_FIXTURE_INTEGRACAO_A.lanterna674 })
    expect(fixture.lanternaId).toBe('fixture-kilowog-674')
    const linha = await banco.query('SELECT "excluidaEm" FROM "ocorrencia" WHERE "id" = ?', [ids.setor674]) as Array<{ excluidaEm: string | null }>
    expect(linha[0].excluidaEm).not.toBeNull()
    expect(await banco.getRepository(Evento).countBy({ ocorrenciaId: ids.setor674 })).toBe(1)
    await banco.destroy()
    expect((await chamar(`/ocorrencias/nao-uuid`, { method: 'DELETE', token: gToken })).status).toBe(400)
  })

  it('faz rollback da criação se o gravador de Evento falha', async () => {
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    const repositorio = new OcorrenciasRepository(banco.getRepository(Ocorrencia))
    const lanternas = new LanternasService(
      new LanternasRepository(banco.getRepository(Lanterna)),
      new SetoresRepository(banco.getRepository(Setor)),
      new UsuariosRepository(banco.getRepository(Usuario)), repositorio, banco,
    )
    const eventos = { gravarCriacao: async () => { throw new Error('falha injetada ao gravar Evento') } } as unknown as EventosService
    const service = new OcorrenciasService(repositorio, new SetoresRepository(banco.getRepository(Setor)), eventos, lanternas, banco)
    const ator = await new UsuariosRepository(banco.getRepository(Usuario)).buscarPorId(IDS_FIXTURE_INTEGRACAO_A.guardiao)
    const antes = await banco.getRepository(Ocorrencia).count()
    await expect(service.criar({
      titulo: 'Criação que será revertida', descricao: 'Descrição válida para verificar rollback.',
      planeta: 'Terra', gravidade: 'alta', envolvidos: 1, setorId: 2814,
    }, { ...ator!, criadoEm: ator!.criadoEm })).rejects.toThrow('falha injetada')
    expect(await banco.getRepository(Ocorrencia).count()).toBe(antes)
    await banco.destroy()
  })

  it('aplica transições válidas, limites de papel, resoluções e reabertura mantendo Prazo', async () => {
    const criada = await chamar('/ocorrencias', { token: l2814Token, body: {
      titulo: 'Transição de teste', descricao: 'Descrição válida para transições.', planeta: 'Terra',
      gravidade: 'critica', envolvidos: 1,
    } })
    const id = criada.corpo.dados.id as string
    expect((await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: l2814Token, body: { status: 'aberta' } })).corpo.erro.codigo).toBe('TRANSICAO_INVALIDA')
    expect((await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: gToken, body: { status: 'resolvida', resolucao: 'Resolução suficientemente longa.' } })).corpo.erro.codigo).toBe('TRANSICAO_INVALIDA')
    expect((await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: gToken, body: { status: 'em_andamento' } })).corpo.erro.codigo).toBe('SEM_RESPONSAVEL')
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-agil-2814' } })).status).toBe(200)

    const iniciou = await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: l2814Token, body: { status: 'em_andamento' } })
    expect(iniciou.status).toBe(200)
    expect(iniciou.corpo.dados.status).toBe('em_andamento')
    expect((await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: gToken, body: { status: 'em_andamento' } })).corpo.erro.codigo).toBe('TRANSICAO_INVALIDA')
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: null } })).corpo.erro.codigo).toBe('SEM_RESPONSAVEL')
    expect((await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: l2814Token, body: { status: 'resolvida' } })).corpo.erro.codigo).toBe('RESOLUCAO_OBRIGATORIA')
    expect((await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: l2814Token, body: { status: 'resolvida', resolucao: 'curta' } })).corpo.erro.codigo).toBe('RESOLUCAO_OBRIGATORIA')
    const resolvida = await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: l2814Token, body: { status: 'resolvida', resolucao: 'Ameaça contida após o relatório.' } })
    expect(resolvida.status).toBe(200)
    expect(resolvida.corpo.dados.resolvidaEm).toEqual(expect.any(String))
    expect((await chamar('/lanternas/fixture-agil-2814', { token: gToken })).corpo.dados.status).toBe('ativo')
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'nao-existe' } })).corpo.erro.codigo).toBe('OCORRENCIA_RESOLVIDA')
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: null } })).corpo.erro.codigo).toBe('OCORRENCIA_RESOLVIDA')
    expect((await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: l2814Token, body: { status: 'aberta', motivo: 'Novo sinal localizado no setor.' } })).status).toBe(403)
    expect((await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: gToken, body: { status: 'aberta' } })).corpo.erro.codigo).toBe('MOTIVO_OBRIGATORIO')
    expect((await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: gToken, body: { status: 'aberta', motivo: 'curto' } })).corpo.erro.codigo).toBe('MOTIVO_OBRIGATORIO')

    const prazoOriginal = resolvida.corpo.dados.prazoEm
    const reaberta = await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: gToken, body: { status: 'aberta', motivo: 'Novo sinal localizado no setor.' } })
    expect(reaberta.status).toBe(200)
    expect(reaberta.corpo.dados).toMatchObject({ status: 'aberta', resolucao: null, resolvidaEm: null, responsavelId: 'fixture-agil-2814', prazoEm: prazoOriginal })
    expect((await chamar('/lanternas/fixture-agil-2814', { token: gToken })).corpo.dados.status).toBe('em_missao')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    const eventos = await banco.getRepository(Evento).findBy({ ocorrenciaId: id })
    expect(eventos.map((evento) => evento.tipo)).toEqual(['criada', 'atribuida', 'status_alterado', 'resolvida', 'reaberta'])
    await banco.destroy()
  })

  it('valida atribuição, reatribui, libera uma ocorrência aberta e gera Evento só quando há mudança', async () => {
    const criada = await chamar('/ocorrencias', { token: gToken, body: {
      titulo: 'Atribuição de teste', descricao: 'Descrição válida para atribuição.', planeta: 'Terra',
      gravidade: 'alta', envolvidos: 1, setorId: 2814,
    } })
    const id = criada.corpo.dados.id as string
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: l2814Token, body: { responsavelId: 'fixture-agil-2814' } })).status).toBe(403)
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: {} })).status).toBe(400)
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'Lanterna A' } })).status).toBe(400)
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'nao-existe' } })).status).toBe(404)
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-kilowog-674' } })).corpo.erro.codigo).toBe('RESPONSAVEL_DE_OUTRO_SETOR')
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-sem-setor' } })).corpo.erro.codigo).toBe('RESPONSAVEL_DE_OUTRO_SETOR')
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-afastado-2814' } })).corpo.erro.codigo).toBe('LANTERNA_AFASTADO')

    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-concorrente-a' } })).status).toBe(200)
    expect((await chamar('/lanternas/fixture-concorrente-a', { token: gToken })).corpo.dados.status).toBe('em_missao')
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-concorrente-a' } })).status).toBe(200)
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-hal-2814' } })).status).toBe(200)
    expect((await chamar('/lanternas/fixture-concorrente-a', { token: gToken })).corpo.dados.status).toBe('ativo')
    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: null } })).status).toBe(200)
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    const eventos = await banco.getRepository(Evento).findBy({ ocorrenciaId: id })
    expect(eventos.map((evento) => evento.tipo)).toEqual(['criada', 'atribuida', 'atribuida', 'atribuida'])
    expect(eventos.slice(1).map((evento) => evento.dados)).toEqual([
      { de: null, para: 'fixture-concorrente-a' },
      { de: 'fixture-concorrente-a', para: 'fixture-hal-2814' },
      { de: 'fixture-hal-2814', para: null },
    ])
    await banco.destroy()
  })

  it('permite reabrir apenas após resolução e libera Responsável afastado sem reiniciar Prazo', async () => {
    const criada = await chamar('/ocorrencias', { token: l2814Token, body: {
      titulo: 'Reabertura com afastamento', descricao: 'Descrição válida para reabertura.', planeta: 'Terra',
      gravidade: 'critica', envolvidos: 1,
    } })
    const id = criada.corpo.dados.id as string
    await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-ciclo-afastado-2814' } })
    await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: l2814Token, body: { status: 'em_andamento' } })
    await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: l2814Token, body: { status: 'resolvida', resolucao: 'Ocorrência resolvida para o teste.' } })
    expect((await chamar('/lanternas/fixture-ciclo-afastado-2814/status', { method: 'PATCH', token: gToken, body: { status: 'afastado' } })).status).toBe(200)
    const resultado = await chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: gToken, body: { status: 'aberta', motivo: 'Reabertura motivada para reteste.' } })
    expect(resultado.status).toBe(200)
    expect(resultado.corpo.dados).toMatchObject({ status: 'aberta', responsavelId: null, resolucao: null, prazoEm: criada.corpo.dados.prazoEm })
    expect((await chamar('/lanternas/fixture-ciclo-afastado-2814', { token: gToken })).corpo.dados.status).toBe('afastado')
  })

  it('serializa atribuição contra afastamento: nunca deixa Responsável afastado', async () => {
    const criada = await chamar('/ocorrencias', { token: gToken, body: {
      titulo: 'Corrida de atribuição', descricao: 'Descrição válida para corrida.', planeta: 'Terra',
      gravidade: 'alta', envolvidos: 1, setorId: 2814,
    } })
    const id = criada.corpo.dados.id as string
    const [atribuicao, afastamento] = await Promise.all([
      chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-race-2814' } }),
      chamar('/lanternas/fixture-race-2814/status', { method: 'PATCH', token: gToken, body: { status: 'afastado' } }),
    ])
    expect([atribuicao.status, afastamento.status].sort()).toEqual([200, 409])
    const ficha = await chamar('/lanternas/fixture-race-2814', { token: gToken })
    const ocorrencia = await chamar(`/ocorrencias/${id}`, { token: gToken })
    if (atribuicao.status === 200) {
      expect(ocorrencia.corpo.dados.responsavelId).toBe('fixture-race-2814')
      expect(ficha.corpo.dados.status).toBe('em_missao')
      expect(afastamento.corpo.erro.codigo).toBe('LANTERNA_EM_MISSAO')
    } else {
      expect(ocorrencia.corpo.dados.responsavelId).toBeNull()
      expect(ficha.corpo.dados.status).toBe('afastado')
      expect(atribuicao.corpo.erro.codigo).toBe('LANTERNA_AFASTADO')
    }
  })

  it('serializa reatribuições e impede duas aplicações da mesma transição anterior', async () => {
    const criada = await chamar('/ocorrencias', { token: gToken, body: {
      titulo: 'Corrida de transições', descricao: 'Descrição válida para transições concorrentes.',
      planeta: 'Terra', gravidade: 'media', envolvidos: 1, setorId: 2814,
    } })
    const id = criada.corpo.dados.id as string
    const atribuicoes = await Promise.all([
      chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-concorrente-a' } }),
      chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-concorrente-b' } }),
    ])
    expect(atribuicoes.map((resposta) => resposta.status)).toEqual([200, 200])
    const final = await chamar(`/ocorrencias/${id}`, { token: gToken })
    expect(['fixture-concorrente-a', 'fixture-concorrente-b']).toContain(final.corpo.dados.responsavelId)
    const inicios = await Promise.all([
      chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: gToken, body: { status: 'em_andamento' } }),
      chamar(`/ocorrencias/${id}/status`, { method: 'PATCH', token: gToken, body: { status: 'em_andamento' } }),
    ])
    expect(inicios.map((resposta) => resposta.status).sort()).toEqual([200, 422])
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    const eventos = await banco.getRepository(Evento).findBy({ ocorrenciaId: id })
    const atribuicoesEvento = eventos.filter((evento) => evento.tipo === 'atribuida').map((evento) => evento.dados)
    expect(atribuicoesEvento).toHaveLength(2)
    expect(atribuicoesEvento.filter((evento) => evento.de === null)).toHaveLength(1)
    expect(atribuicoesEvento.filter((evento) => evento.para === final.corpo.dados.responsavelId)).toHaveLength(1)
    expect(eventos.filter((evento) => evento.tipo === 'status_alterado')).toHaveLength(1)
    await banco.destroy()
  })

  it('mantém carga múltipla ao liberar até o último caso pendente (2→1→0)', async () => {
    const criar = async (titulo: string) => chamar('/ocorrencias', { token: gToken, body: {
      titulo, descricao: 'Descrição válida para testar carga múltipla.', planeta: 'Terra',
      gravidade: 'baixa', envolvidos: 1, setorId: 2814,
    } })
    const [primeira, segunda] = await Promise.all([criar('Carga pendente primeira'), criar('Carga pendente segunda')])
    const primeiraId = primeira.corpo.dados.id as string
    const segundaId = segunda.corpo.dados.id as string
    await Promise.all([primeiraId, segundaId].map((id) => chamar(`/ocorrencias/${id}/responsavel`, {
      method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-carga-2814' },
    })))
    expect((await chamar('/lanternas/fixture-carga-2814', { token: gToken })).corpo.dados).toMatchObject({ status: 'em_missao', estatisticas: { cargaAtual: 2 } })
    expect((await chamar(`/ocorrencias/${primeiraId}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: null } })).status).toBe(200)
    expect((await chamar('/lanternas/fixture-carga-2814', { token: gToken })).corpo.dados).toMatchObject({ status: 'em_missao', estatisticas: { cargaAtual: 1 } })
    expect((await chamar(`/ocorrencias/${segundaId}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: null } })).status).toBe(200)
    expect((await chamar('/lanternas/fixture-carga-2814', { token: gToken })).corpo.dados).toMatchObject({ status: 'ativo', estatisticas: { cargaAtual: 0 } })
  })

  it('faz rollback de atribuição e liberação se o Evento falha', async () => {
    const criada = await chamar('/ocorrencias', { token: gToken, body: {
      titulo: 'Rollback de vínculo', descricao: 'Descrição válida para rollback do vínculo.',
      planeta: 'Terra', gravidade: 'baixa', envolvidos: 1, setorId: 2814,
    } })
    const id = criada.corpo.dados.id as string
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    const ocorrencias = new OcorrenciasRepository(banco.getRepository(Ocorrencia))
    const lanternas = new LanternasRepository(banco.getRepository(Lanterna))
    const lanternasService = new LanternasService(
      lanternas, new SetoresRepository(banco.getRepository(Setor)),
      new UsuariosRepository(banco.getRepository(Usuario)), ocorrencias, banco,
    )
    const eventosFalhos = { gravarAcao: async () => { throw new Error('falha injetada ao gravar Evento') } } as unknown as EventosService
    const ciclo = new CicloVidaService(ocorrencias, lanternas, lanternasService, eventosFalhos, banco)
    const ator = await new UsuariosRepository(banco.getRepository(Usuario)).buscarPorId(IDS_FIXTURE_INTEGRACAO_A.guardiao)
    const antes = await banco.getRepository(Evento).countBy({ ocorrenciaId: id })
    await expect(ciclo.alterarResponsavel(id, { responsavelId: 'fixture-rollback-2814' }, { ...ator!, criadoEm: ator!.criadoEm })).rejects.toThrow('falha injetada')
    let estado = await ocorrencias.buscarPorId(id)
    let lanterna = await lanternas.buscarPorId('fixture-rollback-2814')
    expect(estado?.responsavelId).toBeNull()
    expect(lanterna?.status).toBe('ativo')
    expect(await banco.getRepository(Evento).countBy({ ocorrenciaId: id })).toBe(antes)

    expect((await chamar(`/ocorrencias/${id}/responsavel`, { method: 'PATCH', token: gToken, body: { responsavelId: 'fixture-rollback-2814' } })).status).toBe(200)
    const eventosAntesDaLiberacao = await banco.getRepository(Evento).countBy({ ocorrenciaId: id })
    await expect(ciclo.alterarResponsavel(id, { responsavelId: null }, { ...ator!, criadoEm: ator!.criadoEm })).rejects.toThrow('falha injetada')
    estado = await ocorrencias.buscarPorId(id)
    lanterna = await lanternas.buscarPorId('fixture-rollback-2814')
    expect(estado?.responsavelId).toBe('fixture-rollback-2814')
    expect(lanterna?.status).toBe('em_missao')
    expect(await banco.getRepository(Evento).countBy({ ocorrenciaId: id })).toBe(eventosAntesDaLiberacao)
    await banco.destroy()
  })
})
