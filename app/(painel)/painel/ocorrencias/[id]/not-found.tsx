import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function OcorrenciaNaoEncontrada() {
  return (
    <section className="text-center">
      <h1 className="text-2xl font-semibold">Ocorrência não encontrada</h1>
      <p className="mt-2 text-muted-foreground">Ela pode ter sido removida ou o endereço está errado.</p>
      <Link href="/painel/ocorrencias" className={buttonVariants({ className: 'mt-6' })}>Ver ocorrências</Link>
    </section>
  )
}
