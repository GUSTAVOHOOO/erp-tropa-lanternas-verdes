import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class IdOcorrenciaPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor)) {
      throw new BadRequestException(['id deve ser um UUID válido'])
    }
    return valor
  }
}
