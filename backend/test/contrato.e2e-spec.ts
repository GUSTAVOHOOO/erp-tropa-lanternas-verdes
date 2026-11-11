import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { IDS_FIXTURE_INTEGRACAO_A, IDS_FIXTURE_INTEGRACAO_B, IDS_FIXTURE_INTEGRACAO_E } from '../src/testing/fixture-integracao/ids.js'

const senhaFixture = 'senha-e2e-contrato-4938'
const jwtSecret = 'segredo-e2e-contrato-provedor-com-mais-de-trinta-e-dois-bytes'
const idOcorrenciaFixture = (indice: number) =>
  `a0800000-0000-4000-8000-${indice.toString(16).padStart(12, '0')}`

type Schema = {
  $ref?: string
  type?: string | string[]
  enum?: unknown[]
  const?: unknown
  anyOf?: Schema[]
  oneOf?: Schema[]
  allOf?: Schema[]
  properties?: Record<string, Schema>
  required?: string[]
  additionalProperties?: boolean | Schema
  items?: Schema
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  minItems?: number
  maxItems?: number
  minProperties?: number
  maxProperties?: number
  'x-max-palavras'?: number
  'x-max-bytes'?: number
}

function ambiente(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'development', PORT: '3001', DATABASE_PATH: databasePath,
    JWT_SECRET: jwtSecret, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '30', LOGIN_JANELA_SEGUNDOS: '60', ...extras,
  }
}

async function portaLivre(): Promise<number> {
  const servidor = createServer()
  await new Promise<void>((resolveListen, reject) => servidor.once('error', reject).listen(0, '127.0.0.1', resolveListen))
  const endereco = servidor.address()
  if (!endereco || typeof endereco === 'string') throw new Error('NÃ£o foi possÃ­vel reservar porta')
  await new Promise<void>((resolveClose, reject) => servidor.close((erro) => erro ? reject(erro) : resolveClose()))
  return endereco.port
}

function referencia(documento: Record<string, any>, ref: string): Schema | undefined {
  if (!ref.startsWith('#/')) return undefined
  return ref.slice(2).split('/').reduce((valor: any, parte) => valor?.[parte.replace(/~1/g, '/').replace(/~0/g, '~')], documento)
}

