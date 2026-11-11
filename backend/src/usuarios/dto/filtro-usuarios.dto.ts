import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { Aparar, inteiroDecimalOuPadrao } from '../../comum/transformacoes.js'

const ordenacoes = ['nome', 'criadoEm'] as const
const direcoes = ['asc', 'desc'] as const

export class FiltroUsuariosDto {
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
  @IsIn(ordenacoes)
  ordenar: (typeof ordenacoes)[number] = 'nome'

  @IsOptional()
  @IsIn(direcoes)
  ordem: (typeof direcoes)[number] = 'asc'
}
