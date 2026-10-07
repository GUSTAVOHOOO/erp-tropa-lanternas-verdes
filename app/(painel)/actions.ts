'use server'

import { redirect } from 'next/navigation'
import { apagarSessao, verificarSessao } from '@/lib/dal'

/** Sair: apaga o cookie e volta ao login. [AUTH-09] */
export async function sair() {
  await verificarSessao() // [AUTH-05]
  await apagarSessao()
  redirect('/login')
}
