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
import { Setor } from '../src/setores/setor.entity.js'
import { SetoresRepository } from '../src/setores/setores.repository.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'
import { UsuariosRepository } from '../src/usuarios/usuarios.repository.js'

const senhaFixture = 'senha-de-teste-setores-972'
const segredo = 'segredo-e2e-setores-com-mais-de-trinta-e-dois-bytes'

function env(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'development', PORT: '3001', DATABASE_PATH: databasePath,
    JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '20', LOGIN_JANELA_SEGUNDOS: '60', ...extras,
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

describe('Setores HTTP', () => {
  let pasta: string
  let caminhoBanco: string
  let processo: ChildProcess
  let url: string
  let guardiaoToken: string
  let lanternaToken: string

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-setores-'))
    caminhoBanco = join(pasta, 'setores.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()
    executarFixture(caminhoBanco)

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

  it('publica lista ordenada e consulta Setor por inteiro', async () => {
    const lista = await chamar('/setores')
    expect(lista.status).toBe(200)
    expect(lista.corpo.dados.map((setor: { id: number }) => setor.id)).toEqual([674, 2814])
    expect((await chamar('/setores/2814')).corpo.dados).toEqual({
      id: 2814,
      nome: 'Setor 2814',
      descricao: 'Inclui a Terra. Um dos setores mais movimentados do universo.',
    })
    expect((await chamar('/setores/invalido')).status).toBe(400)
    expect((await chamar('/setores/-1')).status).toBe(400)
    expect((await chamar('/setores/10000')).status).toBe(400)
    expect((await chamar('/setores/9999')).status).toBe(404)
  })

  it('aplica autenticação e papel antes de validar a escrita', async () => {
    expect((await chamar('/setores', { body: {} })).status).toBe(401)
    const lanternas = await chamar('/setores', { body: {}, token: lanternaToken })
    expect(lanternas.status).toBe(403)
    expect(lanternas.corpo.erro.codigo).toBe('SEM_PERMISSAO')
  })

  it('valida limites, unicidade, edição parcial e não aceita id no PATCH', async () => {
    const corpo = { id: 0, nome: '  Setor Livre  ', descricao: '  Descrição de um setor livre.  ' }
    const criado = await chamar('/setores', { body: corpo, token: guardiaoToken })
    expect(criado.status).toBe(201)
    expect(criado.corpo.dados).toEqual({ id: 0, nome: 'Setor Livre', descricao: 'Descrição de um setor livre.' })
    expect((await chamar('/setores', { body: corpo, token: guardiaoToken })).corpo.erro.codigo).toBe('SETOR_JA_CADASTRADO')
    expect((await chamar('/setores', { body: { ...corpo, id: 10000 }, token: guardiaoToken })).status).toBe(400)
    expect((await chamar('/setores', { body: { ...corpo, nome: 'X' }, token: guardiaoToken })).status).toBe(400)
    expect((await chamar('/setores', { body: { ...corpo, extra: true }, token: guardiaoToken })).status).toBe(400)
    expect((await chamar('/setores', { body: { ...corpo, id: null }, token: guardiaoToken })).status).toBe(400)
    const limiteMaximo = await chamar('/setores', { body: { ...corpo, id: 9999 }, token: guardiaoToken })
    expect(limiteMaximo.status).toBe(201)
    expect((await chamar('/setores/9999', { method: 'DELETE', token: guardiaoToken })).status).toBe(204)

    expect((await chamar('/setores/0', { method: 'PATCH', body: {}, token: guardiaoToken })).status).toBe(400)
    expect((await chamar('/setores/0', { method: 'PATCH', body: { id: 10 }, token: guardiaoToken })).status).toBe(400)
    expect((await chamar('/setores/0', { method: 'PATCH', body: { nome: null }, token: guardiaoToken })).status).toBe(400)
    const editado = await chamar('/setores/0', { method: 'PATCH', body: { nome: '  Setor Novo  ' }, token: guardiaoToken })
    expect(editado.status).toBe(200)
    expect(editado.corpo.dados).toEqual({ id: 0, nome: 'Setor Novo', descricao: 'Descrição de um setor livre.' })
    expect((await chamar('/setores/1', { method: 'PATCH', body: { descricao: 'Descrição válida.' }, token: guardiaoToken })).status).toBe(404)
  })

  it('recusa exclusão com Usuário, Lanterna ou Ocorrência histórica ligada', async () => {
    expect((await chamar('/setores/2814', { method: 'DELETE', token: guardiaoToken })).corpo.erro.codigo).toBe('SETOR_EM_USO')

    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    const setores = new SetoresRepository(banco.getRepository(Setor))
    const lanternas = new LanternasRepository(banco.getRepository(Lanterna))
    const ocorrencias = new OcorrenciasRepository(banco.getRepository(Ocorrencia))
    const usuarios = new UsuariosRepository(banco.getRepository(Usuario))

    await setores.salvar({ id: 500, nome: 'Setor de Lanterna', descricao: 'Setor ligado a Lanterna.' })
    await lanternas.salvar({
      id: 'lanterna-setor-500', codinome: 'Lanterna Teste', identidadeCivil: null,
      especie: null, planetaNatal: null, setorId: 500, status: 'ativo', anoIngresso: null,
      primeiraAparicao: null, habilidades: [], mentorId: null, citacao: null,
      biografia: null, fontes: {},
    })

    await setores.salvar({ id: 501, nome: 'Setor de Ocorrência', descricao: 'Setor ligado a Ocorrência.' })
    await ocorrencias.salvar({
      id: randomUUID(), titulo: 'Ocorrência de teste', descricao: 'Descrição de ocorrência de teste.',
      planeta: 'Terra', setorId: 501, gravidade: 'baixa', status: 'aberta', envolvidos: 1,
      responsavelId: null, resolucao: null, criadaPorId: 'f1f68873-7ea3-4e5a-817f-aca74d4d2814',
    })
    const historica = await ocorrencias.buscarPorTitulo('Ocorrência de teste')
    expect(historica).toHaveLength(1)
    await ocorrencias.excluirSuavemente(historica[0].id)

    await setores.salvar({ id: 502, nome: 'Setor de Usuário', descricao: 'Setor ligado a Usuário.' })
    await usuarios.salvar({
      id: randomUUID(), nome: 'Conta sem Ficha', email: 'conta-sem-ficha@setores.invalid',
      senhaHash: '$2b$10$fixturehashfixturehashfixturehashfixturehashfixturehashfi',
      papel: 'lanterna', setorId: 502, lanternaId: null,
    })
    await banco.destroy()

    expect((await chamar('/setores/500', { method: 'DELETE', token: guardiaoToken })).corpo.erro.codigo).toBe('SETOR_EM_USO')
    expect((await chamar('/setores/501', { method: 'DELETE', token: guardiaoToken })).corpo.erro.codigo).toBe('SETOR_EM_USO')
    expect((await chamar('/setores/502', { method: 'DELETE', token: guardiaoToken })).corpo.erro.codigo).toBe('SETOR_EM_USO')
  })

  it('exclui setor livre com 204 sem corpo e retorna 404 no seguinte', async () => {
    const removido = await chamar('/setores/0', { method: 'DELETE', token: guardiaoToken })
    expect(removido.status).toBe(204)
    expect(removido.texto).toBe('')
    expect((await chamar('/setores/0', { method: 'GET' })).status).toBe(404)
    expect((await chamar('/setores/8888', { method: 'DELETE', token: guardiaoToken })).status).toBe(404)
  })
})
