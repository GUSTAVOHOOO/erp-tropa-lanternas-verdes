import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FichaLanterna } from '@/components/FichaLanterna'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { buscarLanterna } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import type { LanternaFicha } from '@/lib/schemas/lanterna'
import type { Setor } from '@/lib/schemas/setor'

export const metadata: Metadata = { title: 'Ficha do lanterna | Central de Oa' }

type LanternaPageProps = { params: Promise<{ id: string }> }

const ROTAS_PUBLICAS = {
  voltar: '/lanternas',
  rotuloVoltar: 'Voltar à lista',
  ficha: (id: string) => `/lanternas/${id}`,
  setor: (setorId: number) => `/lanternas?setor=${setorId}`,
}

/** Ficha pública detalhada de um lanterna. [ROTA-10][ROTA-12][API-07][API-12] */
export default async function LanternaPage({ params }: LanternaPageProps) {
  const { id } = await params // [ROTA-10]
  let lanterna: LanternaFicha | null = null
  let setores: Setor[] = []

  try {
    ;[lanterna, setores] = await Promise.all([buscarLanterna(id), listarSetores()]) // [API-07]
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }

  if (!lanterna) notFound() // [ROTA-12]

  return <FichaLanterna lanterna={lanterna} setor={setores.find((s) => s.id === lanterna.setorId)} rotas={ROTAS_PUBLICAS} />
}
