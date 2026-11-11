import { IsIn, IsString, MaxLength, ValidateIf } from 'class-validator'
import type { StatusOcorrencia } from '../ocorrencia.entity.js'

export class StatusOcorrenciaDto {
  @IsIn(['aberta', 'em_andamento', 'resolvida'])
  status!: StatusOcorrencia

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsString()
  @MaxLength(2000)
  resolucao?: string

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsString()
  @MaxLength(500)
  motivo?: string
}
