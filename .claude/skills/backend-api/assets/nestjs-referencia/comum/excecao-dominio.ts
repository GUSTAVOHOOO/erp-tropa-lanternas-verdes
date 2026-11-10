import { HttpException, HttpStatus } from '@nestjs/common'

export class ExcecaoDominio extends HttpException {
  constructor(codigo: string, mensagem: string, status: HttpStatus) {
    super({ codigo, mensagem }, status)
  }
}

export class SemDisponibilidadeException extends ExcecaoDominio {
  constructor(id: number) {
    super('SEM_DISPONIBILIDADE', `Recurso ${id} sem disponibilidade`, HttpStatus.CONFLICT)
  }
}
