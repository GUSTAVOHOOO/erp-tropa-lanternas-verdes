import { execFileSync, spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { CONTAS_FIXTURE_A } from '../src/testing/fixture-integracao/ids.js'
import { Setor } from '../src/setores/setor.entity.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'

const senha = 'senha-fixture-teste-4821'
const jwtSecret = 'segredo-de-integracao-com-mais-de-trinta-e-dois-bytes'

function env(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NODE_ENV: 'test',
    PORT: '3001',
    DATABASE_PATH: databasePath,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: '8h',
    CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '20',
    LOGIN_JANELA_SEGUNDOS: '60',
    ...extras,
  }
}

function executar(arquivo: string, args: string[], ambiente: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, [arquivo, ...args], {
    cwd: process.cwd(), env: ambiente, encoding: 'utf8', timeout: 30_000,
  })
}

async function portaLivre(): Promise<number> {
  const servidor = createServer()
  await new Promise<void>((resolve, reject) => servidor.once('error', reject).listen(0, '127.0.0.1', resolve))
  const endereco = servidor.address()
  if (!endereco || typeof endereco === 'string') throw new Error('Não foi possível alocar porta')
  await new Promise<void>((resolve, reject) => servidor.close((erro) => erro ? reject(erro) : resolve()))
  return endereco.port
}

describe('fixture de integração — etapa a', () => {
  let pasta: string
  let caminhoBanco: string
  let manifestoPath: string
  let processo: ChildProcess
  let url: string

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-fixture-a-'))
    caminhoBanco = join(pasta, 'integracao.sqlite')
    manifestoPath = join(pasta, 'manifesto.json')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()

    const resultado = executar('dist/src/testing/fixture-integracao/cli.js', ['--saida', manifestoPath], env(caminhoBanco, { FIXTURE_SENHA: senha }))
    expect(resultado.status).toBe(0)
    expect(resultado.stderr).toBe('')
    const textoManifesto = await readFile(manifestoPath, 'utf8')
    expect(textoManifesto).not.toContain(senha)
    expect(textoManifesto).not.toMatch(/senhaHash|token/i)

    const porta = await portaLivre()
    url = `http://127.0.0.1:${porta}`
    processo = spawn(process.execPath, ['dist/src/main.js'], {
      cwd: process.cwd(),
      env: env(caminhoBanco, { NODE_ENV: 'development', PORT: String(porta) }),
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    let erro = ''
    processo.stderr?.on('data', (d: Buffer) => { erro += d.toString() })
    const limite = Date.now() + 20_000
    while (Date.now() < limite) {
      try {
        if ((await fetch(`${url}/saude`)).ok) return
      } catch { /* API inicializando */ }
      if (processo.exitCode !== null) throw new Error(`API da fixture encerrou: ${erro}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error(`API da fixture não iniciou: ${erro}`)
  }, 30_000)

  afterAll(async () => {
    if (processo && processo.exitCode === null) {
      processo.kill()
      await new Promise<void>((resolve) => processo.once('exit', () => resolve()))
    }
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  it('grava os dados fixos e login real autentica as cinco contas pela API', async () => {
    const manifesto = JSON.parse(await readFile(manifestoPath, 'utf8'))
    expect(manifesto).toMatchObject({ versaoContrato: '1.0.0', etapa: 'a', contagens: { setor: 2, usuario: 5, lanterna: 0 } })
    expect(manifesto.contas.map(({ caso }: { caso: string }) => caso)).toEqual(['G', 'G2', 'L2814', 'L674', 'L-sem-ficha'])

    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    expect(await banco.getRepository(Setor).count()).toBe(2)
    expect(await banco.getRepository(Usuario).count()).toBe(5)
    const hashes = await banco.getRepository(Usuario).createQueryBuilder('usuario').addSelect('usuario.senhaHash').getMany()
    expect(hashes.every((usuario) => usuario.senhaHash.startsWith('$2'))).toBe(true)
    expect(hashes.every((usuario) => usuario.lanternaId === null)).toBe(true)
    await banco.destroy()

    for (const conta of CONTAS_FIXTURE_A) {
      const resposta = await fetch(`${url}/auth/login`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: conta.email, senha }),
      })
      expect(resposta.status).toBe(200)
      const corpo = await resposta.json() as { dados: { token: string; usuario: { id: string; papel: string; setorId: number | null } } }
      expect(corpo.dados.usuario).toMatchObject({ id: conta.id, papel: conta.papel, setorId: conta.setorId })
      const atual = await fetch(`${url}/auth/me`, { headers: { authorization: `Bearer ${corpo.dados.token}` } })
      expect(atual.status).toBe(200)
      const respostaAtual = await atual.json() as { dados: { id: string; lanternaId: string | null } }
      expect(respostaAtual.dados).toMatchObject({ id: conta.id, lanternaId: null })
    }
  })

  it('recusa banco com dados, produção e senha ausente', async () => {
    const repeticao = executar('dist/src/testing/fixture-integracao/cli.js', [], env(caminhoBanco, { FIXTURE_SENHA: senha }))
    expect(repeticao.status).not.toBe(0)
    expect(repeticao.stderr).toContain('banco migrado e vazio')

    const producao = executar('dist/src/testing/fixture-integracao/cli.js', [], env(caminhoBanco, { NODE_ENV: 'production', FIXTURE_SENHA: senha }))
    expect(producao.status).not.toBe(0)
    expect(producao.stderr).toContain('proibida em produção')

    const semSenha = executar('dist/src/testing/fixture-integracao/cli.js', [], env(caminhoBanco))
    expect(semSenha.status).not.toBe(0)
    expect(semSenha.stderr).toContain('FIXTURE_SENHA é obrigatória')

    const caminhoRelativo = executar('dist/src/testing/fixture-integracao/cli.js', [], env('relative.sqlite', { FIXTURE_SENHA: senha }))
    expect(caminhoRelativo.status).not.toBe(0)
    expect(caminhoRelativo.stderr).toContain('DATABASE_PATH absoluto')
  })
})
