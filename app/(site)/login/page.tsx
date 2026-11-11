import type { Metadata } from 'next'
import { EmblemaOa } from '@/components/oanet/EmblemaOa'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { BateriaOa } from '@/components/oanet/ConstructosOa'
import { FormLogin } from '@/app/(site)/login/_components/FormLogin'

export const metadata: Metadata = { title: 'Entrar | Central de Oa' }

export default function LoginPage() {
  return (
    <MolduraOa className="oa-access-panel">
      <div className="oa-access-art"><BateriaOa className="oa-access-battery" /><span aria-hidden="true">UMA VONTADE INABALÁVEL.</span></div>
      <div className="oa-access-form">
        <EmblemaOa className="oa-access-emblem" />
        <h1 className="font-heading text-3xl leading-tight font-semibold">Entrar na Central de Comando</h1> {/* [CSS-13] */}
        <p>Acesso restrito a membros da Tropa.</p>
        <FormLogin />
      </div>
    </MolduraOa>
  )
}
