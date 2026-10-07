'use server'

import { redirect } from 'next/navigation'
import { apagarSessao } from '@/lib/dal'

/** Sair: apaga o cookie e volta ao login. [AUTH-09] */
export async function sair() {
  await apagarSessao()
  redirect('/login')
}
