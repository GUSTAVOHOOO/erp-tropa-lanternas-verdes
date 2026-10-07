import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { EstadoVazio } from '@/components/EstadoVazio'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { verificarSessao } from '@/lib/dal'
import { listarLanternas } from '@/lib/lanternas'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/sessao'
import { listarSetores } from '@/lib/setores'
import { filtroOcorrenciasSchema } from '@/lib/schemas/ocorrencia'
import { FiltroOcorrencias } from '@/app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias'

export const metadata: Metadata = { title: 'Ocorrências | Central de Comando' }

type OcorrenciasPageProps = { searchParams: Promise<{ status?: string; setor?: string }> }

/** Lista de ocorrências com filtros na URL. */
export default async function OcorrenciasPage({ searchParams }: OcorrenciasPageProps) {
  const sessao = await verificarSessao() // [AUTH-04]
  const filtro = filtroOcorrenciasSchema.parse(await searchParams) // [ROTA-10][ROTA-11]
  const [ocorrencias, setores, lanternas] = await Promise.all([ // [API-07]
    listarOcorrencias({ setorId: setorParaFiltro(sessao, filtro.setor), status: filtro.status }), // [AUTH-07]
    listarSetores(),
    listarLanternas(),
  ])
  const temFiltro = Boolean(filtro.status || (sessao.papel === 'guardiao' && filtro.setor))

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Ocorrências</h1>
        <Link href="/painel/ocorrencias/nova" className={buttonVariants()}>Registrar ocorrência</Link>
      </div>
      <Suspense fallback={null}> {/* [ROTA-15] */}
        <FiltroOcorrencias setores={sessao.papel === 'guardiao' ? setores : []} />
      </Suspense>
      {ocorrencias.length === 0 ? ( // [API-09]
        <EstadoVazio
          titulo="Nenhuma ocorrência encontrada"
          descricao={temFiltro ? 'Nenhuma ocorrência combina com esses filtros.' : 'Ainda não há ocorrências registradas.'}
          acao={temFiltro ? { href: '/painel/ocorrencias', rotulo: 'Limpar filtros' } : undefined}
        />
      ) : (
        <TabelaOcorrencias
          ocorrencias={ocorrencias}
          nomeSetor={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
          nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.nome]))}
        />
      )}
    </section>
  )
}
