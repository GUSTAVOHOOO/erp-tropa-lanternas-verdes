import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator'
import { PaginacaoDto } from '../../comum/paginacao.dto.js'

export class ListarRecursosDto extends PaginacaoDto {
  @IsOptional() @Type(() => Number) @IsInt()
  grupo?: number

  @IsOptional() @IsString() @MaxLength(120)
  busca?: string
}
