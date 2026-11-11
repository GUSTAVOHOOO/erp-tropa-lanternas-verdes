import 'reflect-metadata'
import { existsSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../../config/ambiente.js'
import { SenhaService } from '../../auth/senha.service.js'
import { SetoresRepository } from '../../setores/setores.repository.js'
import { Setor } from '../../setores/setor.entity.js'
import { UsuariosRepository } from '../../usuarios/usuarios.repository.js'
import { Usuario } from '../../usuarios/usuario.entity.js'
import { criarOpcoesBanco } from '../database-options.js'
import { semearSetores } from './setores.js'
import { semearGuardiao, semearContasLanterna } from './usuarios.js'
import { SETORES_SEED_COMPLETO } from './ids.js'
import { Lanterna } from '../../lanternas/lanterna.entity.js'
import { LanternasRepository } from '../../lanternas/lanternas.repository.js'
import { semearLanternas } from './lanternas.js'
import { semearOcorrencias } from './ocorrencias.js'

const DIRETORIO = resolve(process.cwd())

function carregarAmbiente(): void {
  const arquivo = resolve(DIRETORIO, '.env')
  if (existsSync(arquivo)) process.loadEnvFile(arquivo)
}

function lerArgumentos(argumentos: string[]): { etapa: 'minima' | 'completa'; limpar: boolean } {
  let etapaRecebida = 'minima'
  let limpar = false
  for (let indice = 0; indice < argumentos.length; indice += 1) {
    const argumento = argumentos[indice]
    if (argumento === '--limpar') {
      limpar = true
    } else if (argumento === '--etapa') {
      etapaRecebida = argumentos[indice + 1] ?? ''
      indice += 1
    } else {
      throw new Error(`Argumento não reconhecido: ${argumento}`)
    }
  }
  if (etapaRecebida !== 'minima' && etapaRecebida !== 'completa') {
    throw new Error(`Etapa de seed desconhecida: ${etapaRecebida}`)
  }
  return { etapa: etapaRecebida, limpar }
}

function validarLimpeza(databasePath: string): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('--limpar é proibido em produção')
  }
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('--limpar exige NODE_ENV=development explícito')
  }
  if (!process.env.DATABASE_PATH || !isAbsolute(databasePath) || databasePath === ':memory:') {
    throw new Error('--limpar exige DATABASE_PATH absoluto e explicitamente configurado para SQLite local')
  }
}

async function executar(): Promise<void> {
  carregarAmbiente()
  const { etapa, limpar } = lerArgumentos(process.argv.slice(2))
  const ambiente = validarAmbiente(process.env)
  if (limpar) validarLimpeza(ambiente.DATABASE_PATH)
  else if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed de demonstração é proibido em produção')
  }
  const senha = process.env.SEED_SENHA ?? 'guardiao123'
  if (Buffer.byteLength(senha, 'utf8') > 72 || [...senha].length < 8) {
    throw new Error('SEED_SENHA deve ter pelo menos 8 caracteres e no máximo 72 bytes UTF-8')
  }

  const instanteReferencia = obterInstanteReferencia(process.env.SEED_INSTANTE)
  const banco = new DataSource(criarOpcoesBanco(ambiente))
  await banco.initialize()
  try {
    if (limpar) {
      await banco.dropDatabase()
      await banco.runMigrations()
    } else {
      const pendentes = await banco.showMigrations()
      if (pendentes) throw new Error('Banco não migrado; execute npm run migration:run antes do seed')
    }

    await banco.transaction(async (manager) => {
      const setores = new SetoresRepository(manager.getRepository(Setor))
      const usuarios = new UsuariosRepository(manager.getRepository(Usuario))
      const lanternas = new LanternasRepository(manager.getRepository(Lanterna))
      if (etapa === 'completa') {
        for (const setor of SETORES_SEED_COMPLETO) {
          const existente = await setores.buscarPorId(setor.id, manager)
          if (!existente || existente.nome !== setor.nome || existente.descricao !== setor.descricao) {
            await setores.salvar(setor, manager)
          }
        }
        await semearLanternas(lanternas, manager)
      } else {
        await semearSetores(setores, manager)
      }
      await semearGuardiao(usuarios, new SenhaService(), manager, senha)
      if (etapa === 'completa') {
        await semearContasLanterna(usuarios, new SenhaService(), manager, lanternas, process.env.SEED_SENHA)
      }
    })
    if (etapa === 'completa') await semearOcorrencias(banco, instanteReferencia)
    process.stdout.write(`Seed etapa ${etapa} concluído.\n`)
  } finally {
    await banco.destroy()
  }
}

void executar().catch((erro: unknown) => {
  process.stderr.write(`${erro instanceof Error ? erro.message : 'Falha ao executar seed'}\n`)
  process.exitCode = 1
})

function obterInstanteReferencia(valor: string | undefined): Date {
  if (valor === undefined) return new Date()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(valor)) {
    throw new Error('SEED_INSTANTE deve ser uma data ISO com fuso')
  }
  const instante = new Date(valor)
  if (Number.isNaN(instante.getTime())) throw new Error('SEED_INSTANTE deve ser uma data ISO válida')
  return instante
}
