import 'reflect-metadata'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { isAbsolute, dirname, resolve } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../../config/ambiente.js'
import { Setor } from '../../setores/setor.entity.js'
import { Usuario } from '../../usuarios/usuario.entity.js'
import { Lanterna } from '../../lanternas/lanterna.entity.js'
import { criarOpcoesBanco } from '../../database/database-options.js'
import { montarEtapaA } from './contas.js'
import { montarEtapaB } from './fichas.js'
import { montarEtapaC } from './ocorrencias.js'
import { montarEtapaD } from './ciclo-vida.js'
import { montarEtapaE } from './eventos-comentarios.js'
import { criarManifestoEtapaA, criarManifestoEtapaB, criarManifestoEtapaC, criarManifestoEtapaD, criarManifestoEtapaE } from './manifesto.js'
import { CONTAS_FIXTURE_A, SETORES_FIXTURE_A } from './ids.js'

function carregarAmbiente(): void {
  const arquivo = resolve(process.cwd(), '.env')
  if (existsSync(arquivo)) process.loadEnvFile(arquivo)
}

function argumentos(): { etapa: 'a' | 'b' | 'c' | 'd' | 'e'; saida?: string } {
  const args = process.argv.slice(2)
  let etapa: 'a' | 'b' | 'c' | 'd' | 'e' = 'a'
  let saida: string | undefined
  for (let indice = 0; indice < args.length; indice += 1) {
    if (args[indice] === '--etapa' && ['a', 'b', 'c', 'd', 'e'].includes(args[indice + 1] ?? '')) {
      etapa = args[indice + 1] as 'a' | 'b' | 'c' | 'd' | 'e'
      indice += 1
    } else if (args[indice] === '--saida' && args[indice + 1]) {
      saida = args[indice + 1]
      indice += 1
    } else {
      throw new Error('Uso: npm run fixture:integracao [-- --etapa a|b|c|d|e] [--saida <arquivo.json>]')
    }
  }
  return { etapa, saida }
}

async function executar(): Promise<void> {
  carregarAmbiente()
  const { etapa, saida } = argumentos()
  if (process.env.NODE_ENV === 'production') throw new Error('Fixture de integração é proibida em produção')
  const instante = process.env.FIXTURE_INSTANTE ?? new Date().toISOString()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(instante) || Number.isNaN(Date.parse(instante))) {
    throw new Error('FIXTURE_INSTANTE deve ser uma data ISO válida')
  }
  const senha = process.env.FIXTURE_SENHA
  if (!senha) throw new Error('FIXTURE_SENHA é obrigatória e não possui valor padrão')
  if ([...senha].length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
    throw new Error('FIXTURE_SENHA deve ter ao menos 8 caracteres e no máximo 72 bytes UTF-8')
  }
  const ambiente = validarAmbiente(process.env)
  if (!process.env.DATABASE_PATH || !isAbsolute(ambiente.DATABASE_PATH) || ambiente.DATABASE_PATH === ':memory:') {
    throw new Error('DATABASE_PATH absoluto para SQLite local é obrigatório')
  }

  const banco = new DataSource(criarOpcoesBanco(ambiente))
  let destinoReservado: string | undefined
  await banco.initialize()
  try {
    if (await banco.showMigrations()) throw new Error('Banco não migrado; execute npm run migration:run')
    const nomesTabelas = ['setor', 'usuario', 'lanterna', 'ocorrencia', 'evento', 'comentario']
    for (const tabela of nomesTabelas) {
      const [{ total }] = await banco.query(`SELECT COUNT(*) AS total FROM "${tabela}"`) as { total: number }[]
      if (Number(total) !== 0) throw new Error('A fixture exige banco migrado e vazio; nenhum dado foi alterado')
    }

    if (saida) {
      destinoReservado = resolve(saida)
      await mkdir(dirname(destinoReservado), { recursive: true })
      await writeFile(destinoReservado, '', { flag: 'wx' })
    }

    await banco.transaction(async (manager) => {
      await montarEtapaA(manager, senha)
      if (etapa !== 'a') await montarEtapaB(manager)
    })
    if (etapa === 'c' || etapa === 'd' || etapa === 'e') await montarEtapaC(banco, instante)
    if (etapa === 'd' || etapa === 'e') await montarEtapaD(banco, instante)
    if (etapa === 'e') await montarEtapaE(banco, instante)
    const [setores, usuarios, lanternas] = await Promise.all([
      banco.getRepository(Setor).count(), banco.getRepository(Usuario).count(), banco.getRepository(Lanterna).count(),
    ])
    const lanternasEsperadas = etapa !== 'a' ? 3 : 0
    const ocorrenciasEsperadas = etapa === 'c' || etapa === 'd' || etapa === 'e' ? 22 : 0
    const eventosEsperados = etapa === 'c' ? 22 : etapa === 'd' ? 32 : etapa === 'e' ? 33 : 0
    const comentariosEsperados = etapa === 'e' ? 3 : 0
    const ocorrencias = Number((await banco.query('SELECT COUNT(*) AS total FROM "ocorrencia"') as { total: number }[])[0].total)
    const eventos = Number((await banco.query('SELECT COUNT(*) AS total FROM "evento"') as { total: number }[])[0].total)
    const comentarios = Number((await banco.query('SELECT COUNT(*) AS total FROM "comentario"') as { total: number }[])[0].total)
    if (setores !== SETORES_FIXTURE_A.length || usuarios !== CONTAS_FIXTURE_A.length || lanternas !== lanternasEsperadas || ocorrencias !== ocorrenciasEsperadas || eventos !== eventosEsperados || comentarios !== comentariosEsperados) {
      throw new Error(`As contagens gravadas da fixture não correspondem à etapa ${etapa}`)
    }
    const manifesto = etapa === 'e' ? await criarManifestoEtapaE(banco, instante)
      : etapa === 'd' ? await criarManifestoEtapaD(banco, instante)
      : etapa === 'c' ? await criarManifestoEtapaC(banco, instante)
      : etapa === 'b' ? criarManifestoEtapaB(instante) : criarManifestoEtapaA(instante)
    const json = `${JSON.stringify(manifesto, null, 2)}\n`
    if (destinoReservado) {
      await writeFile(destinoReservado, json)
      process.stdout.write(`Fixture etapa ${etapa} concluída; manifesto gravado em ${destinoReservado}\n`)
      destinoReservado = undefined
    } else {
      process.stdout.write(`${json}`)
    }
  } finally {
    await banco.destroy()
    if (destinoReservado) await rm(destinoReservado, { force: true })
  }
}

void executar().catch((erro: unknown) => {
  process.stderr.write(`${erro instanceof Error ? erro.message : 'Falha ao montar fixture'}\n`)
  process.exitCode = 1
})
