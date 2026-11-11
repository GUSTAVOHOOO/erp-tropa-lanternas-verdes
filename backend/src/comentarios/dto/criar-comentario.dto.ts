import { IsString, MaxLength, MinLength } from 'class-validator'

export class CriarComentarioDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  texto!: string
}