function validarSchema(valor: unknown, schema: Schema, documento: Record<string, any>, caminho = '$'): string[] {
  if (schema.$ref) {
    const apontado = referencia(documento, schema.$ref)
    return apontado ? validarSchema(valor, apontado, documento, caminho) : [`${caminho}: ref invÃ¡lida ${schema.$ref}`]
  }
  if (schema.allOf) return schema.allOf.flatMap((parte) => validarSchema(valor, parte, documento, caminho))
  if (schema.anyOf && !schema.anyOf.some((parte) => validarSchema(valor, parte, documento, caminho).length === 0)) {
    return [`${caminho}: nÃ£o corresponde a nenhuma alternativa anyOf`]
  }
  if (schema.oneOf && schema.oneOf.filter((parte) => validarSchema(valor, parte, documento, caminho).length === 0).length !== 1) {
    return [`${caminho}: nÃ£o corresponde a exatamente uma alternativa oneOf`]
  }
  if (schema.const !== undefined && valor !== schema.const) return [`${caminho}: valor diferente de const`]
  if (schema.enum && !schema.enum.includes(valor)) return [`${caminho}: valor fora do enum`]

  const tipos = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []
  const tipoOk = tipos.length === 0 || tipos.some((tipo) => {
    if (tipo === 'null') return valor === null
    if (tipo === 'object') return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    if (tipo === 'array') return Array.isArray(valor)
    if (tipo === 'integer') return Number.isInteger(valor)
    if (tipo === 'number') return typeof valor === 'number' && Number.isFinite(valor)
    return typeof valor === tipo
  })
  if (!tipoOk) return [`${caminho}: tipo invÃ¡lido`]

  if (typeof valor === 'string') {
    const pontos = [...valor].length
    if (schema.minLength !== undefined && pontos < schema.minLength) return [`${caminho}: string curta`]
    if (schema.maxLength !== undefined && pontos > schema.maxLength) return [`${caminho}: string longa`]
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(valor)) return [`${caminho}: padrÃ£o invÃ¡lido`]
    if (schema['x-max-palavras'] !== undefined && valor.trim().split(/\s+/u).filter(Boolean).length > schema['x-max-palavras']) {
      return [`${caminho}: excede limite de palavras`]
    }
    if (schema['x-max-bytes'] !== undefined && Buffer.byteLength(valor, 'utf8') > schema['x-max-bytes']) {
      return [`${caminho}: excede limite de bytes`]
    }
    if (schema.format === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(valor)) {
      return [`${caminho}: UUID invÃ¡lido`]
    }
    if (schema.format === 'date' && (!/^\d{4}-\d{2}-\d{2}$/u.test(valor) || Number.isNaN(Date.parse(`${valor}T00:00:00Z`)))) {
      return [`${caminho}: data invÃ¡lida`]
    }
    if (schema.format === 'date-time' && (!/(?:Z|[+-]\d{2}:\d{2})$/u.test(valor) || Number.isNaN(Date.parse(valor)))) {
      return [`${caminho}: data e fuso invÃ¡lidos`]
    }
    if (schema.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(valor)) return [`${caminho}: e-mail invÃ¡lido`]
    if (schema.format === 'uri') {
      try {
        const url = new URL(valor)
        if (!['http:', 'https:'].includes(url.protocol)) return [`${caminho}: URI nÃ£o HTTP(S)`]
      } catch { return [`${caminho}: URI invÃ¡lida`] }
    }
  }
  if (typeof valor === 'number') {
    if (schema.minimum !== undefined && valor < schema.minimum) return [`${caminho}: abaixo do mÃ­nimo`]
    if (schema.maximum !== undefined && valor > schema.maximum) return [`${caminho}: acima do mÃ¡ximo`]
  }
  if (Array.isArray(valor)) {
    if (schema.minItems !== undefined && valor.length < schema.minItems) return [`${caminho}: poucos itens`]
    if (schema.maxItems !== undefined && valor.length > schema.maxItems) return [`${caminho}: itens demais`]
    return schema.items
      ? valor.flatMap((item, indice) => validarSchema(item, schema.items!, documento, `${caminho}[${indice}]`))
      : []
  }
  if (valor !== null && typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>
    const chaves = Object.keys(objeto)
    const erros = (schema.required ?? []).filter((chave) => !(chave in objeto)).map((chave) => `${caminho}.${chave}: obrigatÃ³rio`)
    if (schema.minProperties !== undefined && chaves.length < schema.minProperties) erros.push(`${caminho}: propriedades insuficientes`)
    if (schema.maxProperties !== undefined && chaves.length > schema.maxProperties) erros.push(`${caminho}: propriedades demais`)
    for (const [chave, item] of Object.entries(objeto)) {
      const propriedade = schema.properties?.[chave]
      if (propriedade) erros.push(...validarSchema(item, propriedade, documento, `${caminho}.${chave}`))
      else if (schema.additionalProperties === false) erros.push(`${caminho}.${chave}: propriedade extra`)
      else if (typeof schema.additionalProperties === 'object') {
        erros.push(...validarSchema(item, schema.additionalProperties, documento, `${caminho}.${chave}`))
      }
    }
    return erros
  }
  return []
}

