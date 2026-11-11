import { Transform } from 'class-transformer'
import { IsEmail, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'
import { SenhaValida } from './senha-valida.decorator.js'

export class CadastroDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nome!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLocaleLowerCase('und') : value))
  @IsEmail()
  @MaxLength(254)
  email!: string

  @IsString()
  @SenhaValida(8)
  senha!: string

  @IsInt()
  @Min(0)
  @Max(9999)
  setorId!: number
}
