import { Transform } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { inteiroDecimal, inteiroDecimalOuPadrao } from '../../comum/transformacoes.js'

export class FiltroDashboardDto {
  @IsOptional()
  @Transform(({ value }) => inteiroDecimal(value))
  @IsInt()
  @Min(0)
  @Max(9999)
  setor?: number

  @Transform(({ value }) => inteiroDecimalOuPadrao(value, 30))
  @IsInt()
  @Min(7)
  @Max(90)
  dias = 30
}
