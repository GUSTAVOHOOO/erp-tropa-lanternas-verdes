import { Transform, Type } from 'class-transformer'
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

export class CriarSetorDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  id!: number

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nome!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  descricao!: string
}
