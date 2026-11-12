import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { IconeOa } from '@/components/oanet/IconeOa'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { verificarSessao } from '@/lib/dal'
import { normalizarFiltroOcorrencias } from '@/lib/filtro-ocorrencias'
import { listarLanternas } from '@/lib/lanternas'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/escopo'
import { listarSetores } from '@/lib/setores'
import { FiltroOcorrencias } from '@/app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias'

export const metadata: Metadata = { title: 'Ocorrências | Central de Comando' }

type OcorrenciasPageProps = { searchParams: Promise<{ status?: string | string[]; gravidade?: string | string[]; setor?: string | string[] }> }

/** Lista de ocorrências com filtros na URL. */
export default async function OcorrenciasPage({ searchParams }: OcorrenciasPageProps) {
  const sessao = await verificarSessao() // [AUTH-04]
  const parametros = await searchParams // [ROTA-10]
  const [setores, lanternas] = await Promise.all([listarSetores(), listarLanternas()]) // [API-07]
  const filtro = normalizarFiltroOcorrencias(parametros, setores.map((s) => s.id)) // [ROTA-11]
  const setorDaUrl = filtro.setor === undefined ? undefined : Number(filtro.setor)
  const setorDoFiltro = setorParaFiltro(sessao, setorDaUrl !== undefined && Number.isNaN(setorDaUrl) ? undefined : setorDaUrl)
  const ocorrencias = await listarOcorrencias({ setorId: setorDoFiltro === undefined ? undefined : String(setorDoFiltro), status: filtro.status, gravidade: filtro.gravidade }) // [AUTH-07] // FE-04: setor inteiro do contrato
  const temFiltro = Boolean(filtro.status || filtro.gravidade || (sessao.papel === 'guardiao' && filtro.setor))

  return (
    <section className="oa-screen grid gap-6">
      <CabecalhoPagina
        titulo="Ocorrências"
        descricao={sessao.papel === 'guardiao' ? 'Todas as ocorrências da Tropa.' : `Ocorrências do Setor ${sessao.setorId}.`}
      >
        <Link href="/painel/ocorrencias/nova" className="oa-button oa-button--energia"> {/* [ROTA-16] */}
          <span className="oa-button-content">
            <IconeOa nome="mais" />
            Registrar ocorrência
          </span>
        </Link>
      </CabecalhoPagina>
      <MolduraOa titulo="Filtros operacionais" icone="painel">
        <div className="oa-panel-body">
          <Suspense fallback={null}> {/* [ROTA-15] */}
            <FiltroOcorrencias setores={sessao.papel === 'guardiao' ? setores : []} />
          </Suspense>
        </div>
      </MolduraOa>
      <MolduraOa titulo="Registros operacionais" icone="ocorrencias">
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
      </MolduraOa>
    </section>
  )
}
