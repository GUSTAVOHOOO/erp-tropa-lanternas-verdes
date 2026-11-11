import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { ErroDominio } from './erro-dominio.js'

interface DetalheValidacao {
  campo: string
  mensagens: string[]
}

@Catch()
export class FiltroExcecoes implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcecoes.name)

  catch(erro: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()
    const caminho = request.path

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let codigo = 'ERRO_INTERNO'
    let mensagem = 'Erro interno'
    let detalhes: DetalheValidacao[] | undefined

    if (erro instanceof ErroDominio) {
      status = erro.status
      codigo = erro.codigo
      mensagem = erro.message
    } else if (erro instanceof HttpException) {
      status = erro.getStatus()
      const corpo = erro.getResponse()
      if (status === HttpStatus.BAD_REQUEST) {
        codigo = 'DADOS_INVALIDOS'
        mensagem = 'Dados inválidos'
        const mensagens =
          typeof corpo === 'object' && corpo !== null && 'message' in corpo
            ? (corpo as { message?: unknown }).message
            : undefined
        detalhes = Array.isArray(mensagens)
          ? mensagens.map((item: unknown) => {
              if (typeof item === 'string') {
                const desconhecido = item.match(/^property (\S+) should not exist$/)
                if (desconhecido) {
                  return { campo: desconhecido[1], mensagens: ['não é permitido'] }
                }
                const regra = item.match(/^(\S+)\s+(.+)$/)
                if (regra) return { campo: regra[1], mensagens: [regra[2]] }
              }
              return { campo: 'geral', mensagens: [String(item)] }
            })
          : [{ campo: 'geral', mensagens: ['Requisição inválida'] }]
      } else if (status === HttpStatus.NOT_FOUND) {
        codigo = 'NAO_ENCONTRADO'
        mensagem = 'Recurso não encontrado'
      } else if (status === HttpStatus.UNAUTHORIZED) {
        codigo = 'NAO_AUTENTICADO'
        mensagem = 'Não autenticado'
      } else if (status === HttpStatus.FORBIDDEN) {
        codigo = 'SEM_PERMISSAO'
        mensagem = 'Sem permissão'
      } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
        codigo = 'MUITAS_TENTATIVAS'
        mensagem = 'Muitas tentativas. Tente novamente mais tarde.'
      } else if (status >= 500) {
        status = HttpStatus.INTERNAL_SERVER_ERROR
      } else {
        mensagem = 'Requisição não aceita'
      }
    }

    if (status >= 500) {
      const erroLog = erro instanceof Error ? erro.stack ?? erro.message : String(erro)
      this.logger.error(`Falha interna em ${request.method} ${caminho}: ${erroLog}`)
      status = HttpStatus.INTERNAL_SERVER_ERROR
      codigo = 'ERRO_INTERNO'
      mensagem = 'Erro interno'
      detalhes = undefined
    }

    response.status(status).json({
      sucesso: false,
      erro: {
        status,
        mensagem,
        codigo,
        ...(status === HttpStatus.BAD_REQUEST ? { detalhes } : {}),
      },
      caminho,
      timestamp: new Date().toISOString(),
    })
  }
}
