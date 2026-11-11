import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DataSource, IsNull } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { Lanterna } from '../src/lanternas/lanterna.entity.js'
import { Setor } from '../src/setores/setor.entity.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'
import { Ocorrencia } from '../src/ocorrencias/ocorrencia.entity.js'
import { Evento } from '../src/eventos/evento.entity.js'
import { Comentario } from '../src/comentarios/comentario.entity.js'
import { calcularPrazo, estaVencida } from '../src/ocorrencias/prazo.js'
import { IDS_SEED_OCORRENCIAS, IDS_SEED_COMENTARIOS, ID_EVENTO_COMENTARIO_SEED } from '../src/database/seed/ids.js'

const segredo = 'segredo-e2e-seed-dominio-com-mais-de-trinta-e-dois-bytes'

function env(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'development', PORT: '3001', DATABASE_PATH: databasePath,
    JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '30', LOGIN_JANELA_SEGUNDOS: '60', SEED_INSTANTE: '2026-11-09T12:00:00.000Z', ...extras,
  }
}

function semear(databasePath: string, args = ['--etapa', 'completa'], extras: Record<string, string> = {}) {
  return spawnSync(process.execPath, ['dist/src/database/seed/seed.js', ...args], {
    cwd: process.cwd(), env: env(databasePath, extras), encoding: 'utf8', timeout: 30_000,
  })
}

async function portaLivre(): Promise<number> {
  const servidor = createServer()
  await new Promise<void>((resolveListen, reject) => servidor.once('error', reject).listen(0, '127.0.0.1', resolveListen))
  const endereco = servidor.address()
  if (!endereco || typeof endereco === 'string') throw new Error('Não foi possível reservar porta')
  await new Promise<void>((resolveClose, reject) => servidor.close((erro) => erro ? reject(erro) : resolveClose()))
  return endereco.port
}

type Schema = {
  $ref?: string
  anyOf?: Schema[]
  type?: string | string[]
  enum?: unknown[]
  properties?: Record<string, Schema>
  required?: string[]
  items?: Schema
  additionalProperties?: boolean
  format?: string
  minLength?: number
  maxLength?: number
  pattern?: string
  minimum?: number
  maximum?: number
  maxItems?: number
  'x-max-palavras'?: number
}

function errosSchema(valor: unknown, schema: Schema, raiz: Record<string, any>, caminho = '$'): string[] {
  if (schema.$ref) {
    const apontado = schema.$ref.split('/').slice(1).reduce((objeto: any, chave) => objeto?.[chave], raiz)
    return apontado ? errosSchema(valor, apontado, raiz, caminho) : [`${caminho}: ref inválida ${schema.$ref}`]
  }
  if (schema.anyOf) {
    return schema.anyOf.some((opcao) => errosSchema(valor, opcao, raiz, caminho).length === 0)
      ? [] : [`${caminho}: não corresponde a nenhuma alternativa anyOf`]
  }
  const tipos = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []
  const tipoOk = tipos.length === 0 || tipos.some((tipo) => {
    if (tipo === 'null') return valor === null
    if (tipo === 'object') return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    if (tipo === 'array') return Array.isArray(valor)
    if (tipo === 'integer') return Number.isInteger(valor)
    if (tipo === 'number') return typeof valor === 'number' && Number.isFinite(valor)
    return typeof valor === tipo
  })
  if (!tipoOk) return [`${caminho}: tipo inválido`]
  if (schema.enum && !schema.enum.includes(valor)) return [`${caminho}: valor fora do enum`]
  if (typeof valor === 'string') {
    if (schema.minLength !== undefined && valor.length < schema.minLength) return [`${caminho}: string curta`]
    if (schema.maxLength !== undefined && valor.length > schema.maxLength) return [`${caminho}: string longa (${valor.length})`]
    if (schema.pattern && !new RegExp(schema.pattern).test(valor)) return [`${caminho}: padrão inválido`]
    if (schema['x-max-palavras'] !== undefined && valor.trim().split(/\s+/u).filter(Boolean).length > schema['x-max-palavras']) {
      return [`${caminho}: excede o limite de palavras`]
    }
    if (schema.format === 'uri') {
      try {
        const url = new URL(valor)
        if (!['http:', 'https:'].includes(url.protocol)) return [`${caminho}: URL não HTTP(S)`]
      } catch { return [`${caminho}: URI inválida`] }
    }
  }
  if (typeof valor === 'number') {
    if (schema.minimum !== undefined && valor < schema.minimum) return [`${caminho}: abaixo do mínimo`]
    if (schema.maximum !== undefined && valor > schema.maximum) return [`${caminho}: acima do máximo`]
  }
  if (Array.isArray(valor) && schema.items) {
    const erros = schema.maxItems !== undefined && valor.length > schema.maxItems ? [`${caminho}: excede itens máximos`] : []
    return [...erros, ...valor.flatMap((item, indice) => errosSchema(item, schema.items!, raiz, `${caminho}[${indice}]`))]
  }
  if (valor !== null && typeof valor === 'object' && !Array.isArray(valor)) {
    const objeto = valor as Record<string, unknown>
    const erros = (schema.required ?? []).filter((chave) => !(chave in objeto)).map((chave) => `${caminho}.${chave}: obrigatório`)
    for (const [chave, item] of Object.entries(objeto)) {
      const propriedade = schema.properties?.[chave]
      if (propriedade) erros.push(...errosSchema(item, propriedade, raiz, `${caminho}.${chave}`))
      else if (schema.additionalProperties === false) erros.push(`${caminho}.${chave}: propriedade extra`)
    }
    return erros
  }
  return []
}

