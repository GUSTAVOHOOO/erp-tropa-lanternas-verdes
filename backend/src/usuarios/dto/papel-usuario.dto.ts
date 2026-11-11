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

export class PapelUsuarioDto {
  @IsDefined()
  @IsIn(['guardiao', 'lanterna'])
  papel!: PapelUsuario

  // O corpo JSON não sofre coerção de tipo: "674" (texto) é recusado como inteiro.
  @ValidateIf((_objeto, valor) => valor !== undefined)
  @Validate(SetorSomenteParaLanterna, { message: 'setorId não é permitido para Guardião' })
  @IsInt()
  @Min(0)
  @Max(9999)
  setorId?: number
}
