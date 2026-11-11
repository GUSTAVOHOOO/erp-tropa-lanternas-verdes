import { IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator'

export class ResponsavelOcorrenciaDto {
  @ValidateIf((_objeto, valor) => valor !== null)
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  responsavelId!: string | null
}
