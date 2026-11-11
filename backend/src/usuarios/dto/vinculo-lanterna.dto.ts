import {
  IsDefined,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator'

export class VinculoLanternaDto {
  @ValidateIf((_objeto, valor) => valor !== null)
  @IsDefined()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  lanternaId!: string | null
}
