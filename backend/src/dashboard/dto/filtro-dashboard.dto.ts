import { Transform } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

function inteiroQuery(valor: unknown): number {
  if (typeof valor === 'number' && Number.isInteger(valor)) return valor
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return Number.NaN
  return Number(valor)
}

export class FiltroDashboardDto {
  @IsOptional()
  @Transform(({ value }) => inteiroQuery(value))
  @IsInt()
  @Min(0)
  @Max(9999)
  setor?: number

  @Transform(({ value }) => value === undefined ? 30 : inteiroQuery(value))
  @IsInt()
  @Min(7)
  @Max(90)
  dias = 30
}
