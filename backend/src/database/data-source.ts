import 'reflect-metadata'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { DataSource } from 'typeorm'
import { validarAmbiente } from '../config/ambiente.js'
import { criarOpcoesBanco } from './database-options.js'

const arquivoAmbiente = resolve(process.cwd(), '.env')
if (existsSync(arquivoAmbiente)) process.loadEnvFile(arquivoAmbiente)

const dataSource = new DataSource(
  criarOpcoesBanco(validarAmbiente(process.env)),
)

export default dataSource
