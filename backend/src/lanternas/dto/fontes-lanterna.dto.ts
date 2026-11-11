import { Type } from 'class-transformer'
import { ValidateIf, ValidateNested } from 'class-validator'
import { FonteCampoDto } from './fonte-campo.dto.js'

export class FontesLanternaDto {
  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  codinome?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  identidadeCivil?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  especie?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  planetaNatal?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  setorId?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  anoIngresso?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  primeiraAparicao?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  habilidades?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  mentorId?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  citacao?: FonteCampoDto

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @ValidateNested()
  @Type(() => FonteCampoDto)
  biografia?: FonteCampoDto
}
