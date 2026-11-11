import {
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common'
import helmet from 'helmet'
import { FiltroExcecoes } from './filtro-excecoes.js'
import { InterceptorEnvelope } from './interceptor-envelope.js'
import type { Ambiente } from '../config/ambiente.js'

export function configurarHttp(app: INestApplication, ambiente: Ambiente): void {
  app.use(helmet())
  app.enableCors({ origin: ambiente.CORS_ORIGIN })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  app.useGlobalInterceptors(new InterceptorEnvelope())
  app.useGlobalFilters(new FiltroExcecoes())
  app.enableShutdownHooks()
}
