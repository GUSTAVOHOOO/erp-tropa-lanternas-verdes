import Link from 'next/link'
import { IconeOa } from '@/components/oanet/IconeOa'
import { SeloOa } from '@/components/oanet/PainelOa'
import { rotuloStatusLanterna, type LanternaLista, type StatusLanterna } from '@/lib/schemas/lanterna'

type CartaoLanternaProps = {
  lanterna: LanternaLista
  nomeSetor: string | null
}

const tonsStatus: Record<StatusLanterna, 'verde' | 'ambar' | 'neutro'> = {
  ativo: 'verde',
  em_missao: 'ambar',
  afastado: 'neutro',
}

function obterSigla(codinome: string): string {
  const palavras = codinome.trim().split(/\s+/).filter(Boolean)
  if (palavras.length >= 2) {
    return `${palavras[0][0]}${palavras[1][0]}`.toUpperCase()
  }
  return (palavras[0]?.slice(0, 2) ?? '').toUpperCase()
}

/** Cartão de um lanterna na listagem pública: cada lanterna é uma ficha navegável. [ROTA-16] */
export function CartaoLanterna({ lanterna, nomeSetor }: CartaoLanternaProps) {
  const sigla = obterSigla(lanterna.codinome)
  const tom = tonsStatus[lanterna.status] ?? 'neutro'
  const origem = [lanterna.especie, lanterna.planetaNatal].filter(Boolean).join(' · ') || 'Origem não registrada'
  const rotuloSetor = lanterna.setorId === null ? 'Sem setor' : (nomeSetor ?? `Setor ${lanterna.setorId}`)

  return (
    <Link
      href={`/lanternas/${lanterna.id}`}
      className="group flex h-full min-w-0 items-start gap-4 border border-(--oa-line) bg-(--oa-raised) p-4 transition-colors duration-150 ease-out hover:border-(--oa-energy)"
    >
      <span className="oa-avatar" aria-hidden="true">{sigla}</span>
      <span className="grid min-w-0 flex-1 gap-2">
        <strong className="font-heading text-xl leading-tight font-semibold break-words">{lanterna.codinome}</strong>
        <span className="text-sm text-(--oa-muted) break-words">{origem}</span>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="oa-sector-label"><IconeOa nome="setores" />{rotuloSetor}</span>
          <SeloOa tom={tom}>{rotuloStatusLanterna[lanterna.status]}</SeloOa>
        </span>
        {lanterna.anoIngresso !== null && (
          <span className="text-xs text-(--oa-muted)">Ingresso: {lanterna.anoIngresso}</span>
        )}
      </span>
    </Link>
  )
}
