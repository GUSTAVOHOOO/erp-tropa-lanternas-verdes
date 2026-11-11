import Link from 'next/link'
import { IconeOa } from '@/components/oanet/IconeOa'
import { SeloOa } from '@/components/oanet/PainelOa'
import { rotuloStatusLanterna, type Lanterna, type StatusLanterna } from '@/lib/schemas/lanterna'

type CartaoLanternaProps = {
  lanterna: Lanterna
  nomeSetor: string
}

const tonsStatus: Record<StatusLanterna, 'verde' | 'ambar' | 'neutro'> = {
  ativo: 'verde',
  em_missao: 'ambar',
  afastado: 'neutro',
}

function obterSigla(nome: string): string {
  const palavras = nome.trim().split(/\s+/).filter(Boolean)
  if (palavras.length >= 2) {
    return `${palavras[0][0]}${palavras[1][0]}`.toUpperCase()
  }
  return (palavras[0]?.slice(0, 2) ?? '').toUpperCase()
}

/** Cartão de um lanterna na listagem pública: aqui o cartão se justifica, cada lanterna é uma ficha navegável. */
export function CartaoLanterna({ lanterna, nomeSetor }: CartaoLanternaProps) {
  const sigla = obterSigla(lanterna.nome)
  const tom = tonsStatus[lanterna.status]

  return (
    <Link
      href={`/lanternas/${lanterna.id}`}
      className="group flex h-full min-w-0 items-start gap-4 border border-(--oa-line) bg-(--oa-raised) p-4 transition-colors duration-150 ease-out hover:border-(--oa-energy)"
    > {/* [ROTA-16] */}
      <span className="oa-avatar" aria-hidden="true">{sigla}</span>
      <span className="grid min-w-0 flex-1 gap-2">
        <strong className="font-heading text-xl leading-tight font-semibold break-words">{lanterna.nome}</strong> {/* [CSS-13] */}
        <span className="text-sm text-(--oa-muted) break-words">{lanterna.especie} · {lanterna.planetaNatal}</span>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="oa-sector-label"><IconeOa nome="setores" />{nomeSetor}</span>
          <SeloOa tom={tom}>{rotuloStatusLanterna[lanterna.status]}</SeloOa>
        </span>
      </span>
    </Link>
  )
}
