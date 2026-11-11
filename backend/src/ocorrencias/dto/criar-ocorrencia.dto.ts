import { Type } from 'class-transformer'
import { IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator'
import type { GravidadeOcorrencia } from '../ocorrencia.entity.js'

export class CriarOcorrenciaDto {
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  titulo!: string

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  descricao!: string

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  planeta!: string

  @IsIn(['baixa', 'media', 'alta', 'critica'])
  gravidade!: GravidadeOcorrencia

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  envolvidos!: number

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  setorId?: number
}
