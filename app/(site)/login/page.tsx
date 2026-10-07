import type { Metadata } from 'next'
import { Emblema } from '@/components/Emblema'
import { FormLogin } from '@/app/(site)/login/_components/FormLogin'

export const metadata: Metadata = { title: 'Entrar | Central de Oa' }

export default function LoginPage() {
  return (
    <section className="mx-auto grid w-full max-w-sm gap-6 rounded-lg border border-border bg-card p-6 md:mt-8">
      <Emblema className="size-10 text-primary-texto drop-shadow-anel" /> {/* [CSS-14] */}
      <div className="grid gap-2">
        <h1 className="font-heading text-3xl leading-none font-bold">Entrar na Central de Comando</h1> {/* [CSS-13] */}
        <p className="text-sm text-muted-foreground">Acesso restrito a membros da Tropa.</p>
      </div>
      <FormLogin />
    </section>
  )
}
