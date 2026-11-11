import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'

@Injectable()
export class IdUsuarioPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(valor)) {
      throw new BadRequestException(['id deve ser um UUID vÃ¡lido'])
    }
    return valor
  }
}
