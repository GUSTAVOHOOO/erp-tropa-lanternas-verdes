import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

const ordenacoes = ['nome', 'criadoEm'] as const
const direcoes = ['asc', 'desc'] as const

function inteiroQuery(valor: unknown): number | unknown {
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return Number.NaN
  return Number(valor)
}

export class FiltroUsuariosDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
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
  @IsIn(ordenacoes)
  ordenar: (typeof ordenacoes)[number] = 'nome'

  @IsOptional()
  @IsIn(direcoes)
  ordem: (typeof direcoes)[number] = 'asc'
}
