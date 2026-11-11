import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ name: 'maxPalavras', async: false })
export class MaxPalavrasConstraint implements ValidatorConstraintInterface {
  validate(valor: unknown): boolean {
    return typeof valor === 'string' && valor.trim().split(/\s+/u).filter(Boolean).length <= 15
  }

  defaultMessage(): string {
    return 'citacao deve ter no máximo 15 palavras'
  }
}
