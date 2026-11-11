import 'server-only'
import * as z from 'zod'
import { requisitarApi, requisitarApiSemConteudo, type OpcoesApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { lerTokenObrigatorio } from '@/lib/dal'
import { paginaDe, type Pagina } from '@/lib/schemas/paginacao'
import { ocorrenciaSchema, type FiltroOcorrencias, type Ocorrencia, type StatusOcorrencia } from '@/lib/schemas/ocorrencia'

/** Corpo de POST /ocorrencias: o Lanterna nunca envia setorId; o Guardião sempre envia. */
export type CriacaoLanterna = Pick<Ocorrencia, 'titulo' | 'descricao' | 'planeta' | 'gravidade' | 'envolvidos'>
export type CriacaoGuardiao = CriacaoLanterna & { setorId: number }
/** PATCH /ocorrencias/{id}: só os campos alterados (minProperties 1). */
export type CamposEdicaoOcorrencia = Partial<CriacaoLanterna>
export type MudancaStatus = { status: StatusOcorrencia; resolucao?: string; motivo?: string }
export type FiltroListaOcorrencias = Partial<FiltroOcorrencias> & { limite?: number }

const uuidSchema = z.uuid()

/** Ocorrências mudam o tempo todo e dependem do usuário: sempre sem cache e com o token da sessão. [API-06] */
async function opcoes(extra: Omit<OpcoesApi, 'cache' | 'token'> = {}): Promise<OpcoesApi> {
  return { ...extra, token: await lerTokenObrigatorio(), cache: { cache: 'no-store' } }
}

function caminho(id: string, sufixo = ''): string {
  return `/ocorrencias/${encodeURIComponent(uuidSchema.parse(id))}${sufixo}`
}

/** Parâmetros de GET /ocorrencias no contrato; um nome antigo (ex.: setorId do json-server) falha antes do envio. */
const PARAMETROS_LISTA = new Set(['status', 'gravidade', 'setor', 'responsavel', 'vencida', 'busca', 'pagina', 'limite', 'ordenar', 'ordem'])

/** Página de ocorrências no escopo da sessão (a API aplica o setor do Lanterna). [API-19] */
export async function listarOcorrencias(filtro: FiltroListaOcorrencias = {}): Promise<Pagina<Ocorrencia>> {
  const desconhecido = Object.keys(filtro).find((chave) => !PARAMETROS_LISTA.has(chave))
  if (desconhecido) throw new Error(`Parâmetro fora do contrato em listarOcorrencias: ${desconhecido}`)
  return requisitarApi('/ocorrencias', paginaDe(ocorrenciaSchema), await opcoes({ consulta: filtro }))
}

/** Total do servidor para um filtro; nunca conte os itens de uma página. */
export async function contarOcorrencias(filtro: FiltroListaOcorrencias = {}): Promise<number> {
  return (await listarOcorrencias({ ...filtro, limite: 1 })).meta.total
}

/** Detalhe, ou null para UUID inválido, inexistente, excluída ou de outro setor (404 da API). */
export async function buscarOcorrencia(id: string): Promise<Ocorrencia | null> {
  if (!uuidSchema.safeParse(id).success) return null
  try {
    return await requisitarApi(caminho(id), ocorrenciaSchema, await opcoes())
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 404) return null
    throw erro
  }
}

export async function criarOcorrencia(corpo: CriacaoLanterna | CriacaoGuardiao): Promise<Ocorrencia> {
  return requisitarApi('/ocorrencias', ocorrenciaSchema, await opcoes({ metodo: 'POST', corpo }))
}

export async function editarOcorrencia(id: string, campos: CamposEdicaoOcorrencia): Promise<Ocorrencia> {
  return requisitarApi(caminho(id), ocorrenciaSchema, await opcoes({ metodo: 'PATCH', corpo: campos }))
}

/** Sub-recurso de estado, separado do PATCH de dados. */
export async function alterarStatusOcorrencia(id: string, mudanca: MudancaStatus): Promise<Ocorrencia> {
  return requisitarApi(caminho(id, '/status'), ocorrenciaSchema, await opcoes({ metodo: 'PATCH', corpo: mudanca }))
}

/** `null` libera o responsável de uma ocorrência aberta. */
export async function definirResponsavel(id: string, responsavelId: string | null): Promise<Ocorrencia> {
  return requisitarApi(caminho(id, '/responsavel'), ocorrenciaSchema, await opcoes({ metodo: 'PATCH', corpo: { responsavelId } }))
}

/** Exclusão lógica: 204 sem corpo. */
export async function excluirOcorrencia(id: string): Promise<void> {
  await requisitarApiSemConteudo(caminho(id), await opcoes({ metodo: 'DELETE' }))
}
