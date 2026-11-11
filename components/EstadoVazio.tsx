import Link from 'next/link'
import { IconeOa } from '@/components/oanet/IconeOa'

type EstadoVazioProps = {
  titulo: string
  descricao: string
  acao?: { href: string; rotulo: string }
}

/** Estado "deu certo, mas não há dados": explica e oferece uma saída. */
export function EstadoVazio({ titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div role="status" className="oa-empty"> {/* [API-09] */}
      <IconeOa nome="busca" />
      <p><strong className="block text-lg font-medium text-(--oa-text)">{titulo}</strong></p> {/* parágrafo, como antes: não entra na hierarquia de títulos da página */}
      <p>{descricao}</p>
      {acao && (
        <Link href={acao.href} className="oa-button oa-button--linha mt-4 inline-flex">
          <span className="oa-button-content">{acao.rotulo}</span>
        </Link>
      )}
    </div>
  )
}
