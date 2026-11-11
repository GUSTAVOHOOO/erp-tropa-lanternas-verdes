import { Transform } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class FiltroPaginacaoDto {
  @IsOptional()
  @Transform(({ value }) => inteiroQuery(value, 1))
  @IsInt()
  @Min(1)
  pagina = 1

  @IsOptional()
  @Transform(({ value }) => inteiroQuery(value, 20))
  @IsInt()
  @Min(1)
  @Max(50)
  limite = 20
}

function inteiroQuery(valor: unknown, padrao: number): number {
  if (valor === undefined) return padrao
  if (typeof valor === 'number' && Number.isInteger(valor)) return valor
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return Number.NaN
  return Number(valor)
}
