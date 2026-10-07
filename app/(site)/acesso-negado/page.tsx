import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Acesso negado | Central de Oa' }

/** Logado, mas sem permissão: o "403" explicado (APIS p. 5). [AUTH-06] */
export default function AcessoNegadoPage() {
  return (
    <section className="mx-auto max-w-lg py-8 text-center">
      <h1 className="text-2xl font-semibold">Acesso negado</h1>
      <p className="mt-2 text-muted-foreground">
        Você está conectado, mas seu papel não permite abrir esta página. Atribuir responsáveis é exclusivo dos
        Guardiões, e cada Lanterna só acessa as ocorrências do próprio setor.
      </p>
      <Link href="/painel" className={buttonVariants({ className: 'mt-6' })}>Voltar ao painel</Link>
    </section>
  )
}
