import { Transform } from 'class-transformer'
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator'

export class EditarSetorDto {
  @ValidateIf((_objeto, valor) => valor !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nome?: string

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  descricao?: string
}
