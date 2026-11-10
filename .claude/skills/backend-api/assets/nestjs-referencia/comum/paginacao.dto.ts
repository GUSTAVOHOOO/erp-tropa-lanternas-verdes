import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class PaginacaoDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina: number = 1

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limite: number = 20
}

export function comMeta<T>([itens, total]: [T[], number], { pagina, limite }: PaginacaoDto) {
  return { itens, meta: { total, pagina, limite, paginas: Math.ceil(total / limite) } }
}
