import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { buscarLanterna } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import { rotuloStatusLanterna } from '@/lib/schemas/lanterna'

export const metadata: Metadata = { title: 'Ficha do lanterna | Central de Oa' }

type LanternaPageProps = { params: Promise<{ id: string }> }

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

  return (
    <article className="grid max-w-2xl gap-8">
      <div className="grid gap-4">
        <LinkVoltar href="/lanternas">Voltar à lista</LinkVoltar>
        <CabecalhoPagina titulo={lanterna.nome} descricao={`${lanterna.especie} · ${lanterna.planetaNatal}`} />
      </div>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2"> {/* [CSS-03] */}
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Espécie</dt>
          <dd>{lanterna.especie}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Planeta natal</dt>
          <dd>{lanterna.planetaNatal}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Setor</dt>
          <dd className="grid gap-1">
            <Link href={`/lanternas?setor=${lanterna.setorId}`} className="w-fit font-mono text-sm text-primary-texto underline-offset-4 hover:underline">
              {setor?.nome ?? `Setor ${lanterna.setorId}`}
            </Link>
            {setor && <span className="text-sm text-muted-foreground">{setor.descricao}</span>}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Status</dt>
          <dd>{rotuloStatusLanterna[lanterna.status]}</dd>
        </div>
      </dl>
    </article>
  )
}
