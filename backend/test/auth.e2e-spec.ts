import { mkdtemp, rm } from 'node:fs/promises'
import { createHmac } from 'node:crypto'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import { DataSource } from 'typeorm'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { validarAmbiente } from '../src/config/ambiente.js'
import { Setor } from '../src/setores/setor.entity.js'
import { SetoresRepository } from '../src/setores/setores.repository.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'

const segredo = 'teste-de-integracao-segredo-com-32-bytes-minimo'
const origem = 'http://localhost:3000'

function jwt(payload: Record<string, unknown>): string {
  const codificar = (valor: unknown) => Buffer.from(JSON.stringify(valor)).toString('base64url')
  const entrada = `${codificar({ alg: 'HS256', typ: 'JWT' })}.${codificar(payload)}`
  const assinatura = createHmac('sha256', segredo).update(entrada).digest('base64url')
  return `${entrada}.${assinatura}`
}

async function portaLivre(): Promise<number> {
  const servidor = createServer()
  await new Promise<void>((resolve, reject) => servidor.once('error', reject).listen(0, '127.0.0.1', resolve))
  const endereco = servidor.address()
  if (!endereco || typeof endereco === 'string') throw new Error('Não foi possível alocar porta')
  await new Promise<void>((resolve, reject) => servidor.close((erro) => erro ? reject(erro) : resolve()))
  return endereco.port
}

