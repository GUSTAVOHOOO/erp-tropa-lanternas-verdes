import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { Comentario } from '../src/comentarios/comentario.entity.js'
import { ComentariosRepository } from '../src/comentarios/comentarios.repository.js'
import { ComentariosService } from '../src/comentarios/comentarios.service.js'
import { Evento } from '../src/eventos/evento.entity.js'
import { EventosService } from '../src/eventos/eventos.service.js'
import { Ocorrencia } from '../src/ocorrencias/ocorrencia.entity.js'
import { OcorrenciasRepository } from '../src/ocorrencias/ocorrencias.repository.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'
import { IDS_FIXTURE_INTEGRACAO_A, IDS_FIXTURE_INTEGRACAO_E } from '../src/testing/fixture-integracao/ids.js'

const senha = 'senha-fixture-etapa-e-4821'
const segredo = 'segredo-fixture-e-com-mais-de-trinta-e-dois-bytes'
const ocorrencia1 = 'a0800000-0000-4000-8000-000000000001'
const ocorrencia2 = 'a0800000-0000-4000-8000-000000000002'
const ocorrencia4 = 'a0800000-0000-4000-8000-000000000004'
const ocorrenciaExcluida = 'a0800000-0000-4000-8000-000000000016'

function env(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'development', PORT: '3001', DATABASE_PATH: databasePath,
    JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '30', LOGIN_JANELA_SEGUNDOS: '60', FIXTURE_SENHA: senha,
    FIXTURE_INSTANTE: '2026-11-09T12:00:00.000Z', ...extras,
  }
}

async function portaLivre(): Promise<number> {
  const servidor = createServer()
  await new Promise<void>((resolve, reject) => servidor.once('error', reject).listen(0, '127.0.0.1', resolve))
  const endereco = servidor.address()
  if (!endereco || typeof endereco === 'string') throw new Error('Não foi possível reservar porta')
  await new Promise<void>((resolve, reject) => servidor.close((erro) => erro ? reject(erro) : resolve()))
  return endereco.port
}

