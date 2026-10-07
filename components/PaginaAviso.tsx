import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Emblema } from '@/components/Emblema'

type PaginaAvisoProps = {
  titulo: string
  descricao: string
  acao: { href: string; rotulo: string }
}

/** Páginas de aviso (404, 403): emblema apagado, título, explicação e uma saída. [CSS-10] */
export function PaginaAviso({ titulo, descricao, acao }: PaginaAvisoProps) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
      <Emblema className="size-12 text-texto-terciario" />
      <h1 className="font-heading text-4xl leading-none font-bold">{titulo}</h1> {/* [CSS-07][CSS-13] */}
      <p className="text-muted-foreground">{descricao}</p>
      <Link href={acao.href} className={buttonVariants({ className: 'mt-2' })}>{acao.rotulo}</Link> {/* [ROTA-16] */}
    </section>
  )
}
