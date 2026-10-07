import type { Metadata } from 'next'
import { FormLogin } from '@/app/(site)/login/_components/FormLogin'

export const metadata: Metadata = { title: 'Entrar | Central de Oa' }

export default function LoginPage() {
  return (
    <section className="mx-auto w-full max-w-sm py-8">
      <h1 className="text-2xl font-semibold">Entrar na Central de Comando</h1>
      <p className="mt-2 text-sm text-muted-foreground">Acesso restrito a membros da Tropa.</p>
      <FormLogin />
    </section>
  )
}
