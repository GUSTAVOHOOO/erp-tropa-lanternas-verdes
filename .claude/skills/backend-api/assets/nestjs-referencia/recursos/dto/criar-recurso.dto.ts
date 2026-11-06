import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min } from 'class-validator'

export class CriarRecursoDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  nome: string

  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
  valor: number

  @IsInt() @Min(0)
  disponivel: number

  @IsInt()
  grupoId: number
}
