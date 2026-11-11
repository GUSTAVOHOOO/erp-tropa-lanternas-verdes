import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'

@Injectable()
export class IdSetorPipe implements PipeTransform<string, number> {
  transform(valor: string): number {
    if (!/^\d+$/.test(valor)) throw new BadRequestException(['id deve ser um inteiro entre 0 e 9999'])
    const id = Number(valor)
    if (!Number.isSafeInteger(id) || id < 0 || id > 9999) {
      throw new BadRequestException(['id deve ser um inteiro entre 0 e 9999'])
    }
    return id
  }
}
