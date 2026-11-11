import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'

/**
 * Regressões dos defeitos encontrados na auditoria de 2026-11-11
 * (docs/relatorios/auditoria-2026-11-11/). Cada caso reproduz um defeito pela API real.
 */
const senhaFixture = 'senha-de-teste-auditoria-628'
const segredo = 'segredo-e2e-auditoria-com-mais-de-trinta-e-dois-bytes'
const idL2814 = '6d77f441-a918-4716-9343-7823028c2814'

function env(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'development', PORT: '3001', DATABASE_PATH: databasePath,
    JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '100', LOGIN_JANELA_SEGUNDOS: '60', ...extras,
  }
}

async function portaLivre(): Promise<number> {
  const servidor = createServer()
  await new Promise<void>((resolve, reject) => servidor.once('error', reject).listen(0, '127.0.0.1', resolve))
  const endereco = servidor.address()
  if (!endereco || typeof endereco === 'string') throw new Error('Não foi possível alocar porta')
  await new Promise<void>((resolve, reject) => servidor.close((erro) => erro ? reject(erro) : resolve()))
  return endereco.port
}

describe('Correções da auditoria de 2026-11-11', () => {
  let pasta: string
  let processo: ChildProcess
  let url: string
  let guardiao: string
  let lanterna: string

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-auditoria-'))
    const caminhoBanco = join(pasta, 'auditoria.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()
    const fixture = spawnSync(process.execPath, ['dist/src/testing/fixture-integracao/cli.js'], {
      cwd: process.cwd(), env: env(caminhoBanco, { FIXTURE_SENHA: senhaFixture }),
      encoding: 'utf8', timeout: 30_000,
    })
    if (fixture.status !== 0) throw new Error(`Fixture falhou: ${fixture.stderr}`)

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
    guardiao = await entrar('guardiao@fixture.invalid')
    lanterna = await entrar('l2814@fixture.invalid')
  }, 40_000)

  afterAll(async () => {
    if (processo && processo.exitCode === null) {
      processo.kill()
      await new Promise<void>((resolve) => processo.once('exit', () => resolve()))
    }
    if (pasta) await rm(pasta, { recursive: true, force: true })
  })

  async function entrar(email: string): Promise<string> {
    const resposta = await fetch(`${url}/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, senha: senhaFixture }),
    })
    const corpo = await resposta.json() as { dados: { token: string } }
    if (!resposta.ok) throw new Error('Não foi possível autenticar fixture')
    return corpo.dados.token
  }

  async function chamar(caminho: string, opcoes: { method?: string; body?: unknown; token?: string; bruto?: string } = {}) {
    const temCorpo = opcoes.body !== undefined || opcoes.bruto !== undefined
    const resposta = await fetch(`${url}${caminho}`, {
      method: opcoes.method ?? (temCorpo ? 'POST' : 'GET'),
      headers: {
        ...(temCorpo ? { 'content-type': 'application/json' } : {}),
        ...(opcoes.token ? { authorization: `Bearer ${opcoes.token}` } : {}),
      },
      ...(temCorpo ? { body: opcoes.bruto ?? JSON.stringify(opcoes.body) } : {}),
    })
    const texto = await resposta.text()
    return { status: resposta.status, corpo: texto ? JSON.parse(texto) as Record<string, any> : undefined }
  }

  const ocorrenciaValida = {
    titulo: 'Falha no portal de teste', descricao: 'Descrição suficientemente longa.',
    planeta: 'Terra', gravidade: 'baixa', envolvidos: 3,
  }

  describe('filtros e paginação', () => {
    it('GET /lanternas?setor=N aceita Setor válido (era 400 sempre)', async () => {
      const r = await chamar('/lanternas?setor=2814')
      expect(r.status).toBe(200)
      const invalido = await chamar('/lanternas?setor=abc')
      expect(invalido.status).toBe(400)
    })

    it.each(['/lanternas', '/usuarios', '/ocorrencias'])('%s?pagina=numero gigante responde 400, não 500', async (caminho) => {
      const r = await chamar(`${caminho}?pagina=1000000000000000000000`, { token: guardiao })
      expect(r.status).toBe(400)
      expect(r.corpo.erro.codigo).toBe('DADOS_INVALIDOS')
    })
  })

  describe('query desconhecida', () => {
    it.each([
      ['/saude?inexistente=1', undefined],
      ['/auth/me?inexistente=1', 'lanterna'],
      ['/setores?inexistente=1', 'lanterna'],
      ['/setores/2814?inexistente=1', 'lanterna'],
    ])('%s responde 400 com o campo desconhecido', async (caminho, quem) => {
      const r = await chamar(caminho, { token: quem ? lanterna : undefined })
      expect(r.status).toBe(400)
      expect(r.corpo.erro.codigo).toBe('DADOS_INVALIDOS')
      expect(r.corpo.erro.detalhes.map((d: { campo: string }) => d.campo)).toContain('inexistente')
    })

    it('sem token continua 401 (autenticação antes da validação)', async () => {
      const r = await chamar('/auth/me?inexistente=1')
      expect(r.status).toBe(401)
    })
  })

  describe('corpo sem coerção de tipo', () => {
    it('Ocorrência recusa número no lugar de texto e texto no lugar de número', async () => {
      for (const corpo of [
        { ...ocorrenciaValida, titulo: 12345678 },
        { ...ocorrenciaValida, envolvidos: true },
        { ...ocorrenciaValida, envolvidos: '3' },
      ]) {
        const r = await chamar('/ocorrencias', { body: corpo, token: lanterna })
        expect(r.status).toBe(400)
      }
      const ok = await chamar('/ocorrencias', { body: ocorrenciaValida, token: lanterna })
      expect(ok.status).toBe(201)
    })

    it('Guardião não cria Ocorrência com setorId em texto', async () => {
      const r = await chamar('/ocorrencias', { body: { ...ocorrenciaValida, setorId: '2814' }, token: guardiao })
      expect(r.status).toBe(400)
    })

    it('Setor recusa id em texto', async () => {
      const r = await chamar('/setores', {
        body: { id: '9000', nome: 'Setor novo', descricao: 'Descrição do setor novo.' }, token: guardiao,
      })
      expect(r.status).toBe(400)
    })

    it('troca de papel recusa setorId em texto', async () => {
      const r = await chamar(`/usuarios/${idL2814}/papel`, { method: 'PATCH', body: { papel: 'lanterna', setorId: '674' }, token: guardiao })
      expect(r.status).toBe(400)
    })
  })

  describe('texto aparado antes de medir', () => {
    it('recusa título, descrição e planeta só com espaços', async () => {
      for (const campo of ['titulo', 'descricao', 'planeta'] as const) {
        const r = await chamar('/ocorrencias', { body: { ...ocorrenciaValida, [campo]: '                    ' }, token: lanterna })
        expect(r.status).toBe(400)
      }
    })

    it('recusa comentário só com espaços e apara o comentário válido', async () => {
      const criada = await chamar('/ocorrencias', { body: ocorrenciaValida, token: lanterna })
      const id = criada.corpo.dados.id as string
      const vazio = await chamar(`/ocorrencias/${id}/comentarios`, { body: { texto: '     ' }, token: lanterna })
      expect(vazio.status).toBe(400)
      const ok = await chamar(`/ocorrencias/${id}/comentarios`, { body: { texto: '  oi  ' }, token: lanterna })
      expect(ok.status).toBe(201)
      expect(ok.corpo.dados.texto).toBe('oi')
    })
  })

  describe('erros', () => {
    it('detalhes agrupam as mensagens por campo', async () => {
      const r = await chamar('/ocorrencias', { body: { titulo: 'x' }, token: lanterna })
      expect(r.status).toBe(400)
      const campos = r.corpo.erro.detalhes.map((d: { campo: string }) => d.campo)
      expect(new Set(campos).size).toBe(campos.length)
    })

    it('Guardião com setorId na troca de papel indica o campo setorId', async () => {
      const r = await chamar(`/usuarios/${idL2814}/papel`, { method: 'PATCH', body: { papel: 'guardiao', setorId: 674 }, token: guardiao })
      expect(r.status).toBe(400)
      const detalhe = r.corpo.erro.detalhes.find((d: { campo: string }) => d.campo === 'setorId')
      expect(detalhe).toBeDefined()
      expect(detalhe.mensagens[0]).not.toBe('')
    })

    it('corpo grande demais responde 413 com código próprio, não ERRO_INTERNO', async () => {
      const r = await chamar('/auth/login', { bruto: JSON.stringify({ email: 'a@b.co', senha: 'x'.repeat(200_000) }) })
      expect(r.status).toBe(413)
      expect(r.corpo.erro.codigo).not.toBe('ERRO_INTERNO')
    })

    it('JSON malformado responde 400 DADOS_INVALIDOS', async () => {
      const r = await chamar('/auth/login', { bruto: '{nao-e-json' })
      expect(r.status).toBe(400)
      expect(r.corpo.erro.codigo).toBe('DADOS_INVALIDOS')
    })

    it('mensagens com acentuação corretas (sem mojibake)', async () => {
      const r = await chamar('/usuarios/nao-e-uuid/papel', { method: 'PATCH', body: { papel: 'lanterna', setorId: 674 }, token: guardiao })
      expect(r.status).toBe(400)
      expect(JSON.stringify(r.corpo)).not.toMatch(/Ã/)
    })
  })

  describe('token', () => {
    it('rejeita JWT assinado sem expiração', async () => {
      const semExp = new JwtService({ secret: segredo }).sign(
        { sub: idL2814, email: 'l2814@fixture.invalid', papel: 'lanterna' },
        { algorithm: 'HS256' },
      )
      const r = await chamar('/auth/me', { token: semExp })
      expect(r.status).toBe(401)
    })

    it('aceita o JWT emitido pela própria API', async () => {
      expect((await chamar('/auth/me', { token: lanterna })).status).toBe(200)
    })
  })

  describe('ordenação por gravidade', () => {
    it('asc vai de baixa a crítica e desc de crítica a baixa', async () => {
      for (const gravidade of ['critica', 'media', 'baixa', 'alta']) {
        const r = await chamar('/ocorrencias', { body: { ...ocorrenciaValida, titulo: `Caso ${gravidade} ordenação`, gravidade }, token: lanterna })
        expect(r.status).toBe(201)
      }
      const asc = await chamar('/ocorrencias?ordenar=gravidade&ordem=asc&limite=50', { token: guardiao })
      const desc = await chamar('/ocorrencias?ordenar=gravidade&ordem=desc&limite=50', { token: guardiao })
      const ordem = ['baixa', 'media', 'alta', 'critica']
      const rank = (itens: { gravidade: string }[]) => itens.map((i) => ordem.indexOf(i.gravidade))
      const ascRank = rank(asc.corpo.dados.itens)
      expect(ascRank).toEqual([...ascRank].sort((a, b) => a - b))
      expect(rank(desc.corpo.dados.itens)).toEqual([...ascRank].sort((a, b) => b - a))
    })
  })
})
