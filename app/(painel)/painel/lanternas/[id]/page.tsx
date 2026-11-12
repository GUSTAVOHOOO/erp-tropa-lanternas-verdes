import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FichaLanterna, type RotasFicha } from '@/components/FichaLanterna'
import { verificarSessao } from '@/lib/dal'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { buscarLanterna } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import type { LanternaFicha } from '@/lib/schemas/lanterna'
import type { Setor } from '@/lib/schemas/setor'
import { SEM_CACHE } from '@/lib/api'

export const metadata: Metadata = { title: 'Ficha do lanterna | Central de Oa' }

type FichaPainelProps = { params: Promise<{ id: string }> }

/**
 * Ficha de um Lanterna dentro do painel: quem está logado continua na casca do painel.
 * Guardião volta à gestão; Lanterna volta ao Resumo (o ranking do dashboard aponta para cá). [AUTH-05][ROTA-10]
 */
export default async function FichaPainelPage({ params }: FichaPainelProps) {
  const sessao = await verificarSessao() // [AUTH-05]
  const { id } = await params // [ROTA-10]
  let lanterna: LanternaFicha | null = null
  let setores: Setor[] = []

  try {
    // Painel mostra o estado atual (status, carga): sem cache. [API-14]
    ;[lanterna, setores] = await Promise.all([buscarLanterna(id, SEM_CACHE), listarSetores(SEM_CACHE)])
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }

  if (!lanterna) notFound() // [ROTA-12]

  const guardiao = sessao.papel === 'guardiao'
  const rotas: RotasFicha = {
    voltar: guardiao ? '/painel/lanternas' : '/painel',
    rotuloVoltar: guardiao ? 'Voltar à gestão de Lanternas' : 'Voltar ao Resumo',
    ficha: (slug) => `/painel/lanternas/${slug}`,
    setor: guardiao ? (setorId) => `/painel/lanternas?setor=${setorId}` : null,
  }

  return <FichaLanterna lanterna={lanterna} setor={setores.find((s) => s.id === lanterna.setorId)} rotas={rotas} />
}
