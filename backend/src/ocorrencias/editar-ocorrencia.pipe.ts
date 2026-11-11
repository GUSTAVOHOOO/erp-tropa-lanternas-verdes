import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import type { EditarOcorrenciaDto } from './dto/editar-ocorrencia.dto.js'

@Injectable()
export class EditarOcorrenciaPipe implements PipeTransform<EditarOcorrenciaDto, EditarOcorrenciaDto> {
  transform(dados: EditarOcorrenciaDto): EditarOcorrenciaDto {
    if (Object.values(dados).every((valor) => valor === undefined)) {
      throw new BadRequestException(['corpo informe ao menos um campo para atualizar'])
    }
    return dados
  }
}
