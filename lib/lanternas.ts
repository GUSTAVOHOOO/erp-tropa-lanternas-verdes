import { requisitarApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { paginaDe, type Pagina } from '@/lib/schemas/paginacao'
import { lanternaFichaSchema, lanternaListaSchema, slugLanternaSchema, type FiltroLanternas, type LanternaFicha, type LanternaLista } from '@/lib/schemas/lanterna'

export type FiltroListaLanternas = Partial<Pick<FiltroLanternas, 'busca' | 'status' | 'setor' | 'ordenar' | 'ordem' | 'pagina'>> & { limite?: number }

/** Lista uma página de Lanternas conforme os filtros aceitos pela API. [API-19] */
export async function listarLanternas(filtro: FiltroListaLanternas = {}): Promise<Pagina<LanternaLista>> {
  return requisitarApi('/lanternas', paginaDe(lanternaListaSchema), { consulta: filtro, cache: { revalidate: 60 } })
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

/** Reúne as páginas para mapas de nomes e seletores; não serve para calcular métricas. */
export async function listarTodosLanternas(filtro: { setor?: number } = {}): Promise<LanternaLista[]> {
  const primeira = await listarLanternas({ ...filtro, pagina: 1, limite: 50 })
  const lanternas = [...primeira.itens]
  for (let pagina = 2; pagina <= primeira.meta.paginas; pagina += 1) {
    const resposta = await listarLanternas({ ...filtro, pagina, limite: 50 })
    lanternas.push(...resposta.itens)
  }
  return lanternas
}
