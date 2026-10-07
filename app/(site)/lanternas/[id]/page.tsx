import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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
    <article className="max-w-2xl">
      <Link href="/lanternas" className="text-sm text-primary hover:underline">← Voltar à lista</Link>
      <h1 className="mt-4 text-3xl font-bold">{lanterna.nome}</h1>
      <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
        <dt className="font-medium">Espécie</dt>
        <dd>{lanterna.especie}</dd>
        <dt className="font-medium">Planeta natal</dt>
        <dd>{lanterna.planetaNatal}</dd>
        <dt className="font-medium">Setor</dt>
        <dd>
          <Link href={`/lanternas?setor=${lanterna.setorId}`} className="text-primary hover:underline">
            {setor?.nome ?? `Setor ${lanterna.setorId}`}
          </Link>
          {setor && <p className="text-sm text-muted-foreground">{setor.descricao}</p>}
        </dd>
        <dt className="font-medium">Status</dt>
        <dd>{rotuloStatusLanterna[lanterna.status]}</dd>
      </dl>
    </article>
  )
}