describe('Eventos e Comentários HTTP', () => {
  let pasta: string
  let caminhoBanco: string
  let banco: DataSource
  let processo: ChildProcess
  let url: string
  let gToken: string
  let l2814Token: string
  let l674Token: string
  let semFichaToken: string
  let manifesto: Record<string, any>
  let comentarioCriadoId: string

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-eventos-comentarios-'))
    caminhoBanco = join(pasta, 'eventos-comentarios.sqlite')
    banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()

    const fixture = spawnSync(process.execPath, ['dist/src/testing/fixture-integracao/cli.js', '--etapa', 'e'], {
      cwd: process.cwd(), env: env(caminhoBanco), encoding: 'utf8', timeout: 60_000,
    })
    if (fixture.status !== 0) throw new Error(`Fixture falhou: ${fixture.stderr}`)
    manifesto = JSON.parse(fixture.stdout) as Record<string, any>

    const porta = await portaLivre()
    url = `http://127.0.0.1:${porta}`
    processo = spawn(process.execPath, ['dist/src/main.js'], {
      cwd: process.cwd(), env: env(caminhoBanco, { PORT: String(porta) }), stdio: ['ignore', 'ignore', 'pipe'],
    })
    let erro = ''
    processo.stderr?.on('data', (dados: Buffer) => { erro += dados.toString() })
    const limite = Date.now() + 20_000
    while (Date.now() < limite) {
      try { if ((await fetch(`${url}/saude`)).ok) break } catch { /* API iniciando */ }
      if (processo.exitCode !== null) throw new Error(`API encerrou: ${erro}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    ;[gToken, l2814Token, l674Token, semFichaToken] = await Promise.all([
      token('guardiao@fixture.invalid'), token('l2814@fixture.invalid'),
      token('l674@fixture.invalid'), token('lanterna-sem-ficha@fixture.invalid'),
    ])
    banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
  }, 60_000)

  afterAll(async () => {
    if (processo && processo.exitCode === null) {
      processo.kill()
      await new Promise<void>((resolve) => processo.once('exit', () => resolve()))
    }
    if (banco?.isInitialized) await banco.destroy()
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

  it('monta a etapa e com comentários de autores distintos e Evento de exclusão sem copiar o texto', async () => {
    expect(manifesto).toMatchObject({ etapa: 'e', contagens: { ocorrencia: 22, evento: 33, comentario: 3 } })
    expect(manifesto.comentarios.map((item: any) => item.id)).toEqual([
      IDS_FIXTURE_INTEGRACAO_E.comentarioLanterna,
      IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao,
      IDS_FIXTURE_INTEGRACAO_E.comentarioResolvido,
    ])
    expect(manifesto.comentarios[2].excluidoEm).not.toBeNull()
    expect(manifesto.eventos.at(-1)).toMatchObject({
      tipo: 'comentario_apagado',
      dados: { comentarioId: IDS_FIXTURE_INTEGRACAO_E.comentarioResolvido },
    })
    expect(JSON.stringify(manifesto.eventos.at(-1).dados)).not.toContain('texto')
    expect(await banco.getRepository(Comentario).find({ withDeleted: true })).toHaveLength(3)
  })

  it('lista Eventos paginados por criadoEm/id, preserva payload tipado e autor sem email', async () => {
    const primeira = await chamar(`/ocorrencias/${ocorrencia1}/eventos?pagina=1&limite=2`, { token: l2814Token })
    expect(primeira.status).toBe(200)
    expect(primeira.corpo!.dados.itens).toHaveLength(2)
    expect(primeira.corpo!.dados.meta).toEqual({ total: 3, pagina: 1, limite: 2, paginas: 2 })
    const segunda = await chamar(`/ocorrencias/${ocorrencia1}/eventos?pagina=2&limite=2`, { token: gToken })
    expect(segunda.corpo!.dados.itens).toHaveLength(1)
    const todos = [...primeira.corpo!.dados.itens, ...segunda.corpo!.dados.itens]
    expect(todos.map((item: any) => [item.criadoEm, item.id])).toEqual([...todos]
      .map((item: any) => [item.criadoEm, item.id]).sort((a: string[], b: string[]) => a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])))
    expect(todos[0]).toMatchObject({ tipo: 'criada', dados: { de: null, para: 'aberta' } })
    expect(todos[0].autor).toEqual({ id: IDS_FIXTURE_INTEGRACAO_A.guardiao, nome: 'Guardião de Teste', papel: 'guardiao' })
    expect(todos[0].autor.email).toBeUndefined()
    expect((await chamar(`/ocorrencias/${ocorrencia1}/eventos?pagina=1&limite=0`, { token: gToken })).status).toBe(400)
    expect((await chamar(`/ocorrencias/${ocorrencia1}/eventos?extra=1`, { token: gToken })).status).toBe(400)
    expect((await chamar(`/ocorrencias/${ocorrencia1}/eventos`, { token: l674Token })).status).toBe(404)
    expect((await chamar(`/ocorrencias/${ocorrenciaExcluida}/eventos`, { token: gToken })).status).toBe(404)
    expect((await chamar(`/ocorrencias/${ocorrencia2}/eventos`)).status).toBe(401)
  })

  it('lista comentários não excluídos com paginação e resumo de autor, inclusive leitura em ocorrência resolvida', async () => {
    const pagina = await chamar(`/ocorrencias/${ocorrencia1}/comentarios?limite=1`, { token: l2814Token })
    expect(pagina.status).toBe(200)
    expect(pagina.corpo!.dados.meta).toEqual({ total: 2, pagina: 1, limite: 1, paginas: 2 })
    expect(pagina.corpo!.dados.itens[0]).toMatchObject({
      id: IDS_FIXTURE_INTEGRACAO_E.comentarioLanterna,
      autor: { id: IDS_FIXTURE_INTEGRACAO_A.lanterna2814, nome: 'Lanterna Setor 2814', papel: 'lanterna' },
    })
    expect(pagina.corpo!.dados.itens[0].autor.email).toBeUndefined()
    expect(pagina.corpo!.dados.itens[0].excluidoEm).toBeUndefined()
    const resolvida = await chamar(`/ocorrencias/${ocorrencia4}/comentarios`, { token: l674Token })
    expect(resolvida.status).toBe(200)
    expect(resolvida.corpo!.dados).toMatchObject({ itens: [], meta: { total: 0, paginas: 0 } })
    const eventoExclusao = await chamar(`/ocorrencias/${ocorrencia4}/eventos`, { token: l674Token })
    expect(eventoExclusao.corpo!.dados.itens.at(-1)).toMatchObject({
      tipo: 'comentario_apagado', dados: { comentarioId: IDS_FIXTURE_INTEGRACAO_E.comentarioResolvido },
    })
    expect((await chamar(`/ocorrencias/${ocorrencia1}/comentarios`, { token: l674Token })).status).toBe(404)
    expect((await chamar(`/ocorrencias/${ocorrenciaExcluida}/comentarios`, { token: gToken })).status).toBe(404)
    expect((await chamar(`/ocorrencias/${ocorrencia1}/comentarios?pagina=x`, { token: gToken })).status).toBe(400)
  })

  it('cria comentário em resolvida, valida o corpo e não cria Evento', async () => {
    const antes = await banco.getRepository(Evento).count()
    const criado = await chamar(`/ocorrencias/${ocorrencia4}/comentarios`, {
      token: l674Token, body: { texto: 'Relato adicional após a resolução.' },
    })
    expect(criado.status).toBe(201)
    comentarioCriadoId = criado.corpo!.dados.id as string
    expect(criado.corpo!.dados).toMatchObject({
      ocorrenciaId: ocorrencia4,
      autorId: IDS_FIXTURE_INTEGRACAO_A.lanterna674,
      autor: { id: IDS_FIXTURE_INTEGRACAO_A.lanterna674, papel: 'lanterna' },
      texto: 'Relato adicional após a resolução.',
    })
    expect(await banco.getRepository(Evento).count()).toBe(antes)
    expect((await chamar(`/ocorrencias/${ocorrencia1}/comentarios`, { token: l674Token, body: { texto: 'fora do Setor' } })).status).toBe(404)
    expect((await chamar(`/ocorrencias/${ocorrencia1}/comentarios`, { token: l2814Token, body: { texto: '' } })).status).toBe(400)
    expect((await chamar(`/ocorrencias/${ocorrencia1}/comentarios`, { token: l2814Token, body: { texto: 'ok', extra: true } })).status).toBe(400)
    expect((await chamar(`/ocorrencias/${ocorrencia1}/comentarios`, { token: l2814Token, body: { texto: 'x'.repeat(1001) } })).status).toBe(400)
  })

  it('exclui em transação, oculta do GET e aplica escopo antes da autoria', async () => {
    const comentarioDeOcorrenciaExcluida = 'a0830000-0000-4000-8000-000000000004'
    await banco.getRepository(Comentario).save({
      id: comentarioDeOcorrenciaExcluida,
      ocorrenciaId: ocorrenciaExcluida,
      autorId: IDS_FIXTURE_INTEGRACAO_A.guardiao,
      texto: 'Comentário histórico em Ocorrência excluída.',
    })
    expect((await chamar(`/comentarios/${comentarioDeOcorrenciaExcluida}`, { method: 'DELETE', token: gToken })).status).toBe(404)

    const autor = await chamar(`/comentarios/${IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao}`, { method: 'DELETE', token: semFichaToken })
    expect(autor.status).toBe(403)
    const escopo = await chamar(`/comentarios/${IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao}`, { method: 'DELETE', token: l674Token })
    expect(escopo.status).toBe(404)

    const excluido = await chamar(`/comentarios/${IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao}`, { method: 'DELETE', token: gToken })
    expect(excluido.status).toBe(204)
    expect(excluido.corpo).toBeUndefined()
    expect((await chamar(`/ocorrencias/${ocorrencia1}/comentarios`, { token: gToken })).corpo!.dados.meta.total).toBe(1)
    expect((await banco.getRepository(Comentario).findOneBy({ id: IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao }))).toBeNull()
    const comExcluidos = await banco.getRepository(Comentario).findOne({ where: { id: IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao }, withDeleted: true })
    expect(comExcluidos?.excluidoEm).not.toBeNull()
    const eventos = await banco.getRepository(Evento).find({ where: { tipo: 'comentario_apagado' } })
    expect(eventos.find((evento) => evento.dados.comentarioId === IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao)).toMatchObject({
      autorId: IDS_FIXTURE_INTEGRACAO_A.guardiao,
      dados: { comentarioId: IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao },
    })
    expect(JSON.stringify(eventos.find((evento) => evento.dados.comentarioId === IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao)?.dados)).not.toContain('texto')
    expect((await chamar(`/comentarios/${IDS_FIXTURE_INTEGRACAO_E.comentarioLanterna}`, { method: 'DELETE', token: l2814Token })).status).toBe(204)
    expect((await chamar(`/ocorrencias/${ocorrencia1}/comentarios`, { token: gToken })).corpo!.dados.meta.total).toBe(0)
    expect((await chamar(`/comentarios/${IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao}`, { method: 'DELETE', token: gToken })).status).toBe(404)
    expect((await chamar(`/comentarios/${IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao}`, { method: 'DELETE' })).status).toBe(401)
    expect((await chamar(`/comentarios/${IDS_FIXTURE_INTEGRACAO_E.comentarioLanterna}`, { method: 'PATCH', token: l2814Token, body: { texto: 'editado' } })).status).toBe(404)
    expect((await chamar(`/eventos/${eventos.at(-1)?.id}`, { method: 'DELETE', token: gToken })).status).toBe(404)
  })

  it('faz rollback do soft delete se falhar a gravação do Evento', async () => {
    const eventosAntes = await banco.getRepository(Evento).count()
    const comentario = new ComentariosRepository(banco.getRepository(Comentario))
    const ocorrencias = new OcorrenciasRepository(banco.getRepository(Ocorrencia))
    const escritorFalho = { gravarComentarioApagado: async () => { throw new Error('falha de gravação') } }
    const service = new ComentariosService(comentario, ocorrencias, escritorFalho as unknown as EventosService, banco)
    await expect(service.excluir(
      comentarioCriadoId,
      {
        id: IDS_FIXTURE_INTEGRACAO_A.guardiao,
        nome: 'Guardião de Teste', email: 'guardiao@fixture.invalid', papel: 'guardiao',
        setorId: null, lanternaId: null, criadoEm: new Date(),
      },
    )).rejects.toThrow('falha de gravação')
    const persistido = await banco.getRepository(Comentario).findOneBy({ id: comentarioCriadoId })
    expect(persistido?.excluidoEm).toBeNull()
    expect(await banco.getRepository(Evento).count()).toBe(eventosAntes)
  })

  it('retorna 404 para rotas de edição e alteração de Evento inexistentes', async () => {
    expect((await chamar(`/eventos/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`, { method: 'PATCH', token: gToken, body: { tipo: 'criada' } })).status).toBe(404)
    expect((await chamar(`/eventos/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`, { method: 'DELETE', token: gToken })).status).toBe(404)
    expect((await chamar(`/comentarios/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`, { method: 'PATCH', token: gToken, body: { texto: 'x' } })).status).toBe(404)
  })
})
