import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../src/config/ambiente.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { IDS_FIXTURE_INTEGRACAO_A } from '../src/testing/fixture-integracao/ids.js'

const senhaFixture = 'senha-e2e-usuarios-4821'
const segredo = 'segredo-e2e-usuarios-com-mais-de-trinta-e-dois-bytes'
const ficha2814 = 'fixture-hal-2814'
const ficha674 = 'fixture-kilowog-674'
const fichaSemSetor = 'fixture-sem-setor'

function env(databasePath: string, extras: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env, NODE_ENV: 'development', PORT: '3001', DATABASE_PATH: databasePath,
    JWT_SECRET: segredo, JWT_EXPIRES_IN: '8h', CORS_ORIGIN: 'http://localhost:3000',
    LOGIN_LIMITE: '30', LOGIN_JANELA_SEGUNDOS: '60', ...extras,
  }
}

function executarFixture(databasePath: string): void {
  const resultado = spawnSync(process.execPath, ['dist/src/testing/fixture-integracao/cli.js', '--etapa', 'b'], {
    cwd: process.cwd(), env: env(databasePath, { FIXTURE_SENHA: senhaFixture }),
    encoding: 'utf8', timeout: 30_000,
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

describe('Usuários HTTP', () => {
  let pasta: string
  let caminhoBanco: string
  let processo: ChildProcess
  let url: string
  let gToken: string
  let g2Token: string
  let l2814Token: string
  let l674Token: string
  let semFichaToken: string

  beforeAll(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'erp-usuarios-'))
    caminhoBanco = join(pasta, 'usuarios.sqlite')
    const banco = new DataSource(criarOpcoesBanco(validarAmbiente(env(caminhoBanco))))
    await banco.initialize()
    await banco.runMigrations()
    await banco.destroy()
    executarFixture(caminhoBanco)

    const porta = await portaLivre()
    url = `http://127.0.0.1:${porta}`
    processo = spawn(process.execPath, ['dist/src/main.js'], {
      cwd: process.cwd(), env: env(caminhoBanco, { PORT: String(porta) }), stdio: ['ignore', 'ignore', 'pipe'],
    })
    let erro = ''
    processo.stderr?.on('data', (dados: Buffer) => { erro += dados.toString() })
    const limite = Date.now() + 20_000
    while (Date.now() < limite) {
      try {
        if ((await fetch(`${url}/saude`)).ok) break
      } catch { /* API inicializando */ }
      if (processo.exitCode !== null) throw new Error(`API encerrou: ${erro}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    ;[gToken, g2Token, l2814Token, l674Token, semFichaToken] = await Promise.all([
      token('guardiao@fixture.invalid'),
      token('guardiao-secundario@fixture.invalid'),
      token('l2814@fixture.invalid'),
      token('l674@fixture.invalid'),
      token('lanterna-sem-ficha@fixture.invalid'),
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
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, senha: senhaFixture }),
    })
    const corpo = await resposta.json() as { dados: { token: string } }
    if (!resposta.ok) throw new Error(`Não foi possível autenticar ${email}`)
    return corpo.dados.token
  }

  async function chamar(
    caminho: string,
    options: { method?: string; body?: unknown; token?: string } = {},
  ) {
    const resposta = await fetch(`${url}${caminho}`, {
      method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
      headers: {
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    })
    const texto = await resposta.text()
    return {
      status: resposta.status,
      corpo: texto ? JSON.parse(texto) as Record<string, any> : undefined,
      texto,
    }
  }

  it('restringe lista a Guardião e filtra/pagina sem expor campos internos', async () => {
    expect((await chamar('/usuarios')).status).toBe(401)
    expect((await chamar('/usuarios', { token: l2814Token })).status).toBe(403)
    expect((await chamar('/usuarios', { token: l674Token })).status).toBe(403)

    const resposta = await chamar('/usuarios?busca=%20GUARDIAO%20&limite=1', { token: gToken })
    expect(resposta.status).toBe(200)
    expect(resposta.corpo.dados.itens).toHaveLength(1)
    expect(resposta.corpo.dados.meta).toEqual({ total: 2, pagina: 1, limite: 1, paginas: 2 })
    const usuario = resposta.corpo.dados.itens[0]
    expect(usuario).toHaveProperty('criadoEm')
    expect(usuario).not.toHaveProperty('senhaHash')
    expect(usuario).not.toHaveProperty('nomeBusca')
    expect(usuario).not.toHaveProperty('emailBusca')

    const pagina2 = await chamar('/usuarios?busca=GUARDIAO&limite=1&pagina=2', { token: gToken })
    expect(pagina2.corpo.dados.itens).toHaveLength(1)
    expect(pagina2.corpo.dados.itens[0].id).not.toBe(usuario.id)
    expect((await chamar('/usuarios?busca=%25', { token: gToken })).corpo.dados.meta.total).toBe(0)
    expect((await chamar('/usuarios?ordenar=email', { token: gToken })).status).toBe(400)
    expect((await chamar('/usuarios?pagina=1&desconhecido=1', { token: gToken })).status).toBe(400)
    expect((await chamar('/usuarios?limite=51', { token: gToken })).status).toBe(400)
    const porData = await chamar('/usuarios?ordenar=criadoEm&ordem=desc&limite=50', { token: gToken })
    expect(porData.status).toBe(200)
    expect(porData.corpo.dados.itens).toHaveLength(5)
    const alemDoFim = await chamar('/usuarios?pagina=99', { token: gToken })
    expect(alemDoFim.corpo.dados).toMatchObject({ itens: [], meta: { total: 5, pagina: 99, limite: 20, paginas: 1 } })
  })

  it('altera papel com setor válido, preserva vínculo na promoção e aplica o papel do banco ao token atual', async () => {
    const semSetor = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.guardiaoSecundario}/papel`, {
      method: 'PATCH', token: gToken, body: { papel: 'lanterna' },
    })
    expect(semSetor.status).toBe(422)
    expect(semSetor.corpo.erro.codigo).toBe('SETOR_OBRIGATORIO')

    const setorInexistente = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.guardiaoSecundario}/papel`, {
      method: 'PATCH', token: gToken, body: { papel: 'lanterna', setorId: 9999 },
    })
    expect(setorInexistente.status).toBe(404)
    expect((await chamar('/usuarios/not-uuid/papel', {
      method: 'PATCH', token: gToken, body: { papel: 'guardiao' },
    })).status).toBe(400)
    expect((await chamar('/usuarios/00000000-0000-4000-8000-000000000000/papel', {
      method: 'PATCH', token: gToken, body: { papel: 'guardiao', setorId: 2814 },
    })).status).toBe(400)
    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.guardiaoSecundario}/papel`, {
      method: 'PATCH', token: gToken, body: { papel: 'lanterna', setorId: null },
    })).status).toBe(400)
    expect((await chamar('/usuarios/00000000-0000-4000-8000-000000000000/papel', {
      method: 'PATCH', token: gToken, body: { papel: 'guardiao' },
    })).status).toBe(404)

    const promovido = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanternaSemFicha}/papel`, {
      method: 'PATCH', token: gToken, body: { papel: 'guardiao' },
    })
    expect(promovido.status).toBe(200)
    expect(promovido.corpo.dados).toMatchObject({ papel: 'guardiao', setorId: 2814, lanternaId: null })
    expect((await chamar('/usuarios', { token: semFichaToken })).status).toBe(200)

    const rebaixado = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanternaSemFicha}/papel`, {
      method: 'PATCH', token: gToken, body: { papel: 'lanterna' },
    })
    expect(rebaixado.status).toBe(200)
    expect(rebaixado.corpo.dados).toMatchObject({ papel: 'lanterna', setorId: 2814 })
    expect((await chamar('/usuarios', { token: semFichaToken })).status).toBe(403)

    const promovidoComFicha = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/papel`, {
      method: 'PATCH', token: gToken, body: { papel: 'guardiao' },
    })
    expect(promovidoComFicha.corpo.dados).toMatchObject({ papel: 'guardiao', lanternaId: ficha2814, setorId: 2814 })
    const guardianLink = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: ficha2814 },
    })
    expect(guardianLink.status).toBe(422)
    expect(guardianLink.corpo.erro.codigo).toBe('VINCULO_NAO_PERMITIDO')
    const guardianUnlink = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: null },
    })
    expect(guardianUnlink.status).toBe(200)
    expect(guardianUnlink.corpo.dados.lanternaId).toBeNull()
    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/papel`, {
      method: 'PATCH', token: gToken, body: { papel: 'lanterna' },
    })).status).toBe(200)
    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: ficha2814 },
    })).status).toBe(200)

    const forcaSetor = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/papel`, {
      method: 'PATCH', token: gToken, body: { papel: 'lanterna', setorId: 674 },
    })
    expect(forcaSetor.status).toBe(422)
    expect(forcaSetor.corpo.erro.codigo).toBe('SETOR_DIFERENTE')
  })

  it('valida existência, papel e setores antes de vincular ou desvincular ficha', async () => {
    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.guardiao}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: 'ausente' },
    })).status).toBe(404)
    const guardian = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.guardiao}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: ficha2814 },
    })
    expect(guardian.status).toBe(422)
    expect(guardian.corpo.erro.codigo).toBe('VINCULO_NAO_PERMITIDO')

    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanternaSemFicha}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: 'nao-existe' },
    })).status).toBe(404)
    const semSetor = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanternaSemFicha}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: fichaSemSetor },
    })
    expect(semSetor.status).toBe(422)
    expect(semSetor.corpo.erro.codigo).toBe('SETOR_DIFERENTE')
    const setorDiferente = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna674}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: ficha2814 },
    })
    expect(setorDiferente.status).toBe(422)
    expect(setorDiferente.corpo.erro.codigo).toBe('SETOR_DIFERENTE')
    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna674}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: ficha674 },
    })).status).toBe(200)

    const duplicada = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanternaSemFicha}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: ficha2814 },
    })
    expect(duplicada.status).toBe(409)
    expect(duplicada.corpo.erro.codigo).toBe('LANTERNA_JA_VINCULADA')
    const idempotente = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: ficha2814 },
    })
    expect(idempotente.status).toBe(200)
    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: ficha2814 },
    })).status).toBe(200)
    const desvinculada = await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: null },
    })
    expect(desvinculada.status).toBe(200)
    expect(desvinculada.corpo.dados.lanternaId).toBeNull()
    expect((await chamar(`/lanternas/${ficha2814}`)).status).toBe(200)
    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: null },
    })).status).toBe(200)
    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
      method: 'PATCH', token: gToken, body: {},
    })).status).toBe(400)
    expect((await chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
      method: 'PATCH', token: gToken, body: { lanternaId: 'Bad Slug' },
    })).status).toBe(400)
  })

  it('serializa duas contas que tentam vincular a mesma Ficha', async () => {
    const respostas = await Promise.all([
      chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanterna2814}/lanterna`, {
        method: 'PATCH', token: gToken, body: { lanternaId: ficha2814 },
      }),
      chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.lanternaSemFicha}/lanterna`, {
        method: 'PATCH', token: gToken, body: { lanternaId: ficha2814 },
      }),
    ])
    expect(respostas.map(({ status }) => status).sort()).toEqual([200, 409])
    expect(respostas.find(({ status }) => status === 409)?.corpo.erro.codigo).toBe('LANTERNA_JA_VINCULADA')
  })

  it('impede que duas operações concorrentes rebaixem os dois últimos Guardiões', async () => {
    const respostas = await Promise.all([
      chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.guardiao}/papel`, {
        method: 'PATCH', token: gToken, body: { papel: 'lanterna', setorId: 2814 },
      }),
      chamar(`/usuarios/${IDS_FIXTURE_INTEGRACAO_A.guardiaoSecundario}/papel`, {
        method: 'PATCH', token: g2Token, body: { papel: 'lanterna', setorId: 674 },
      }),
    ])
    expect(respostas.map(({ status }) => status).sort()).toEqual([200, 409])
    expect(respostas.find(({ status }) => status === 409)?.corpo.erro.codigo).toBe('ULTIMO_GUARDIAO')

    const comTokenG = await chamar('/usuarios', { token: gToken })
    const comTokenG2 = await chamar('/usuarios', { token: g2Token })
    expect([comTokenG.status, comTokenG2.status].sort()).toEqual([200, 403])
    const lista = comTokenG.status === 200 ? comTokenG : comTokenG2
    expect(lista.corpo.dados.itens.filter(({ papel }: { papel: string }) => papel === 'guardiao')).toHaveLength(1)
  })
})
