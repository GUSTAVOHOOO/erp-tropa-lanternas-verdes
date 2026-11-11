import {
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common'
import helmet from 'helmet'
import { FiltroExcecoes } from './filtro-excecoes.js'
import { InterceptorEnvelope } from './interceptor-envelope.js'
import { InterceptorQueryDesconhecida } from './interceptor-query-desconhecida.js'
import type { Ambiente } from '../config/ambiente.js'

export function configurarHttp(app: INestApplication, ambiente: Ambiente): void {
  app.use(helmet())
  app.enableCors({ origin: ambiente.CORS_ORIGIN })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      // Sem `enableImplicitConversion`: o corpo JSON não sofre coerção de tipo ("2814" não vira
      // número, `{}` não vira "[object Object]"). Query e path são convertidos explicitamente
      // nos DTOs de filtro e nos pipes de id (DTOS.md).
      transform: true,
    }),
  )
  app.useGlobalInterceptors(new InterceptorQueryDesconhecida(), new InterceptorEnvelope())
  app.useGlobalFilters(new FiltroExcecoes())
  app.enableShutdownHooks()
}
