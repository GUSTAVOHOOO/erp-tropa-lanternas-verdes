import { requisitarApi, type CacheApi, type OpcoesApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { lerTokenObrigatorio } from '@/lib/dal'
import { paginaDe, type Pagina } from '@/lib/schemas/paginacao'
import { lanternaFichaSchema, lanternaListaSchema, slugLanternaSchema, type FiltroLanternas, type LanternaFicha, type LanternaLista } from '@/lib/schemas/lanterna'
import type { LanternaCriacaoEntrada, LanternaEdicaoEntrada } from '@/lib/schemas/gestao-lanterna'

export type FiltroListaLanternas = Partial<Pick<FiltroLanternas, 'busca' | 'status' | 'setor' | 'ordenar' | 'ordem' | 'pagina'>> & { limite?: number }

/** Lista uma página de Lanternas conforme os filtros aceitos pela API. [API-19] */
export async function listarLanternas(filtro: FiltroListaLanternas = {}, cache: CacheApi = { revalidate: 60 }): Promise<Pagina<LanternaLista>> {
  return requisitarApi('/lanternas', paginaDe(lanternaListaSchema), { consulta: filtro, cache })
}

/** Busca uma Ficha pública; slug inválido ou recurso inexistente retorna null. */
export async function buscarLanterna(slug: string): Promise<LanternaFicha | null> {
  if (!slugLanternaSchema.safeParse(slug).success) return null
  try {
    return await requisitarApi('/lanternas/' + encodeURIComponent(slug), lanternaFichaSchema, { cache: { revalidate: 60 } })
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 404) return null
    throw erro
  }
}

/**
 * Reúne as páginas para mapas de nomes e seletores; não serve para calcular métricas.
 * Telas operacionais (atribuição) pedem `{ cache: 'no-store' }`: status e Setor precisam estar atuais. [API-14]
 */
export async function listarTodosLanternas(filtro: { setor?: number } = {}, cache: CacheApi = { revalidate: 60 }): Promise<LanternaLista[]> {
  const primeira = await listarLanternas({ ...filtro, pagina: 1, limite: 50 }, cache)
  const lanternas = [...primeira.itens]
  for (let pagina = 2; pagina <= primeira.meta.paginas; pagina += 1) {
    const resposta = await listarLanternas({ ...filtro, pagina, limite: 50 }, cache)
    lanternas.push(...resposta.itens)
  }
  return lanternas
}

async function opcoesPrivadas(extra: Omit<OpcoesApi, 'cache' | 'token'> = {}): Promise<OpcoesApi> {
  return { ...extra, token: await lerTokenObrigatorio(), cache: { cache: 'no-store' } }
}

/** Cria uma nova Ficha de Lanterna no sistema. Restrito ao Guardião. [API-06] */
export async function criarLanterna(dados: LanternaCriacaoEntrada): Promise<LanternaFicha> {
  return requisitarApi('/lanternas', lanternaFichaSchema, await opcoesPrivadas({ metodo: 'POST', corpo: dados }))
}

/** Edita os dados de uma Ficha de Lanterna; envia apenas os campos alterados. Restrito ao Guardião. [API-06] */
export async function editarLanterna(slug: string, campos: LanternaEdicaoEntrada): Promise<LanternaFicha> {
  const slugValido = slugLanternaSchema.parse(slug)
  return requisitarApi(`/lanternas/${encodeURIComponent(slugValido)}`, lanternaFichaSchema, await opcoesPrivadas({ metodo: 'PATCH', corpo: campos }))
}

/** Altera o status operacional da Ficha (ativo ou afastado). Restrito ao Guardião. [API-06] */
export async function alterarStatusLanterna(slug: string, status: 'ativo' | 'afastado'): Promise<LanternaFicha> {
  const slugValido = slugLanternaSchema.parse(slug)
  return requisitarApi(`/lanternas/${encodeURIComponent(slugValido)}/status`, lanternaFichaSchema, await opcoesPrivadas({ metodo: 'PATCH', corpo: { status } }))
}
