import { IsString, MaxLength, MinLength } from 'class-validator'
import { Aparar } from '../../comum/transformacoes.js'

export class CriarComentarioDto {
  @Aparar()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  texto!: string
}
