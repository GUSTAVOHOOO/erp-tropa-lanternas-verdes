import { Transform } from 'class-transformer'
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, Matches } from 'class-validator'
import { Aparar, inteiroDecimal, inteiroDecimalOuPadrao } from '../../comum/transformacoes.js'
import type { GravidadeOcorrencia, StatusOcorrencia } from '../ocorrencia.entity.js'

export class FiltroOcorrenciasDto {
  @IsOptional()
  @IsIn(['aberta', 'em_andamento', 'resolvida'])
  status?: StatusOcorrencia

  @IsOptional()
  @IsIn(['baixa', 'media', 'alta', 'critica'])
  gravidade?: GravidadeOcorrencia

  @IsOptional()
  @Transform(({ value }) => inteiroDecimal(value))
  @IsInt()
  @Min(0)
  @Max(9999)
  setor?: number

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  @MaxLength(40)
  responsavel?: string

  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean()
  vencida?: boolean | string

  @IsOptional()
  @Aparar()
  @IsString()
  @MaxLength(100)
  busca?: string

  @IsOptional()
  @Transform(({ value }) => inteiroDecimalOuPadrao(value, 1))
  @IsInt()
  @Min(1)
  pagina = 1

  @IsOptional()
  @Transform(({ value }) => inteiroDecimalOuPadrao(value, 20))
  @IsInt()
  @Min(1)
  @Max(50)
  limite = 20

  @IsOptional()
  @IsIn(['prazo', 'criadaEm', 'gravidade'])
  ordenar: 'prazo' | 'criadaEm' | 'gravidade' = 'criadaEm'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  ordem: 'asc' | 'desc' = 'desc'
}
