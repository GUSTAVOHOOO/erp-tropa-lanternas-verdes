import type { Metadata } from 'next'
import Link from 'next/link'
import { EmblemaOa } from '@/components/oanet/EmblemaOa'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { BateriaOa } from '@/components/oanet/ConstructosOa'
import { FormLogin } from '@/app/(site)/login/_components/FormLogin'

export const metadata: Metadata = { title: 'Entrar | Central de Oa' }

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps = {}) {
  const params = searchParams ? await searchParams : {}
  const aviso =
    params.expirou === '1'
      ? 'Sua sessão expirou. Entre de novo.'
      : params.cadastro === '1'
        ? 'Conta criada. Entre com o seu e-mail e senha.'
        : null

  return (
    <MolduraOa className="oa-access-panel">
      <div className="oa-access-art"><BateriaOa className="oa-access-battery" /><span aria-hidden="true">UMA VONTADE INABALÁVEL.</span></div>
      <div className="oa-access-form">
        <EmblemaOa className="oa-access-emblem" />
        <h1 className="font-heading text-3xl leading-tight font-semibold">Entrar na Central de Comando</h1> {/* [CSS-13] */}
        <p>Acesso restrito a membros da Tropa.</p>
        {aviso && (
          <div role="status" className="mb-6 border-l-2 border-(--oa-energy) pl-3 text-sm text-(--oa-text)">
            {aviso}
          </div>
        )}
        <FormLogin />
        <Link href="/cadastro" className="oa-text-action">
          Criar conta
        </Link>
      </div>
    </MolduraOa>
  )
}
