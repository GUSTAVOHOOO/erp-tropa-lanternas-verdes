import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

@Injectable()
export class LogMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LogMiddleware.name)

  use(request: Request, response: Response, next: NextFunction): void {
    const inicio = performance.now()
    response.once('finish', () => {
      const duracaoMs = Math.max(0, Math.round(performance.now() - inicio))
      this.logger.log(
        `${request.method} ${request.path} ${response.statusCode} ${duracaoMs}ms`,
      )
    })
    next()
  }
}
