import { Transform } from 'class-transformer'
import { IsEmail, IsString, MaxLength } from 'class-validator'
import { SenhaValida } from './senha-valida.decorator.js'

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLocaleLowerCase('und') : value))
  @IsEmail()
  @MaxLength(254)
  email!: string

  @IsString()
  @SenhaValida(1)
  senha!: string
}
