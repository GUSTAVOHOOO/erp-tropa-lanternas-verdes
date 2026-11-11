import { registerDecorator } from 'class-validator'

export function SenhaValida(minimoCaracteres: number): PropertyDecorator {
  return (alvo, propriedade) => {
    registerDecorator({
      name: 'senhaValida',
      target: alvo.constructor,
      propertyName: String(propriedade),
      constraints: [minimoCaracteres],
      options: {
        message: `$property deve ter ao menos ${minimoCaracteres} caracteres e no máximo 72 caracteres e 72 bytes UTF-8`,
      },
      validator: {
        validate(valor: unknown): boolean {
          if (typeof valor !== 'string') return false
          const caracteres = [...valor].length
          return (
            caracteres >= minimoCaracteres &&
            caracteres <= 72 &&
            Buffer.byteLength(valor, 'utf8') <= 72
          )
        },
      },
    })
  }
}
