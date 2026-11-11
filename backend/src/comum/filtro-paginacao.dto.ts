import { Transform } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { inteiroDecimalOuPadrao } from './transformacoes.js'

export class FiltroPaginacaoDto {
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
}
