import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { ConstructoDoLanterna } from '@/components/oanet/GaleriaConstructos'
import { IconeOa } from '@/components/oanet/IconeOa'
import { MolduraOa, SeloOa } from '@/components/oanet/PainelOa'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { buscarLanterna } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import { rotuloStatusLanterna, type StatusLanterna } from '@/lib/schemas/lanterna'

export const metadata: Metadata = { title: 'Ficha do lanterna | Central de Oa' }

type LanternaPageProps = { params: Promise<{ id: string }> }

const tonsStatus: Record<StatusLanterna, 'verde' | 'ambar' | 'neutro'> = {
  ativo: 'verde',
  em_missao: 'ambar',
  afastado: 'neutro',
}

/** Ficha pública de um lanterna. */
export default async function LanternaPage({ params }: LanternaPageProps) {
  const { id } = await params // [ROTA-10]
  let lanterna, setores
  try {
    ;[lanterna, setores] = await Promise.all([buscarLanterna(id), listarSetores()]) // [API-07]
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }
  if (!lanterna) notFound() // [ROTA-12]
  const setor = setores.find((s) => s.id === lanterna.setorId)
  const tom = tonsStatus[lanterna.status] ?? 'neutro'

  return (
    <article className="oa-screen max-w-3xl">
      <div className="grid gap-4">
        <LinkVoltar href="/lanternas">Voltar à lista</LinkVoltar>
        <CabecalhoPagina titulo={lanterna.nome} descricao={`${lanterna.especie} · ${lanterna.planetaNatal}`} />
      </div>
      <MolduraOa className="oa-profile-panel">
        <div className="oa-profile">
          <span className="oa-profile-code">ARQUIVO DA TROPA / SETOR {lanterna.setorId}</span>
          <ConstructoDoLanterna nome={lanterna.nome} />
          <div className="my-3 flex justify-center">
            <SeloOa tom={tom}>{rotuloStatusLanterna[lanterna.status]}</SeloOa>
          </div>
          <h2 className="font-heading text-2xl font-bold uppercase">{lanterna.nome}</h2>
          <p className="text-sm text-(--oa-muted)">{lanterna.especie} · {lanterna.planetaNatal}</p>
          <dl className="mt-6 grid gap-4 border-t border-(--oa-line) pt-6 sm:grid-cols-2 text-left">
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Espécie</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{lanterna.especie}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Planeta natal</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{lanterna.planetaNatal}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Setor de patrulha</dt>
              <dd className="grid gap-1">
                <Link href={`/lanternas?setor=${lanterna.setorId}`} className="oa-sector-label w-fit text-sm text-(--oa-energy) hover:underline">
                  <IconeOa nome="setores" />
                  {setor?.nome ?? `Setor ${lanterna.setorId}`}
                </Link>
                {setor && <span className="text-xs text-(--oa-muted)">{setor.descricao}</span>}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Status operacional</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{rotuloStatusLanterna[lanterna.status]}</dd>
            </div>
          </dl>
        </div>
      </MolduraOa>
    </article>
  )
}
