'use server'

import { redirect } from 'next/navigation'
import { apagarSessao, verificarSessao } from '@/lib/dal'

/** Sair: apaga o cookie e volta ao login. */
export async function sair() {
  await verificarSessao() // [AUTH-05]
  await apagarSessao() // [AUTH-09]
  redirect('/login')
}
