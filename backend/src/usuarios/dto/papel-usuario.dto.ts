import { Transform } from 'class-transformer'
import {
  IsDefined,
  IsIn,
  IsInt,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator'
import type { PapelUsuario } from '../usuario.entity.js'

@ValidatorConstraint({ name: 'setorSomenteParaLanterna', async: false })
class SetorSomenteParaLanterna implements ValidatorConstraintInterface {
  validate(_valor: unknown, contexto?: ValidationArguments): boolean {
    return (contexto?.object as { papel?: PapelUsuario } | undefined)?.papel !== 'guardiao'
  }
}

function inteiroOpcional(valor: unknown): number | unknown {
  if (typeof valor !== 'string') return valor
  if (!/^\d+$/.test(valor)) return Number.NaN
  return Number(valor)
}

export class PapelUsuarioDto {
  @IsDefined()
  @IsIn(['guardiao', 'lanterna'])
  papel!: PapelUsuario

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @Transform(({ value }) => inteiroOpcional(value))
  @Validate(SetorSomenteParaLanterna)
  @IsInt()
  @Min(0)
  @Max(9999)
  setorId?: number
}
