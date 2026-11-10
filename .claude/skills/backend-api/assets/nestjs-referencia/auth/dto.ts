import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class RegistroDto { // sem campo papel: o whitelist barra quem tentar enviar
  @IsEmail() email: string
  @IsString() @MinLength(8) @MaxLength(72) senha: string // bcrypt só usa 72 bytes
}

export class LoginDto {
  @IsEmail() email: string
  @IsString() @MaxLength(72) senha: string
}