describe('seed completo de domínio', () => {
  let pasta: string
  let caminhoBanco: string
  let processo: ChildProcess | undefined

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-seed-dominio-'))
    caminhoBanco = join(pasta, 'dominio.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()
  })

  afterAll(async () => {
    if (processo && processo.exitCode === null) {
      processo.kill()
      await new Promise<void>((resolveExit) => processo!.once('exit', () => resolveExit()))
    }
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  it('é repetível, completa setores, fichas e vínculos, e cada Ficha pública passa no schema OpenAPI', async () => {
    const referencia = new Date()
    const minimoInicial = semear(caminhoBanco)
    if (minimoInicial.status !== 0) throw new Error(minimoInicial.stderr)
    const minimoRepetido = semear(caminhoBanco)
    if (minimoRepetido.status !== 0) throw new Error(minimoRepetido.stderr)
    const completaLimpa = semear(caminhoBanco, ['--limpar', '--etapa', 'completa'], { SEED_INSTANTE: referencia.toISOString() })
    if (completaLimpa.status !== 0) throw new Error(completaLimpa.stderr)

    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    expect(await banco.getRepository(Setor).count()).toBe(7)
    expect(await banco.getRepository(Lanterna).count()).toBe(25)
    expect(await banco.getRepository(Usuario).count()).toBe(3)
    expect(await banco.getRepository(Ocorrencia).count()).toBe(9)
    expect(await banco.getRepository(Evento).count()).toBe(24)
    expect(await banco.getRepository(Comentario).count()).toBe(5)
    expect(await banco.getRepository(Comentario).count({ withDeleted: true })).toBe(6)
    const hashes = await banco.getRepository(Usuario).createQueryBuilder('usuario')
      .addSelect('usuario.senhaHash').getMany()
    expect(hashes).toHaveLength(3)
    expect(hashes.every(({ senhaHash }) => /^\$2[aby]\$\d{2}\$/.test(senhaHash))).toBe(true)
    const o1 = await banco.getRepository(Ocorrencia).findOneByOrFail({ id: IDS_SEED_OCORRENCIAS.o1 })
    expect(o1).toMatchObject({ status: 'em_andamento', responsavelId: 'hal-jordan', resolvidaEm: null })
    const o2 = await banco.getRepository(Ocorrencia).findOneByOrFail({ id: IDS_SEED_OCORRENCIAS.o2 })
    expect(o2).toMatchObject({ status: 'aberta', responsavelId: null })
    const o3 = await banco.getRepository(Ocorrencia).findOneByOrFail({ id: IDS_SEED_OCORRENCIAS.o3 })
    expect(o3).toMatchObject({ status: 'resolvida', responsavelId: 'guy-gardner', resolucao: 'Anéis apreendidos e levados a Oa para análise dos Guardiões.' })
    const paraResolver = await banco.getRepository(Ocorrencia).findOneByOrFail({ id: IDS_SEED_OCORRENCIAS.o7 })
    expect(paraResolver).toMatchObject({ status: 'resolvida', resolucao: 'sdgsbsfbsfdafn' })
    const datasEsperadas: Record<string, number> = {
      [IDS_SEED_OCORRENCIAS.o1]: 20 / 24,
      [IDS_SEED_OCORRENCIAS.o2]: 4,
      [IDS_SEED_OCORRENCIAS.o3]: 10,
      [IDS_SEED_OCORRENCIAS.o4]: 2,
      [IDS_SEED_OCORRENCIAS.o5]: 8,
      [IDS_SEED_OCORRENCIAS.o6]: 6,
      [IDS_SEED_OCORRENCIAS.o7]: 3,
      [IDS_SEED_OCORRENCIAS.o8]: 1,
      [IDS_SEED_OCORRENCIAS.o9]: 6,
    }
    const ocorrenciasSeed = await banco.getRepository(Ocorrencia).find({ order: { id: 'ASC' } })
    expect(ocorrenciasSeed).toHaveLength(9)
    for (const ocorrencia of ocorrenciasSeed) {
      expect(ocorrencia.criadaEm.getTime()).toBe(referencia.getTime() - datasEsperadas[ocorrencia.id]! * 86_400_000)
    }
    const resolvidas = ocorrenciasSeed.filter(({ status }) => status === 'resolvida')
    const pendentes = ocorrenciasSeed.filter(({ status }) => status !== 'resolvida')
    expect(resolvidas).toHaveLength(3)
    expect(pendentes.filter(({ status, criadaEm, gravidade }) =>
      estaVencida(status, calcularPrazo(criadaEm, gravidade), referencia),
    )).toHaveLength(2)
    expect(pendentes.filter(({ status, criadaEm, gravidade }) =>
      !estaVencida(status, calcularPrazo(criadaEm, gravidade), referencia),
    )).toHaveLength(4)
    const eventoResolucao = await banco.getRepository(Evento).findOneBy({ tipo: 'resolvida', ocorrenciaId: IDS_SEED_OCORRENCIAS.o3 })
    expect(eventoResolucao?.dados).toMatchObject({ de: 'em_andamento', para: 'resolvida' })
    const eventoComentarioApagado = await banco.getRepository(Evento).findOneBy({ id: ID_EVENTO_COMENTARIO_SEED })
    expect(eventoComentarioApagado?.dados).toEqual({ comentarioId: IDS_SEED_COMENTARIOS[5] })
    const comentarioApagado = await banco.getRepository(Comentario).findOne({ where: { id: IDS_SEED_COMENTARIOS[5] }, withDeleted: true })
    expect(comentarioApagado?.excluidoEm).not.toBeNull()
    expect(await banco.getRepository(Lanterna).countBy({ setorId: 2813 })).toBe(1)
    expect(await banco.getRepository(Lanterna).countBy({ setorId: 2 })).toBe(1)
    expect(await banco.getRepository(Lanterna).countBy({ setorId: IsNull() })).toBe(12)
    const fichasPersistidas = await banco.getRepository(Lanterna).find()
    expect(fichasPersistidas.filter(({ setorId, fontes }) => setorId !== null && fontes.setorId?.estado === 'verificado')).toHaveLength(9)
    expect(fichasPersistidas.filter(({ setorId, fontes }) => setorId !== null && fontes.setorId?.estado === 'nao_verificado')).toHaveLength(4)
    expect(await banco.getRepository(Usuario).findOneBy({ email: 'hal@oa.tropa', lanternaId: 'hal-jordan', setorId: 2814 })).not.toBeNull()
    expect(await banco.getRepository(Usuario).findOneBy({ email: 'kilowog@oa.tropa', lanternaId: 'kilowog', setorId: 674 })).not.toBeNull()
    expect(await banco.getRepository(Lanterna).findOneBy({ id: 'hal-jordan', status: 'em_missao' })).not.toBeNull()
    expect(await banco.getRepository(Lanterna).findOneBy({ id: 'kilowog', status: 'em_missao' })).not.toBeNull()
    expect(await banco.getRepository(Lanterna).findOneBy({ id: 'salaak', status: 'em_missao' })).not.toBeNull()
    const snapshot = {
      ocorrencias: ocorrenciasSeed.map(({ id, criadaEm, resolvidaEm }) => [id, criadaEm.toISOString(), resolvidaEm?.toISOString() ?? null]),
      eventos: (await banco.getRepository(Evento).find({ order: { id: 'ASC' } })).map(({ id, criadoEm, tipo }) => [id, criadoEm.toISOString(), tipo]),
      comentarios: (await banco.getRepository(Comentario).find({ withDeleted: true, order: { id: 'ASC' } }))
        .map(({ id, criadoEm, excluidoEm }) => [id, criadoEm.toISOString(), excluidoEm?.toISOString() ?? null]),
    }
    await banco.destroy()
    expect(semear(caminhoBanco, ['--etapa', 'completa'], { SEED_INSTANTE: '2027-11-09T12:00:00.000Z' }).status).toBe(0)
    const repetido = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await repetido.initialize()
    expect(await repetido.getRepository(Ocorrencia).count()).toBe(9)
    expect(await repetido.getRepository(Evento).count()).toBe(24)
    expect(await repetido.getRepository(Comentario).count({ withDeleted: true })).toBe(6)
    expect({
      ocorrencias: (await repetido.getRepository(Ocorrencia).find({ order: { id: 'ASC' } }))
        .map(({ id, criadaEm, resolvidaEm }) => [id, criadaEm.toISOString(), resolvidaEm?.toISOString() ?? null]),
      eventos: (await repetido.getRepository(Evento).find({ order: { id: 'ASC' } })).map(({ id, criadoEm, tipo }) => [id, criadoEm.toISOString(), tipo]),
      comentarios: (await repetido.getRepository(Comentario).find({ withDeleted: true, order: { id: 'ASC' } }))
        .map(({ id, criadoEm, excluidoEm }) => [id, criadoEm.toISOString(), excluidoEm?.toISOString() ?? null]),
    }).toEqual(snapshot)
    await repetido.destroy()

    const openapi = JSON.parse(await readFile(resolve(process.cwd(), '../docs/contratos/openapi.json'), 'utf8')) as Record<string, any>
    const schema = openapi.components.schemas.LanternaFicha as Schema
    const porta = await portaLivre()
    const url = `http://127.0.0.1:${porta}`
    processo = spawn(process.execPath, ['dist/src/main.js'], {
      cwd: process.cwd(), env: env(caminhoBanco, { PORT: String(porta) }), stdio: ['ignore', 'ignore', 'pipe'],
    })
    let stderr = ''
    processo.stderr?.on('data', (dados: Buffer) => { stderr += dados.toString() })
    const limite = Date.now() + 20_000
    while (Date.now() < limite) {
      try {
        if ((await fetch(`${url}/saude`)).ok) break
      } catch { /* API inicializando */ }
      if (processo.exitCode !== null) throw new Error(`API encerrou: ${stderr}`)
      await new Promise((resolveWait) => setTimeout(resolveWait, 100))
    }

    const login = await fetch(`${url}/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ganthet@oa.tropa', senha: 'guardiao123' }),
    })
    expect(login.status).toBe(200)
    const sessao = await login.json() as { dados: { token: string } }
    const dashboardResposta = await fetch(`${url}/dashboard`, {
      headers: { authorization: `Bearer ${sessao.dados.token}` },
    })
    expect(dashboardResposta.status).toBe(200)
    const dashboard = await dashboardResposta.json() as { dados: { vencidas: number } }
    expect(dashboard.dados.vencidas).toBe(2)

    const listaResposta = await fetch(`${url}/lanternas?limite=50`)
    expect(listaResposta.status).toBe(200)
    const lista = await listaResposta.json() as { dados: { itens: Array<Record<string, any>>; meta: { total: number } } }
    expect(lista.dados.meta.total).toBe(25)
    expect(lista.dados.itens).toHaveLength(25)
    expect(lista.dados.itens.every((item) => !('fontes' in item))).toBe(true)
    for (const item of lista.dados.itens) {
      const resposta = await fetch(`${url}/lanternas/${item.id}`)
      expect(resposta.status).toBe(200)
      const ficha = await resposta.json() as { dados: Record<string, any> }
      const erros = errosSchema(ficha.dados, schema, openapi)
      expect(erros).toEqual([])
      expect(ficha.dados.fontes).toBeDefined()
    }
  }, 30_000)
})
