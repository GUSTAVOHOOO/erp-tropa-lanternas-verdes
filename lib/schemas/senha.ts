import * as z from 'zod'

/** Limite do contrato (D36): 72 caracteres E 72 bytes UTF-8, sem trim nem truncamento. */
export const SENHA_MAX = 72

/** Tamanho da senha em bytes UTF-8 (o bcrypt da API só considera 72 bytes). */
export function bytesUtf8(texto: string): number {
  return new TextEncoder().encode(texto).length
}

/**
 * Campo `senha` conforme o OpenAPI: mínimo de caracteres por operação (1 no login, 8 no cadastro),
 * máximo de 72 caracteres e de 72 bytes. A senha nunca é aparada. [FORM-17]
 */
export function senhaSchema(minimo: number, mensagemMinimo: string) {
  return z
    .string()
    .min(minimo, mensagemMinimo)
    .max(SENHA_MAX, `A senha pode ter no máximo ${SENHA_MAX} caracteres.`)
    .refine((senha) => bytesUtf8(senha) <= SENHA_MAX, {
      message: 'A senha é longa demais: use até 72 bytes (acentos e emojis ocupam mais de um).',
    })
}
