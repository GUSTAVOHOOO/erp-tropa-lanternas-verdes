import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { IconeOa } from '@/components/oanet/IconeOa'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { Paginacao } from '@/components/Paginacao'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { verificarSessao } from '@/lib/dal'
import { listarTodosLanternas } from '@/lib/lanternas'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { filtroOcorrenciasSchema } from '@/lib/schemas/ocorrencia'
import { listarSetores } from '@/lib/setores'
import { FiltroOcorrencias } from '@/app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias'

export const metadata: Metadata = { title: 'Ocorrências | Central de Comando' }

type OcorrenciasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Lista de ocorrências com filtros e paginação na URL. [ROTA-10][ROTA-11][ROTA-14][API-07] */
export default async function OcorrenciasPage({ searchParams }: OcorrenciasPageProps) {
  const sessao = await verificarSessao() // [AUTH-04]
  const parametros = await searchParams // [ROTA-10]
  const filtro = filtroOcorrenciasSchema.parse(parametros) // [ROTA-11]

  const filtroConsulta = {
    ...filtro,
    setor: sessao.papel === 'guardiao' ? filtro.setor : undefined, // [AUTH-07] Lanterna ignora setor da URL
    limite: 20,
  }

  const [resultado, setores, lanternas] = await Promise.all([ // [API-07]
    listarOcorrencias(filtroConsulta),
    listarSetores(),
    listarTodosLanternas(),
  ])

  const temFiltro = Boolean(
    filtro.status ||
    filtro.gravidade ||
    (sessao.papel === 'guardiao' && filtro.setor !== undefined) ||
    filtro.responsavel ||
    filtro.vencida ||
    filtro.busca ||
    filtro.ordenar ||
    filtro.ordem ||
    (filtro.pagina && filtro.pagina > 1),
  )

  const parametrosPaginacao: Record<string, string | undefined> = {
    busca: filtro.busca,
    status: filtro.status,
    gravidade: filtro.gravidade,
    setor: sessao.papel === 'guardiao' && filtro.setor !== undefined ? String(filtro.setor) : undefined,
    responsavel: filtro.responsavel,
    vencida: filtro.vencida ? 'true' : undefined,
    ordenar: filtro.ordenar,
    ordem: filtro.ordem,
  }

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
            <FiltroOcorrencias
              setores={sessao.papel === 'guardiao' ? setores : []}
              lanternas={lanternas}
            />
          </Suspense>
        </div>
      </MolduraOa>
      <MolduraOa titulo="Registros operacionais" icone="ocorrencias">
        {resultado.itens.length === 0 ? ( // [API-09]
          <EstadoVazio
            titulo="Nenhuma ocorrência encontrada"
            descricao={temFiltro ? 'Nenhuma ocorrência combina com esses filtros.' : 'Ainda não há ocorrências registradas.'}
            acao={temFiltro ? { href: '/painel/ocorrencias', rotulo: 'Limpar filtros' } : undefined}
          />
        ) : (
          <div className="grid gap-4">
            <TabelaOcorrencias
              ocorrencias={resultado.itens}
              nomeSetor={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
              nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.codinome]))}
            />
            <Paginacao
              pagina={resultado.meta.pagina}
              paginas={resultado.meta.paginas}
              caminho="/painel/ocorrencias"
              parametros={parametrosPaginacao}
            />
          </div>
        )}
      </MolduraOa>
    </section>
  )
}
