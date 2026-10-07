import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

/** 404 global: nenhuma rota casou com a URL. [ROTA-22] */
export default function NaoEncontrada() {
  return (
    <main className="mx-auto max-w-lg flex-1 p-8 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-muted-foreground">Este endereço não existe em nenhum dos 3600 setores.</p>
      <Link href="/" className={buttonVariants({ className: 'mt-6' })}>Voltar ao início</Link>
    </main>
  )
}
