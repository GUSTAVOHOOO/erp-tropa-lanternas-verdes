import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { map, Observable } from 'rxjs'

@Injectable()
export class InterceptorEnvelope implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<{ statusCode: number }>()
    return next.handle().pipe(
      map((dados: unknown) =>
        response.statusCode === 204 ? dados : { sucesso: true, dados },
      ),
    )
  }
}
