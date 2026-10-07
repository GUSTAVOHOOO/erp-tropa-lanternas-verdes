import { createHmac, timingSafeEqual } from 'node:crypto'
import * as z from 'zod'
import { PAPEIS } from '@/lib/schemas/usuario'

// Este arquivo não importa nada de next/*: o proxy.ts, o dal.ts e os testes usam o mesmo código.

export const NOME_COOKIE = 'sessao'
export const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000 // 8 horas

const sessaoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  papel: z.enum(PAPEIS),
  setorId: z.string().nullable(), // null para o Guardião
  lanternaId: z.string().nullable(),
  expiraEm: z.number(),
}).refine((s) => s.papel === 'guardiao' || s.setorId !== null) // Lanterna sempre tem setor

export type Sessao = z.infer<typeof sessaoSchema>

function assinar(texto: string): string {
  const segredo = process.env.SESSION_SECRET
  if (!segredo) throw new Error('SESSION_SECRET não definido no .env.local') // sem segredo, a assinatura não protege nada
  return createHmac('sha256', segredo).update(texto).digest('base64url')
}

/** Valor do cookie: dados em base64url + "." + assinatura HMAC. Editar os dados quebra a assinatura. */
export function codificarSessao(sessao: Sessao): string {
  const dados = Buffer.from(JSON.stringify(sessao)).toString('base64url')
  return `${dados}.${assinar(dados)}` // [AUTH-03]
}

/** Lê o cookie. Devolve null se faltar, se a assinatura não conferir, se o formato for outro ou se expirou. */
export function decodificarSessao(valor: string | undefined, agora = Date.now()): Sessao | null {
  if (!valor) return null
  if (!process.env.SESSION_SECRET) return null
  const [dados, assinatura, sobra] = valor.split('.')
  if (!dados || !assinatura || sobra !== undefined) return null
  const recebida = Buffer.from(assinatura)
  const esperada = Buffer.from(assinar(dados))
  if (recebida.length !== esperada.length) return null // timingSafeEqual lança erro com tamanhos diferentes
  if (!timingSafeEqual(recebida, esperada)) return null // [AUTH-03]
  try {
    const resultado = sessaoSchema.safeParse(JSON.parse(Buffer.from(dados, 'base64url').toString()))
    if (!resultado.success || resultado.data.expiraEm < agora) return null
    return resultado.data
  } catch {
    return null
  }
}

/** Lanterna só acessa o próprio setor; Guardião acessa todos. [AUTH-07] */
export function podeAcessarSetor(sessao: Sessao, setorId: string): boolean {
  return sessao.papel === 'guardiao' || sessao.setorId === setorId
}

/** Setor usado nos filtros: o Lanterna fica preso ao próprio setor; o Guardião usa o da URL (ou todos). [AUTH-07] */
export function setorParaFiltro(sessao: Sessao, setorDaUrl?: string): string | undefined {
  if (sessao.papel === 'lanterna') return sessao.setorId ?? 'sem-setor'
  return setorDaUrl
}
