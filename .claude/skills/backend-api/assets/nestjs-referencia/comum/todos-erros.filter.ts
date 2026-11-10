import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'
import type { Request, Response } from 'express'

interface CorpoErro { status: number; mensagem: string; codigo?: string; detalhes?: string[] }

@Catch()
export class TodosErrosFilter implements ExceptionFilter {
  private readonly logger = new Logger(TodosErrosFilter.name)

  catch(erro: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp()
    const res = http.getResponse<Response>()
    const req = http.getRequest<Request>()
    const corpo = this.traduzir(erro)
    if (corpo.status >= 500) {
      this.logger.error(`${req.method} ${req.path}`, erro instanceof Error ? erro.stack : String(erro))
    }
    res.status(corpo.status).json({
      sucesso: false,
      erro: corpo,
      caminho: req.path,
      timestamp: new Date().toISOString(),
    })
  }

  private traduzir(erro: unknown): CorpoErro {
    if (!(erro instanceof HttpException)) return { status: 500, mensagem: 'Erro interno' }
    const status = erro.getStatus()
    const r = erro.getResponse()
    if (typeof r === 'string') return { status, mensagem: r }
    const o = r as { message?: string | string[]; mensagem?: string; codigo?: string }
    if (Array.isArray(o.message)) return { status, mensagem: 'Dados inválidos', detalhes: o.message }
    return { status, mensagem: o.mensagem ?? o.message ?? erro.message, codigo: o.codigo }
  }
}
