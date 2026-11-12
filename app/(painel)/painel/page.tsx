import type { Metadata } from 'next'
import Link from 'next/link'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { IconeOa } from '@/components/oanet/IconeOa'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { verificarSessao } from '@/lib/dal'
import { consultarDashboard } from '@/lib/dashboard'
import { listarTodosLanternas } from '@/lib/lanternas'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { DIAS_PADRAO, filtroDashboardSchema } from '@/lib/schemas/dashboard'
import { listarSetores } from '@/lib/setores'
import { Dashboard } from './_components/Dashboard'
import { SEM_CACHE } from '@/lib/api'

export const metadata: Metadata = { title: 'Dashboard | Central de Comando' }

type PainelPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Painel operacional: métricas agregadas do dashboard e as 5 ocorrências mais recentes. [API-07][ROTA-10]
 */
export default async function PainelPage({ searchParams }: PainelPageProps = {}) {
  const sessao = await verificarSessao() // [AUTH-04]
  const rawParams = searchParams ? await searchParams : {} // [ROTA-10]
  const { setor, dias } = filtroDashboardSchema.parse(rawParams) // [ROTA-11]

  const filtroConsulta: { setor?: number; dias?: number } = {}
  if (dias !== undefined) {
    filtroConsulta.dias = dias
  }
  // Lanterna nunca envia setor (AUTH-07); Guardião envia o setor escolhido (inclusive Setor 0)
  if (sessao.papel === 'guardiao' && setor !== undefined) {
    filtroConsulta.setor = setor
  }

  const [dashboard, setores, respostaRecentes, lanternas] = await Promise.all([ // [API-07]
    consultarDashboard(filtroConsulta),
    listarSetores(SEM_CACHE), // nomes da tabela para todos; o seletor de setor é só do Guardião
    listarOcorrencias({ limite: 5 }),
    listarTodosLanternas({}, SEM_CACHE),
  ])

  const ocorrencias = respostaRecentes.itens

  const descricao =
    sessao.papel === 'guardiao'
      ? (setor !== undefined ? `Setor ${setor}.` : 'Visão de todos os setores.')
      : `Ocorrências do Setor ${sessao.setorId}.`

  return (
    <section className="oa-screen grid gap-8">
      <CabecalhoPagina titulo={`Bem-vindo, ${sessao.nome}`} descricao={descricao}>
        <Link href="/painel/ocorrencias/nova" className="oa-button oa-button--energia"> {/* [ROTA-16] */}
          <span className="oa-button-content">
            <IconeOa nome="mais" />
            Registrar ocorrência
          </span>
        </Link>
      </CabecalhoPagina>

      <Dashboard
        dados={dashboard}
        dias={dias ?? DIAS_PADRAO}
        setores={sessao.papel === 'guardiao' ? setores : undefined}
      />

      <MolduraOa titulo="Mais recentes" icone="ocorrencias">
        {ocorrencias.length === 0 ? ( // [API-09]
          <EstadoVazio
            titulo="Nenhuma ocorrência registrada"
            descricao="Quando algo acontecer no setor, registre aqui."
            acao={{ href: '/painel/ocorrencias/nova', rotulo: 'Registrar ocorrência' }}
          />
        ) : (
          <TabelaOcorrencias
            ocorrencias={ocorrencias}
            nomeSetor={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
            nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.codinome]))}
          />
        )}
      </MolduraOa>
    </section>
  )
}
