import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { MolduraOa, SeloOa } from '@/components/oanet/PainelOa'
import { Paginacao } from '@/components/Paginacao'
import { listarLanternas } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import { filtroLanternasSchema } from '@/lib/schemas/lanterna'
import { CartaoLanterna } from '@/app/(site)/lanternas/_components/CartaoLanterna'
import { FiltroLanternas } from '@/app/(site)/lanternas/_components/FiltroLanternas'

export const metadata: Metadata = {
  title: 'Lanternas | Central de Oa',
  description: 'Membros da Tropa dos Lanternas Verdes, por setor.',
}

type LanternasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Listagem pública com busca, filtros de status/setor, ordenação e paginação. [ROTA-10][ROTA-11][ROTA-14][API-07] */
export default async function LanternasPage({ searchParams }: LanternasPageProps) {
  const parametrosUrl = await searchParams // [ROTA-10]
  const filtro = filtroLanternasSchema.parse(parametrosUrl) // [ROTA-11]
  const [setores, resultado] = await Promise.all([
    listarSetores(),
    listarLanternas({ ...filtro, limite: 12 }),
  ]) // [API-07]

  const { itens: lanternas, meta } = resultado
  const nomeSetorMap = new Map(setores.map((s) => [s.id, s.nome]))

  const temFiltro = Boolean(
    filtro.busca ||
    filtro.status ||
    filtro.setor !== undefined ||
    (filtro.ordenar && filtro.ordenar !== 'codinome') ||
    (filtro.ordem && filtro.ordem !== 'asc') ||
    (filtro.pagina && filtro.pagina > 1)
  )

  const paramsPag1 = new URLSearchParams()
  if (filtro.busca) paramsPag1.set('busca', filtro.busca)
  if (filtro.status) paramsPag1.set('status', filtro.status)
  if (filtro.setor !== undefined) paramsPag1.set('setor', String(filtro.setor))
  if (filtro.ordenar) paramsPag1.set('ordenar', filtro.ordenar)
  if (filtro.ordem) paramsPag1.set('ordem', filtro.ordem)
  const qsPag1 = paramsPag1.toString()
  const hrefPagina1 = qsPag1 ? `/lanternas?${qsPag1}` : '/lanternas'

  const parametrosPaginacao: Record<string, string | undefined> = {
    busca: filtro.busca,
    status: filtro.status,
    setor: filtro.setor !== undefined ? String(filtro.setor) : undefined,
    ordenar: filtro.ordenar,
    ordem: filtro.ordem,
  }

  return (
    <section className="oa-screen">
      <CabecalhoPagina titulo="Lanternas da Tropa" descricao="Membros da Tropa, por setor." />

      <MolduraOa titulo="Filtros" icone="busca">
        <div className="oa-panel-body p-4 md:p-6">
          <Suspense fallback={null}> {/* [ROTA-15] */}
            <FiltroLanternas setores={setores} />
          </Suspense>
        </div>
      </MolduraOa>

      <MolduraOa
        titulo="Efetivo da Tropa"
        icone="pessoal"
        acao={<SeloOa tom="neutro">{meta.total} {meta.total === 1 ? 'lanterna' : 'lanternas'}</SeloOa>}
      >
        <div className="oa-panel-body p-4 md:p-6">
          {lanternas.length === 0 ? ( // [COMP-14][API-09]
            meta.total > 0 ? (
              <EstadoVazio
                titulo="Nenhum lanterna nesta página"
                descricao="A página solicitada está além do número de registros disponíveis."
                acao={{ href: hrefPagina1, rotulo: 'Voltar à página 1' }}
              />
            ) : temFiltro ? (
              <EstadoVazio
                titulo="Nenhum lanterna encontrado"
                descricao="Nenhum membro da Tropa corresponde aos critérios de busca ou filtros aplicados."
                acao={{ href: '/lanternas', rotulo: 'Limpar filtros' }}
              />
            ) : (
              <EstadoVazio
                titulo="Ainda não há lanternas cadastrados"
                descricao="O efetivo da Tropa dos Lanternas Verdes ainda não possui membros registrados."
              />
            )
          ) : (
            <div className="grid gap-6">
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"> {/* [CSS-03] */}
                {lanternas.map((l) => (
                  <li key={l.id}>
                    <CartaoLanterna
                      lanterna={l}
                      nomeSetor={l.setorId !== null ? (nomeSetorMap.get(l.setorId) ?? `Setor ${l.setorId}`) : null}
                    />
                  </li>
                ))}
              </ul>
              <Paginacao
                pagina={meta.pagina}
                paginas={meta.paginas}
                caminho="/lanternas"
                parametros={parametrosPaginacao}
              />
            </div>
          )}
        </div>
      </MolduraOa>
    </section>
  )
}
