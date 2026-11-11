import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'

@Injectable()
export class IdLanternaPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (valor.length < 2 || valor.length > 40 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(valor)) {
      throw new BadRequestException(['id deve ser um slug válido'])
    }
    return valor
  }
}
