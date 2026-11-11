import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import type { StatusLanterna } from '../lanterna.entity.js'

const statusLanterna = ['ativo', 'em_missao', 'afastado'] as const
const ordenarLanterna = ['codinome', 'setor', 'anoIngresso'] as const
const ordemLancamento = ['asc', 'desc'] as const

function inteiroQuery(valor: unknown): number | unknown {
  if (typeof valor !== 'string' || !/^-?\d+$/.test(valor)) return Number.NaN
  return Number(valor)
}

export class FiltroLanternasDto {
  @IsOptional()
  @Transform(({ value }) => inteiroQuery(value))
  @IsInt()
  @Min(0)
  @Max(9999)
  setor?: number

  @IsOptional()
  @IsIn(statusLanterna)
  status?: StatusLanterna

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  busca?: string

  @Transform(({ value }) => value === undefined ? 1 : inteiroQuery(value))
  @IsInt()
  @Min(1)
  pagina = 1

  @Transform(({ value }) => value === undefined ? 20 : inteiroQuery(value))
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
