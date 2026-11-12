'use server'

import { redirect } from 'next/navigation'
import { verificarSessao } from '@/lib/dal'
import { apagarCookieSessao } from '@/lib/auth'

/** Sair: apaga o cookie e volta ao login. */
export async function sair() {
  await verificarSessao() // [AUTH-05]
  await apagarCookieSessao() // [AUTH-09]
  redirect('/login')
}