describe('contrato do provedor HTTP', () => {
  let pasta: string
  let caminhoBanco: string
  let porta: number
  let url: string
  let processo: ChildProcess | undefined
  let erroApi = ''
  let openapi: Record<string, any>
  let cenarios: Record<string, any>
  let operacoes: Array<{ id: string; metodo: string; caminho: string; operacao: Record<string, any> }>
  let gToken: string
  let l2814Token: string
  let l674Token: string
  let cadastroToken: string

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-contrato-provedor-'))
    caminhoBanco = join(pasta, 'provedor.sqlite')
    const db = new DataSource(criarOpcoesBanco(validarAmbiente(ambiente(caminhoBanco))))
    await db.initialize()
    await db.runMigrations()
    await db.destroy()

    const instante = new Date().toISOString()
    const fixture = spawnSync(process.execPath, ['dist/src/testing/fixture-integracao/cli.js', '--etapa', 'e'], {
      cwd: process.cwd(),
      env: ambiente(caminhoBanco, { FIXTURE_SENHA: senhaFixture, FIXTURE_INSTANTE: instante }),
      encoding: 'utf8', timeout: 30_000,
    })
    if (fixture.status !== 0) throw new Error(`Fixture completa falhou: ${fixture.stderr}`)
    expect(fixture.stderr).toBe('')
    expect(fixture.stdout).not.toContain(senhaFixture)
    expect(fixture.stdout).not.toMatch(/senhaHash|"token"/iu)
    const manifesto = JSON.parse(fixture.stdout) as Record<string, any>
    expect(manifesto).toMatchObject({
      versaoContrato: '1.0.0', etapa: 'e',
      contagens: { setor: 2, usuario: 5, lanterna: 3, ocorrencia: 22, evento: 33, comentario: 3 },
    })
    expect(manifesto.contas.map(({ caso }: { caso: string }) => caso)).toEqual(['G', 'G2', 'L2814', 'L674', 'L-sem-ficha'])
    expect(manifesto.ocorrencias).toHaveLength(22)
    expect(manifesto.eventos).toHaveLength(33)
    expect(manifesto.comentarios).toHaveLength(3)

    openapi = JSON.parse(await readFile(resolve(process.cwd(), '../docs/contratos/openapi.json'), 'utf8')) as Record<string, any>
    cenarios = JSON.parse(await readFile(resolve(process.cwd(), '../docs/contratos/exemplos/cenarios.json'), 'utf8')) as Record<string, any>
    operacoes = []
    for (const [caminho, metodos] of Object.entries(openapi.paths as Record<string, Record<string, Record<string, any>>>)) {
      for (const [metodo, operacao] of Object.entries(metodos)) {
        if (operacao.operationId) operacoes.push({ id: operacao.operationId, metodo: metodo.toUpperCase(), caminho, operacao })
      }
    }

    porta = await portaLivre()
    url = `http://127.0.0.1:${porta}`
    await iniciarApi()
    gToken = await entrar('guardiao@fixture.invalid')
    l2814Token = await entrar('l2814@fixture.invalid')
    l674Token = await entrar('l674@fixture.invalid')
  }, 60_000)

  afterAll(async () => {
    await encerrarApi()
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  async function iniciarApi(): Promise<void> {
    processo = spawn(process.execPath, ['dist/src/main.js'], {
      cwd: process.cwd(), env: ambiente(caminhoBanco, { PORT: String(porta) }), stdio: ['ignore', 'ignore', 'pipe'],
    })
    processo.stderr?.on('data', (dados: Buffer) => { erroApi += dados.toString() })
    const limite = Date.now() + 20_000
    while (Date.now() < limite) {
      try {
        if ((await fetch(`${url}/saude`)).ok) return
      } catch { /* API inicializando */ }
      if (processo.exitCode !== null) throw new Error(`API encerrou: ${erroApi}`)
      await new Promise((resolveWait) => setTimeout(resolveWait, 100))
    }
    throw new Error(`API nÃ£o iniciou: ${erroApi}`)
  }

  async function encerrarApi(): Promise<void> {
    if (processo && processo.exitCode === null) {
      processo.kill()
      await new Promise<void>((resolveExit) => processo!.once('exit', () => resolveExit()))
    }
    processo = undefined
  }

  async function entrar(email: string, senha = senhaFixture): Promise<string> {
    const resposta = await enviar('POST', '/auth/login', { body: { email, senha } })
    if (resposta.status !== 200) throw new Error(`Login ${email} falhou: ${JSON.stringify(resposta.corpo)}`)
    return resposta.corpo.dados.token as string
  }

  async function enviar(
    metodo: string,
    caminho: string,
    opcoes: { token?: string; body?: unknown } = {},
  ): Promise<{ status: number; corpo?: Record<string, any>; texto: string }> {
    const resposta = await fetch(`${url}${caminho}`, {
      method: metodo,
      headers: {
        ...(opcoes.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(opcoes.token ? { authorization: `Bearer ${opcoes.token}` } : {}),
      },
      ...(opcoes.body === undefined ? {} : { body: JSON.stringify(opcoes.body) }),
    })
    const texto = await resposta.text()
    return { status: resposta.status, corpo: texto ? JSON.parse(texto) as Record<string, any> : undefined, texto }
  }

  async function sucesso(
    operationId: string,
    metodo: string,
    caminho: string,
    opcoes: { token?: string; body?: unknown } = {},
    statusEsperado?: number,
  ): Promise<Record<string, any> | undefined> {
    const resultado = await enviar(metodo, caminho, opcoes)
    const status = statusEsperado ?? (metodo === 'POST' ? 201 : metodo === 'DELETE' ? 204 : 200)
    expect({ operationId, status: resultado.status, corpo: resultado.corpo }).toMatchObject({ operationId, status })
    if (status === 204) {
      expect(resultado.texto).toBe('')
      return undefined
    }
    const definicao = operacoes.find(({ id }) => id === operationId)?.operacao
    const schema = definicao?.responses?.[String(status)]?.content?.['application/json']?.schema as Schema | undefined
    expect(schema).toBeDefined()
    const erros = validarSchema(resultado.corpo, schema!, openapi, `${operationId}.resposta`)
    expect(erros).toEqual([])
    return resultado.corpo
  }

  it('inventaria 30 operaÃ§Ãµes e verifica a cobertura dos cÃ³digos pelos 310 cenÃ¡rios', () => {
    expect(openapi.info.version).toBe('1.0.0')
    expect(cenarios.versaoContrato).toBe(openapi.info.version)
    expect(operacoes).toHaveLength(30)
    expect(cenarios.cenarios).toHaveLength(310)
    const operationIds = new Set(operacoes.map(({ id }) => id))
    expect(new Set(cenarios.cenarios.filter(({ operationId }: { operationId: string }) => operationId).map(({ operationId }: { operationId: string }) => operationId)))
      .toEqual(operationIds)

    const paresDeclarados = new Set<string>()
    for (const { id, operacao } of operacoes) {
      const cenariosDaOperacao = cenarios.cenarios.filter(({ operationId }: { operationId: string }) => operationId === id)
      expect(cenariosDaOperacao.some(({ tipo }: { tipo: string }) => tipo === 'sucesso')).toBe(true)
      for (const [status, resposta] of Object.entries(operacao.responses as Record<string, Record<string, any>>)) {
        for (const codigo of resposta['x-codigos'] ?? []) paresDeclarados.add(`${id}|${status}|${codigo}`)
      }
    }
    const paresDeCenario = new Set<string>(cenarios.cenarios.flatMap((cenario: Record<string, any>) => {
      const status = cenario.esperado?.status
      const codigo = cenario.esperado?.codigo ?? cenario.esperado?.corpo?.erro?.codigo
      return cenario.operationId && status && codigo ? [`${cenario.operationId}|${status}|${codigo}`] : []
    }))
    for (const par of paresDeclarados) expect(paresDeCenario.has(par)).toBe(true)
  })

  it('executa sucesso real em cada operaÃ§Ã£o e valida cada corpo contra o schema OpenAPI', async () => {
    const exercitadas = new Set<string>()
    const validar = async (...args: Parameters<typeof sucesso>) => {
      exercitadas.add(args[0])
      return sucesso(...args)
    }

    const cadastrado = await validar('cadastrarUsuario', 'POST', '/auth/cadastro', { body: {
      nome: 'Lanterna criada pelo contrato', email: 'contrato-nova@fixture.invalid',
      senha: 'SomenteTeste123!', setorId: 2814,
    } }, 201)
    const cadastroId = cadastrado!.dados.id as string
    cadastroToken = await entrar('contrato-nova@fixture.invalid', 'SomenteTeste123!')
    await validar('entrar', 'POST', '/auth/login', {
      body: { email: 'contrato-nova@fixture.invalid', senha: 'SomenteTeste123!' },
    }, 200)
    await validar('consultarUsuarioAtual', 'GET', '/auth/me', { token: cadastroToken }, 200)
    await validar('listarUsuarios', 'GET', '/usuarios?pagina=1&limite=20&ordenar=nome&ordem=asc', { token: gToken }, 200)

    const contaLonge = IDS_FIXTURE_INTEGRACAO_A.guardiaoSecundario
    await validar('alterarPapel', 'PATCH', `/usuarios/${contaLonge}/papel`, {
      token: gToken, body: { papel: 'lanterna', setorId: 2814 },
    }, 200)
    await validar('alterarPapel', 'PATCH', `/usuarios/${contaLonge}/papel`, {
      token: gToken, body: { papel: 'guardiao' },
    }, 200)

    await validar('listarSetores', 'GET', '/setores', {}, 200)
    await validar('criarSetor', 'POST', '/setores', { token: gToken, body: {
      id: 4100, nome: 'Setor de contrato', descricao: 'Setor sem referÃªncias para verificar exclusÃ£o segura.',
    } }, 201)
    await validar('consultarSetor', 'GET', '/setores/4100', {}, 200)
    await validar('editarSetor', 'PATCH', '/setores/4100', { token: gToken, body: { nome: 'Setor revisado' } }, 200)

    const ficha = await validar('criarLanterna', 'POST', '/lanternas', { token: gToken, body: {
      id: 'contrato-lanterna', codinome: 'Lanterna de Contrato', especie: 'Humana',
      planetaNatal: 'Terra', setorId: 2814,
    } }, 201)
    const fichaId = ficha!.dados.id as string
    await validar('consultarFichaLanterna', 'GET', `/lanternas/${fichaId}`, {}, 200)
    await validar('editarLanterna', 'PATCH', `/lanternas/${fichaId}`, {
      token: gToken, body: { biografia: 'Biografia de teste do provedor e do contrato.' },
    }, 200)
    await validar('vincularLanterna', 'PATCH', `/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanternaSemFicha}/lanterna`, {
      token: gToken, body: { lanternaId: fichaId },
    }, 200)
    await validar('alterarStatusLanterna', 'PATCH', `/lanternas/${fichaId}/status`, {
      token: gToken, body: { status: 'afastado' },
    }, 200)
    await validar('listarLanternas', 'GET', '/lanternas?pagina=1&limite=50&ordenar=codinome&ordem=asc', {}, 200)

    const ocorrencia = await validar('criarOcorrencia', 'POST', '/ocorrencias', { token: l2814Token, body: {
      titulo: 'OcorrÃªncia do teste de contrato',
      descricao: 'DescriÃ§Ã£o vÃ¡lida da ocorrÃªncia criada pelo teste do contrato.',
      planeta: 'Terra', gravidade: 'alta', envolvidos: 2,
    } }, 201)
    const ocorrenciaId = ocorrencia!.dados.id as string
    await validar('listarOcorrencias', 'GET', '/ocorrencias?pagina=1&limite=20&ordenar=criadaEm&ordem=desc', { token: l2814Token }, 200)
    await validar('listarMinhaFila', 'GET', '/ocorrencias/minha-fila?pagina=1&limite=20', { token: l2814Token }, 200)
    await validar('consultarOcorrencia', 'GET', `/ocorrencias/${ocorrenciaId}`, { token: l2814Token }, 200)
    await validar('editarOcorrencia', 'PATCH', `/ocorrencias/${ocorrenciaId}`, {
      token: l2814Token, body: { titulo: 'OcorrÃªncia de contrato editada' },
    }, 200)
    await validar('atribuirResponsavel', 'PATCH', `/ocorrencias/${ocorrenciaId}/responsavel`, {
      token: gToken, body: { responsavelId: IDS_FIXTURE_INTEGRACAO_B.hal2814 },
    }, 200)
    await validar('alterarStatusOcorrencia', 'PATCH', `/ocorrencias/${ocorrenciaId}/status`, {
      token: l2814Token, body: { status: 'em_andamento' },
    }, 200)
    const comentario = await validar('criarComentario', 'POST', `/ocorrencias/${ocorrenciaId}/comentarios`, {
      token: l2814Token, body: { texto: 'ComentÃ¡rio criado pelo teste e2e do contrato.' },
    }, 201)
    const comentarioId = comentario!.dados.id as string
    await validar('listarEventos', 'GET', `/ocorrencias/${ocorrenciaId}/eventos?pagina=1&limite=20`, { token: l2814Token }, 200)
    await validar('listarComentarios', 'GET', `/ocorrencias/${ocorrenciaId}/comentarios?pagina=1&limite=20`, { token: l2814Token }, 200)
    await validar('excluirComentario', 'DELETE', `/comentarios/${comentarioId}`, { token: l2814Token }, 204)
    await validar('alterarStatusOcorrencia', 'PATCH', `/ocorrencias/${ocorrenciaId}/status`, {
      token: gToken, body: { status: 'resolvida', resolucao: 'A ocorrÃªncia foi resolvida no teste contratual.' },
    }, 200)
    await validar('excluirOcorrencia', 'DELETE', `/ocorrencias/${ocorrenciaId}`, { token: gToken }, 204)
    await validar('excluirSetor', 'DELETE', '/setores/4100', { token: gToken }, 204)
    await validar('consultarDashboard', 'GET', '/dashboard?dias=7', { token: gToken }, 200)
    await validar('consultarSaude', 'GET', '/saude', {}, 200)

    expect(exercitadas.size).toBe(30)
    expect([...exercitadas].sort()).toEqual(operacoes.map(({ id }) => id).sort())

    const novaOcorrenciaOutroSetor = await validar('criarOcorrencia', 'POST', '/ocorrencias', { token: l674Token, body: {
      titulo: 'OcorrÃªncia de outro setor',
      descricao: 'DescriÃ§Ã£o vÃ¡lida para provar o limite entre setores.',
      planeta: 'Bolovax Vik', gravidade: 'media', envolvidos: 1,
    } }, 201)
    const alheia = await enviar('GET', `/ocorrencias/${novaOcorrenciaOutroSetor!.dados.id}`, { token: l2814Token })
    expect(alheia).toMatchObject({ status: 404, corpo: { sucesso: false, erro: { codigo: 'NAO_ENCONTRADO' } } })

    const invalido = await enviar('GET', '/dashboard?campo-desconhecido=1', { token: gToken })
    expect(invalido).toMatchObject({ status: 400, corpo: { sucesso: false, erro: { codigo: 'DADOS_INVALIDOS' } } })
    const campoExtra = await enviar('POST', '/setores', { token: gToken, body: {
      id: 4101, nome: 'Setor com campo extra', descricao: 'Este campo deve ser rejeitado.', propriedadeDesconhecida: true,
    } })
    expect(campoExtra).toMatchObject({ status: 400, corpo: { sucesso: false, erro: { codigo: 'DADOS_INVALIDOS' } } })
    const conflito = await enviar('POST', '/setores', { token: gToken, body: {
      id: 2814, nome: 'Duplicado', descricao: 'Tentativa contratual de repetir setor.' ,
    } })
    expect(conflito).toMatchObject({ status: 409, corpo: { sucesso: false, erro: { codigo: 'SETOR_JA_CADASTRADO' } } })
    const inexistente = await enviar('GET', '/setores/9999')
    expect(inexistente).toMatchObject({ status: 404, corpo: { sucesso: false, erro: { codigo: 'NAO_ENCONTRADO' } } })
    const permissao = await enviar('POST', '/setores', { token: l2814Token, body: {
      id: 4101, nome: 'Sem permissÃ£o', descricao: 'Lanterna nÃ£o pode criar um Setor.',
    } })
    expect(permissao).toMatchObject({ status: 403, corpo: { sucesso: false, erro: { codigo: 'SEM_PERMISSAO' } } })
    const mentorInvalido = await enviar('PATCH', `/lanternas/${fichaId}`, {
      token: gToken, body: { mentorId: fichaId },
    })
    expect(mentorInvalido).toMatchObject({ status: 422, corpo: { sucesso: false, erro: { codigo: 'MENTOR_INVALIDO' } } })
    const alterado = await enviar('GET', '/auth/me', { token: `${gToken.slice(0, -1)}x` })
    expect(alterado).toMatchObject({ status: 401, corpo: { sucesso: false, erro: { codigo: 'NAO_AUTENTICADO' } } })

    const operacoesProtegidas = operacoes.filter(({ operacao }) => (operacao.security?.length ?? 0) > 0)
    for (const { metodo, caminho, operacao } of operacoesProtegidas) {
      const rota = caminho.replace(/\{[^}]+\}/gu, '0')
      const body = operacao.requestBody ? {} : undefined
      const anonima = await enviar(metodo, rota, { body })
      expect({ operationId: operacao.operationId, status: anonima.status, codigo: anonima.corpo?.erro?.codigo })
        .toMatchObject({ operationId: operacao.operationId, status: 401, codigo: 'NAO_AUTENTICADO' })
    }

    const rotaDesconhecida = await enviar('GET', '/rota-que-nao-existe?segredo=nao-vaza')
    expect(rotaDesconhecida).toMatchObject({
      status: 404, corpo: { sucesso: false, erro: { codigo: 'NAO_ENCONTRADO' }, caminho: '/rota-que-nao-existe' },
    })

    await encerrarApi()
    await iniciarApi()
    const persistido = await enviar('GET', '/auth/me', { token: cadastroToken })
    expect(persistido).toMatchObject({ status: 200, corpo: { dados: { id: cadastroId, email: 'contrato-nova@fixture.invalid' } } })
    expect(erroApi).not.toMatch(/senha-e2e-contrato|Authorization|senhaHash/iu)
  }, 60_000)
})