describe('Autenticação HTTP', () => {
  let pasta: string
  let caminhoBanco: string
  let processo: ChildProcess
  let url: string
  let saida = ''
  let erroSaida = ''

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-auth-'))
    caminhoBanco = join(pasta, 'auth.sqlite')
    const ambienteBanco = validarAmbiente({
      PORT: '3001', DATABASE_PATH: caminhoBanco, JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h',
      CORS_ORIGIN: origem, LOGIN_LIMITE: '5', LOGIN_JANELA_SEGUNDOS: '60',
    })
    const banco = new DataSource(criarOpcoesBanco(ambienteBanco))
    await banco.initialize()
    await banco.runMigrations()
    const setores = new SetoresRepository(banco.getRepository(Setor))
    await setores.salvar({ id: 2814, nome: 'Setor 2814', descricao: 'Fixture de autenticação' })
    await banco.destroy()

    const porta = await portaLivre()
    url = `http://127.0.0.1:${porta}`
    processo = spawn(process.execPath, ['dist/src/main.js'], {
      cwd: process.cwd(),
      env: {
        ...process.env, NODE_ENV: 'development', PORT: String(porta), DATABASE_PATH: caminhoBanco,
        JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: origem,
        LOGIN_LIMITE: '5', LOGIN_JANELA_SEGUNDOS: '60',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    processo.stdout?.on('data', (d: Buffer) => { saida += d.toString() })
    processo.stderr?.on('data', (d: Buffer) => { erroSaida += d.toString() })
    const limite = Date.now() + 20_000
    while (Date.now() < limite) {
      try {
        const resposta = await fetch(`${url}/saude`)
        if (resposta.ok) return
      } catch { /* API ainda iniciando */ }
      if (processo.exitCode !== null) throw new Error(`API encerrou: ${saida}\n${erroSaida}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error(`API não iniciou: ${saida}\n${erroSaida}`)
  }, 30_000)

  afterAll(async () => {
    if (processo && processo.exitCode === null) {
      processo.kill()
      await new Promise<void>((resolve) => processo.once('exit', () => resolve()))
    }
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  async function chamar(caminho: string, dados?: unknown, token?: string) {
    const resposta = await fetch(`${url}${caminho}`, {
      method: dados === undefined ? 'GET' : 'POST',
      headers: { ...(dados === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      ...(dados === undefined ? {} : { body: JSON.stringify(dados) }),
    })
    return { status: resposta.status, corpo: await resposta.json() as Record<string, any> }
  }

  it('cadastra conta Lanterna sem hash ou token, normalizando email', async () => {
    const resposta = await chamar('/auth/cadastro', { nome: 'Lanterna de Teste', email: ' TESTE@EXAMPLE.TEST ', senha: 'segredo-123', setorId: 2814 })
    expect(resposta.status).toBe(201)
    expect(resposta.corpo.dados).toMatchObject({ nome: 'Lanterna de Teste', email: 'teste@example.test', papel: 'lanterna', lanternaId: null, setorId: 2814 })
    expect(resposta.corpo.dados).not.toHaveProperty('senhaHash')
    expect(resposta.corpo.dados).not.toHaveProperty('token')
  })

  it('rejeita papel extra, setor inexistente, duplicidade e senha que excede limite UTF-8', async () => {
    const corpo = { nome: 'Outra Lanterna', email: 'outra@example.test', senha: 'senha-123', setorId: 2814 }
    expect((await chamar('/auth/cadastro', { ...corpo, papel: 'guardiao' })).status).toBe(400)
    expect((await chamar('/auth/cadastro', { ...corpo, email: 'inexistente@example.test', setorId: 9999 })).status).toBe(404)
    expect((await chamar('/auth/cadastro', { ...corpo, email: ' TESTE@EXAMPLE.TEST ' })).status).toBe(409)
    const limite = await chamar('/auth/cadastro', { ...corpo, email: 'limite@example.test', senha: '🟢'.repeat(18) })
    expect(limite.status).toBe(201)
    const excedida = await chamar('/auth/cadastro', { ...corpo, email: 'grande@example.test', senha: '🟢'.repeat(19) })
    expect(excedida.status).toBe(400)
    expect(JSON.stringify(excedida.corpo)).toContain('senha')
    const loginExcedido = await chamar('/auth/login', { email: 'teste@example.test', senha: 'x'.repeat(73) })
    expect(loginExcedido.status).toBe(400)
    expect(JSON.stringify(loginExcedido.corpo)).toContain('senha')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente({ PORT: '3001', DATABASE_PATH: caminhoBanco, JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: origem, LOGIN_LIMITE: '20', LOGIN_JANELA_SEGUNDOS: '60' })))
    await banco.initialize()
    expect(await banco.getRepository(Usuario).countBy({ email: 'grande@example.test' })).toBe(0)
    await banco.destroy()
  })

  it('dá o mesmo 401 para conta ausente e senha incorreta; login retorna claims mínimas e /me é protegido', async () => {
    const ausente = await chamar('/auth/login', { email: 'ausente@example.test', senha: 'senha-incorreta' })
    const incorreta = await chamar('/auth/login', { email: 'teste@example.test', senha: 'senha-incorreta' })
    expect(ausente.status).toBe(401)
    expect(ausente.corpo).toMatchObject({ sucesso: false, erro: { status: 401, codigo: 'CREDENCIAIS_INVALIDAS', mensagem: incorreta.corpo.erro.mensagem } })
    expect((await chamar('/auth/me')).status).toBe(401)
    const login = await chamar('/auth/login', { email: ' TESTE@EXAMPLE.TEST ', senha: 'segredo-123' })
    expect(login.status).toBe(200)
    expect(login.corpo.dados).toMatchObject({ expiresIn: 28800 })
    const [, payload] = login.corpo.dados.token.split('.')
    expect(Object.keys(JSON.parse(Buffer.from(payload, 'base64url').toString())).sort()).toEqual(['email', 'exp', 'iat', 'papel', 'sub'])
    const me = await chamar('/auth/me', undefined, login.corpo.dados.token)
    expect(me.status).toBe(200)
    expect(me.corpo.dados.email).toBe('teste@example.test')
    expect(me.corpo.dados).not.toHaveProperty('senhaHash')
  })

  it('rejeita token adulterado e expirado e recarrega papel a partir do banco', async () => {
    const login = await chamar('/auth/login', { email: 'teste@example.test', senha: 'segredo-123' })
    const token = login.corpo.dados.token as string
    const adulterado = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`
    expect((await chamar('/auth/me', undefined, adulterado)).status).toBe(401)
    expect((await chamar('/auth/me', undefined, jwt({ sub: 'id', email: 'x@example.test', papel: 'lanterna', exp: 1 }))).status).toBe(401)
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente({ PORT: '3001', DATABASE_PATH: caminhoBanco, JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: origem, LOGIN_LIMITE: '20', LOGIN_JANELA_SEGUNDOS: '60' })))
    await banco.initialize()
    await banco.getRepository(Usuario).update({ email: 'teste@example.test' }, { papel: 'guardiao' })
    await banco.destroy()
    const me = await chamar('/auth/me', undefined, token)
    expect(me.corpo.dados.papel).toBe('guardiao')
    expect(`${saida}${erroSaida}`).not.toContain('segredo-123')
    expect(`${saida}${erroSaida}`).not.toContain(token)
  })

  it('limita tentativas de login e responde 429', async () => {
    const respostas = []
    for (let tentativa = 0; tentativa < 8; tentativa += 1) {
      respostas.push(await chamar('/auth/login', { email: 'ausente@example.test', senha: 'incorreta' }))
    }
    expect(respostas.some(({ status }) => status === 429)).toBe(true)
    expect(JSON.stringify(respostas.find(({ status }) => status === 429)?.corpo)).toContain('MUITAS_TENTATIVAS')
  })
})
