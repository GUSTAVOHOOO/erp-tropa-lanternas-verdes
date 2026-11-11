import 'reflect-metadata'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { configurarHttp } from './comum/configurar-http.js'
import { validarAmbiente } from './config/ambiente.js'

export async function criarAplicacao() {
  const arquivoAmbiente = resolve(process.cwd(), '.env')
  if (existsSync(arquivoAmbiente)) process.loadEnvFile(arquivoAmbiente)
  const ambiente = validarAmbiente(process.env)
  const app = await NestFactory.create(AppModule)
  configurarHttp(app, ambiente)
  return { app, ambiente }
}

async function bootstrap(): Promise<void> {
  const { app, ambiente } = await criarAplicacao()
  await app.listen(ambiente.PORT)
}

if (process.env.NODE_ENV !== 'test') {
  void bootstrap()
}
