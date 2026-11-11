import { Type } from 'class-transformer'
import { IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator'
import type { GravidadeOcorrencia } from '../ocorrencia.entity.js'

export class EditarOcorrenciaDto {
  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  titulo?: string

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  descricao?: string

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  planeta?: string

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsIn(['baixa', 'media', 'alta', 'critica'])
  gravidade?: GravidadeOcorrencia

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  envolvidos?: number
}
