import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import type { EditarLanternaDto } from './editar-lanterna.dto.js'

@Injectable()
export class EditarLanternaPipe implements PipeTransform<EditarLanternaDto, EditarLanternaDto> {
  transform(dados: EditarLanternaDto): EditarLanternaDto {
    if (Object.values(dados).every((valor) => valor === undefined)) {
      throw new BadRequestException(['body informe ao menos um campo para atualizar'])
    }
    return dados
  }
}
