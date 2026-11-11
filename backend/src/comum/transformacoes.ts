import { Transform } from 'class-transformer'

/**
 * Apara espaços nas pontas de texto antes da validação de tamanho (API.md: "Texto é aparado
 * antes de medir", exceto `senha`). Valores que não são texto passam intactos para o validador
 * recusá-los: o corpo não sofre coerção de tipo.
 */
export function Aparar(): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
}

/**
 * Converte query/path em inteiro decimal sem sinal. Qualquer outra coisa (texto, decimal, sinal,
 * notação científica, valor fora do intervalo seguro) vira NaN e é recusada por `@IsInt()`.
 * Só deve ser usada em DTOs de query: o corpo JSON não sofre coerção.
 */
export function inteiroDecimal(valor: unknown): number {
  if (typeof valor !== 'string' || !/^\d{1,15}$/.test(valor)) return Number.NaN
  return Number(valor)
}

/** Como `inteiroDecimal`, mas devolve `padrao` quando o parâmetro não veio. */
export function inteiroDecimalOuPadrao(valor: unknown, padrao: number): number {
  return valor === undefined ? padrao : inteiroDecimal(valor)
}
