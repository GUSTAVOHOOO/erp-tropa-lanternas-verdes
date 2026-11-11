import Link from 'next/link'
import { EmblemaOa } from '@/components/oanet/EmblemaOa'

type PaginaAvisoProps = {
  titulo: string
  descricao: string
  acao: { href: string; rotulo: string }
}

/** Páginas de aviso (404, 403): emblema apagado, título, explicação e uma saída. [CSS-10] */
export function PaginaAviso({ titulo, descricao, acao }: PaginaAvisoProps) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
      <EmblemaOa className="size-24" />
      <h1 className="font-heading text-4xl leading-none font-bold uppercase">{titulo}</h1> {/* [CSS-07][CSS-13] */}
      <p className="max-w-prose text-(--oa-muted)">{descricao}</p>
      <Link href={acao.href} className="oa-button mt-2 inline-flex items-center justify-center"> {/* [ROTA-16] */}
        <span className="oa-button-content">{acao.rotulo}</span>
      </Link>
    </section>
  )
}
