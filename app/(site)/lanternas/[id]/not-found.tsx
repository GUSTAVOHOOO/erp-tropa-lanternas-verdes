import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function LanternaNaoEncontrado() {
  return (
    <section className="text-center">
      <h1 className="text-2xl font-semibold">Lanterna não encontrado</h1>
      <p className="mt-2 text-muted-foreground">Não há lanterna com este endereço na Tropa.</p>
      <Link href="/lanternas" className={buttonVariants({ className: 'mt-6' })}>Ver todos os lanternas</Link>
    </section>
  )
}
