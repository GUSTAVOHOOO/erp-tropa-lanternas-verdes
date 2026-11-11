import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { Aparar, inteiroDecimal, inteiroDecimalOuPadrao } from '../../comum/transformacoes.js'
import type { StatusLanterna } from '../lanterna.entity.js'

const statusLanterna = ['ativo', 'em_missao', 'afastado'] as const
const ordenarLanterna = ['codinome', 'setor', 'anoIngresso'] as const
const ordemLancamento = ['asc', 'desc'] as const

export class FiltroLanternasDto {
  @IsOptional()
  @Transform(({ value }) => inteiroDecimal(value))
  @IsInt()
  @Min(0)
  @Max(9999)
  setor?: number

  @IsOptional()
  @IsIn(statusLanterna)
  status?: StatusLanterna

  @IsOptional()
  @Aparar()
  @IsString()
  @MaxLength(100)
  busca?: string

  @Transform(({ value }) => inteiroDecimalOuPadrao(value, 1))
  @IsInt()
  @Min(1)
  pagina = 1

  @Transform(({ value }) => inteiroDecimalOuPadrao(value, 20))
  @IsInt()
  @Min(1)
  @Max(50)
  limite = 20

  @IsOptional()
  @IsIn(ordenarLanterna)
  ordenar: (typeof ordenarLanterna)[number] = 'codinome'

  @IsOptional()
  @IsIn(ordemLancamento)
  ordem: (typeof ordemLancamento)[number] = 'asc'
}
