import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import type { EditarSetorDto } from './editar-setor.dto.js'

@Injectable()
export class EditarSetorPipe implements PipeTransform<EditarSetorDto, EditarSetorDto> {
  transform(dados: EditarSetorDto): EditarSetorDto {
    if (dados.nome === undefined && dados.descricao === undefined) {
      throw new BadRequestException(['body informe ao menos um campo para atualizar'])
    }
    return dados
  }
}
