import * as z from 'zod'
import { urlDaApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { usuarioSchema, type Usuario } from '@/lib/schemas/usuario'

/**
 * Usuário de login pelo e-mail (sem diferenciar maiúsculas). Devolve a senha:
 * use só dentro da action entrar, nunca passe o resultado para um componente. [AUTH-11]
 */
export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const url = urlDaApi('/usuarios', { email: email.trim().toLowerCase() })
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new ApiError(res.status) // [API-02]
  const usuarios = z.array(usuarioSchema).parse(await res.json()) // [API-04]
  return usuarios[0] ?? null
}
