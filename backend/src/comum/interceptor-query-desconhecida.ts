import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js'
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js'
import type { Request } from 'express'
import type { Observable } from 'rxjs'

/**
 * DTOS.md: "Campo desconhecido no corpo ou na query é 400 DADOS_INVALIDOS".
 *
 * O ValidationPipe só enxerga a query quando a rota declara `@Query()`. Em rotas sem DTO de query
 * (saúde, auth/me, setores, lanternas/:id...) qualquer parâmetro passaria em silêncio. Este
 * interceptor recusa query não vazia nessas rotas, no mesmo formato de erro do pipe. Roda depois
 * dos guards (401 e 403 vêm antes do 400) e antes da validação do corpo.
 */
@Injectable()
export class InterceptorQueryDesconhecida implements NestInterceptor {
  intercept(contexto: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (contexto.getType() === 'http') {
      const campos = Object.keys(contexto.switchToHttp().getRequest<Request>().query ?? {})
      if (campos.length > 0 && !this.declaraQuery(contexto)) {
        throw new BadRequestException(campos.map((campo) => `property ${campo} should not exist`))
      }
    }
    return next.handle()
  }

  private declaraQuery(contexto: ExecutionContext): boolean {
    const argumentos = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      contexto.getClass(),
      contexto.getHandler().name,
    ) as Record<string, unknown> | undefined
    return Object.keys(argumentos ?? {}).some((chave) => chave.startsWith(`${RouteParamtypes.QUERY}:`))
  }
}
