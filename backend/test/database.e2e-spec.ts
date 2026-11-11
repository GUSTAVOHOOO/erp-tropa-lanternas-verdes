import 'reflect-metadata'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import { jest } from '@jest/globals'
import { normalizarBusca } from '../src/comum/busca-normalizada.js'
import { criarOpcoesBanco } from '../src/database/database-options.js'
import { Inicial1794268800000 } from '../src/database/migrations/Inicial.js'
import { validarAmbiente } from '../src/config/ambiente.js'
import { SetoresRepository } from '../src/setores/setores.repository.js'
import { LanternasRepository } from '../src/lanternas/lanternas.repository.js'
import { UsuariosRepository } from '../src/usuarios/usuarios.repository.js'
import { OcorrenciasRepository } from '../src/ocorrencias/ocorrencias.repository.js'
import { EventosRepository } from '../src/eventos/eventos.repository.js'
import { ComentariosRepository } from '../src/comentarios/comentarios.repository.js'
import { Setor } from '../src/setores/setor.entity.js'
import { Lanterna } from '../src/lanternas/lanterna.entity.js'
import { Usuario } from '../src/usuarios/usuario.entity.js'

describe('persistência SQLite e migrations', () => {
  let fonte: DataSource
  let setores: SetoresRepository
  let lanternas: LanternasRepository
  let usuarios: UsuariosRepository
  let ocorrencias: OcorrenciasRepository
  let eventos: EventosRepository
  let comentarios: ComentariosRepository
  const setorId = 2814
  const usuarioId = randomUUID()

  beforeAll(async () => {
    process.env.PORT = '3001'
    process.env.DATABASE_PATH = ':memory:'
    process.env.JWT_SECRET = 'chave-de-teste-com-mais-de-32-bytes!!'
    process.env.JWT_EXPIRES_IN = '8h'
    process.env.CORS_ORIGIN = 'http://localhost:3000'
    process.env.LOGIN_LIMITE = '5'
    process.env.LOGIN_JANELA_SEGUNDOS = '60'

    fonte = new DataSource(criarOpcoesBanco(validarAmbiente(process.env)))
    await fonte.initialize()
    await fonte.runMigrations()
    setores = new SetoresRepository(fonte.getRepository(Setor))
    lanternas = new LanternasRepository(fonte.getRepository(Lanterna))
    usuarios = new UsuariosRepository(fonte.getRepository(Usuario))
    const { Ocorrencia } = await import('../src/ocorrencias/ocorrencia.entity.js')
    const { Evento } = await import('../src/eventos/evento.entity.js')
    const { Comentario } = await import('../src/comentarios/comentario.entity.js')
    ocorrencias = new OcorrenciasRepository(fonte.getRepository(Ocorrencia))
    eventos = new EventosRepository(fonte.getRepository(Evento))
    comentarios = new ComentariosRepository(fonte.getRepository(Comentario))
  })

  afterAll(async () => {
    if (fonte?.isInitialized) await fonte.destroy()
  })

  it('migra um banco vazio com todas as tabelas, índices e FK ativas', async () => {
    const tabelas = await fonte.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    ) as Array<{ name: string }>
    expect(tabelas.map(({ name }) => name)).toEqual([
      'comentario',
      'evento',
      'lanterna',
      'ocorrencia',
      'setor',
      'typeorm_migrations',
      'usuario',
    ])
    expect((await fonte.query('PRAGMA foreign_keys'))[0].foreign_keys).toBe(1)
    expect(await fonte.query("SELECT name FROM sqlite_master WHERE type='index' AND name='IDX_ocorrencia_setor_status'")).toHaveLength(1)

    const segunda = new DataSource({
      ...criarOpcoesBanco(validarAmbiente(process.env)),
      database: ':memory:',
      migrations: [],
    })
    await segunda.initialize()
    expect((await segunda.query('PRAGMA foreign_keys'))[0].foreign_keys).toBe(1)
    await segunda.destroy()
  })

  it('aplica relacionamentos e normalização em saves feitos pelo repository', async () => {
    await setores.salvar({ id: setorId, nome: 'Setor 2814', descricao: 'Setor de teste' })
    const lanterna = await lanternas.salvar({
      id: 'hal-jordan',
      codinome: 'Lanterna Verde Ágil',
      status: 'ativo',
      setorId,
      habilidades: ['vontade'],
      fontes: {},
    })
    const guardiao = await usuarios.salvar({
      id: usuarioId,
      nome: 'Álvaro Guardião',
      email: 'ALVARO@example.test',
      senhaHash: 'hash-de-teste',
      papel: 'guardiao',
      setorId: null,
      lanternaId: null,
    })

    expect(lanterna.codinomeBusca).toBe('lanterna verde agil')
    expect(guardiao.email).toBe('alvaro@example.test')
    expect(guardiao.nomeBusca).toBe('alvaro guardiao')
    expect(guardiao.emailBusca).toBe('alvaro@example.test')
    expect(await usuarios.buscarPorIdComHash(usuarioId)).toMatchObject({ senhaHash: 'hash-de-teste' })
    expect((await usuarios.buscarPorId(usuarioId))?.senhaHash).toBeUndefined()
    expect((await usuarios.buscarPorTermo('alvaro')).map(({ id }) => id)).toContain(usuarioId)
    expect((await lanternas.buscarPorCodinome('agil')).map(({ id }) => id)).toContain('hal-jordan')
    expect(await usuarios.buscarPorTermo('%_\\')).toEqual([])

    const literal = await usuarios.salvar({
      id: randomUUID(),
      nome: 'Literal %_\\',
      email: 'literal-special@example.test',
      senhaHash: 'hash',
      papel: 'guardiao',
      setorId: null,
      lanternaId: null,
    })
    expect((await usuarios.buscarPorTermo('%_\\')).map(({ id }) => id)).toEqual([literal.id])
    expect(normalizarBusca('ÁÉÍÓÚ Ç')).toBe('aeiou c')

    await expect(
      fonte.transaction(async (manager) => {
        await setores.salvar(
          { id: 1417, nome: 'Setor transacional', descricao: 'Rollback de teste' },
          manager,
        )
        throw new Error('rollback esperado')
      }),
    ).rejects.toThrow('rollback esperado')
    expect(await setores.buscarPorId(1417)).toBeNull()
  })

  it('rejeita FKs inválidas, enums inválidos, envolvidos não positivos e vínculos duplicados', async () => {
    const logSql = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const uuid = randomUUID()
    await expect(
      fonte.query(
        `INSERT INTO "lanterna" ("id", "codinome", "status", "setorId", "habilidades", "fontes", "codinomeBusca")
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['sem-setor', 'Inválido', 'ativo', 999999, '[]', '{}', 'invalido'],
      ),
    ).rejects.toThrow()
    expect(logSql).not.toHaveBeenCalled()
    logSql.mockRestore()

    await expect(
      usuarios.salvar({
        id: randomUUID(),
        nome: 'E-mail em caixa diferente',
        email: 'ALVARO@EXAMPLE.TEST',
        senhaHash: 'hash',
        papel: 'guardiao',
        setorId: null,
        lanternaId: null,
      }),
    ).rejects.toThrow()

    await expect(
      fonte.query(
        `INSERT INTO "usuario" ("id", "nome", "email", "nomeBusca", "emailBusca", "senhaHash", "papel", "setorId", "lanternaId")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid, 'Sem Setor', `${uuid}@example.test`, 'sem setor', 'email', 'hash', 'lanterna', null, null],
      ),
    ).rejects.toThrow()

    const lanternasConta = await lanternas.buscarPorId('hal-jordan')
    expect(lanternasConta?.id).toBe('hal-jordan')
    await usuarios.salvar({
      id: randomUUID(),
      nome: 'Conta Lanternada',
      email: 'vinculada@example.test',
      senhaHash: 'hash',
      papel: 'lanterna',
      setorId,
      lanternaId: 'hal-jordan',
    })
    await expect(
      usuarios.salvar({
        id: randomUUID(),
        nome: 'Conta duplicada',
        email: 'duplicada@example.test',
        senhaHash: 'hash',
        papel: 'lanterna',
        setorId,
        lanternaId: 'hal-jordan',
      }),
    ).rejects.toThrow()

    await expect(
      fonte.query(
        `INSERT INTO "comentario" ("id", "ocorrenciaId", "autorId", "texto") VALUES (?, ?, ?, ?)`,
        [randomUUID(), randomUUID(), usuarioId, 'texto sem ocorrência'],
      ),
    ).rejects.toThrow()
  })

  it('recusa exclusão física de Setor ligado a Lanterna, Usuário ou Ocorrência', async () => {
    await expect(setores.excluirFisicamente(setorId)).rejects.toThrow()
    const setorDeConta = 674
    await setores.salvar({ id: setorDeConta, nome: 'Setor 674', descricao: 'Setor isolado' })
    const usuario = await usuarios.salvar({
      id: randomUUID(),
      nome: 'Usuário de Setor',
      email: 'uso-setor@example.test',
      senhaHash: 'hash',
      papel: 'guardiao',
      setorId: setorDeConta,
      lanternaId: null,
    })
    await expect(setores.excluirFisicamente(setorDeConta)).rejects.toThrow()

    const ocorrenciaId = randomUUID()
    const ocorrencia = await ocorrencias.salvar({
      id: ocorrenciaId,
      titulo: 'Título de ocorrência',
      descricao: 'Descrição longa o suficiente',
      planeta: 'OA',
      setorId,
      gravidade: 'baixa',
      status: 'aberta',
      envolvidos: 1,
      responsavelId: 'hal-jordan',
      criadaPorId: usuario.id,
    })
    await expect(setores.excluirFisicamente(setorId)).rejects.toThrow()
    expect(await ocorrencias.contarNaoResolvidasDoResponsavel('hal-jordan')).toBe(1)
    await eventos.salvar({
      id: randomUUID(),
      ocorrenciaId,
      tipo: 'criada',
      autorId: usuario.id,
      dados: { status: 'aberta' },
    })
    const comentario = await comentarios.salvar({
      id: randomUUID(),
      ocorrenciaId,
      autorId: usuario.id,
      texto: 'Comentário de teste',
    })
    expect((await eventos.listarDaOcorrencia(ocorrenciaId))[0].dados).toEqual({ status: 'aberta' })
    expect(await comentarios.excluirSuavemente(comentario.id)).toBe(true)
    expect(await comentarios.buscarPorId(comentario.id)).toBeNull()
    await expect(ocorrencias.excluirSuavemente(ocorrenciaId)).resolves.toBe(true)
    expect(await ocorrencias.buscarPorId(ocorrenciaId)).toBeNull()
    expect(await ocorrencias.contarNaoResolvidasDoResponsavel('hal-jordan')).toBe(0)
    expect(ocorrencia.tituloBusca).toBe('titulo de ocorrencia')
    await expect(
      fonte.query(
        `INSERT INTO "ocorrencia" ("id", "titulo", "tituloBusca", "descricao", "planeta", "setorId", "gravidade", "status", "envolvidos", "criadaPorId")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), 'Título', 'titulo', 'Descrição longa o suficiente', 'OA', setorId, 'baixa', 'aberta', 0, usuario.id],
      ),
    ).rejects.toThrow()

    expect(eventos).toBeDefined()
    expect(comentarios).toBeDefined()
  })

  it('reverte e reaplica a migration sem sincronização automática', async () => {
    expect(fonte.options.synchronize).toBe(false)
    expect(fonte.options.migrations).toContain(Inicial1794268800000)
    await fonte.undoLastMigration()
    const tabelasAposReversao = await fonte.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='setor'",
    )
    expect(tabelasAposReversao).toHaveLength(0)
    await fonte.runMigrations()
    const tabelasAposMigrar = await fonte.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='setor'",
    )
    expect(tabelasAposMigrar).toHaveLength(1)
  })
})
