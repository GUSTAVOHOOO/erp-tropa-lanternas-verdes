import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { BetterSqlite3DataSourceOptions } from 'typeorm/driver/better-sqlite3/BetterSqlite3DataSourceOptions.js'
import type { Ambiente } from '../config/ambiente.js'
import { Comentario } from '../comentarios/comentario.entity.js'
import { Evento } from '../eventos/evento.entity.js'
import { Lanterna } from '../lanternas/lanterna.entity.js'
import { Inicial1794268800000 } from './migrations/Inicial.js'
import { Ocorrencia } from '../ocorrencias/ocorrencia.entity.js'
import { Setor } from '../setores/setor.entity.js'
import { Usuario } from '../usuarios/usuario.entity.js'

export function criarOpcoesBanco(ambiente: Ambiente): BetterSqlite3DataSourceOptions {
  if (ambiente.DATABASE_PATH !== ':memory:') {
    mkdirSync(dirname(resolve(ambiente.DATABASE_PATH)), { recursive: true })
  }
  return {
    type: 'better-sqlite3',
    database: ambiente.DATABASE_PATH,
    entities: [Setor, Lanterna, Usuario, Ocorrencia, Evento, Comentario],
    migrations: [Inicial1794268800000],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    migrationsRun: false,
    // O logger do driver inclui SQL e parâmetros; os registros da API não podem expor dados.
    logging: false,
    prepareDatabase(database) {
      database.pragma('foreign_keys = ON')
    },
  }
}
