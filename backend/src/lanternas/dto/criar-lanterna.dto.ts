import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { FontesLanternaDto } from './fontes-lanterna.dto.js'
import { MaxPalavrasConstraint } from './max-palavras.validator.js'

export class CriarLanternaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  id!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  codinome!: string

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  identidadeCivil?: string | null

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  especie!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  planetaNatal!: string

  @ValidateIf((_objeto, valor) => valor !== undefined && valor !== null)
  @IsInt()
  @Min(0)
  @Max(9999)
  setorId?: number | null

  @ValidateIf((_objeto, valor) => valor !== undefined && valor !== null)
  @IsInt()
  @Min(1900)
  @Max(2100)
  anoIngresso?: number | null

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(300)
  primeiraAparicao?: string | null

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(60, { each: true })
  habilidades?: string[]

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  mentorId?: string | null

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Validate(MaxPalavrasConstraint)
  citacao?: string | null

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(1200)
  biografia?: string | null

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => FontesLanternaDto)
  fontes?: FontesLanternaDto
}
