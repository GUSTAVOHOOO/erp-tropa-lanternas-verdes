import 'server-only' // [AUTH-12] resolvido pelo alias interno do Next; sem dependência nova
import * as z from 'zod'
import { env } from '@/lib/env'
import { ApiError, FALHA_REDE, RESPOSTA_INVALIDA } from '@/lib/api-error'

export type CacheApi = { cache: 'no-store' } | { revalidate: number; tags?: string[] }
export type OpcoesApi = {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  consulta?: Record<string, string | number | boolean | null | undefined>
  corpo?: unknown
  token?: string
  cache: CacheApi
}

const envelopeSucessoSchema = z.object({ sucesso: z.literal(true), dados: z.unknown() }).strict()
const envelopeErroSchema = z.object({
  sucesso: z.literal(false),
  erro: z.object({
    status: z.number(), mensagem: z.string(), codigo: z.string(),
    detalhes: z.array(z.object({ campo: z.string(), mensagens: z.array(z.string()) }).strict()).optional(),
  }).strict(),
  caminho: z.string(), timestamp: z.string(),
}).strict()

function registrarErro(metodo: string, caminho: string, status: number, codigo?: string, issues?: readonly { path: PropertyKey[] }[]) {
  console.error({ metodo, caminho: new URL(caminho, env.API_URL).pathname, status, codigo, ...(issues ? { issues: issues.map((issue) => issue.path) } : {}) })
}

function montarPedido(caminho: string, opcoes: OpcoesApi) {
  const metodo = opcoes.metodo ?? 'GET'
  const url = new URL(caminho, env.API_URL)
  for (const [chave, valor] of Object.entries(opcoes.consulta ?? {})) {
    if (valor === undefined || valor === null || valor === '') continue
    url.searchParams.set(chave, String(valor))
  }
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opcoes.corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (opcoes.token) headers.Authorization = `Bearer ${opcoes.token}`
  const init: RequestInit & { next?: { revalidate: number; tags?: string[] } } = {
    method: metodo, headers,
    ...(opcoes.corpo === undefined ? {} : { body: JSON.stringify(opcoes.corpo) }),
    ...('cache' in opcoes.cache ? { cache: opcoes.cache.cache } : { next: { revalidate: opcoes.cache.revalidate, ...(opcoes.cache.tags ? { tags: opcoes.cache.tags } : {}) } }),
  }
  return { metodo, url, init }
}

/** Converte a resposta de erro no ApiError do contrato; sem envelope válido, só o status. [API-02][API-03] */
async function lancarErroHttp(metodo: string, caminho: string, resposta: Response): Promise<never> {
  let corpo: unknown
  try { corpo = await resposta.json() } catch { /* Resposta sem envelope contratual. */ }
  const parseErro = envelopeErroSchema.safeParse(corpo)
  const codigo = parseErro.success ? parseErro.data.erro.codigo : undefined
  const detalhes = parseErro.success ? parseErro.data.erro.detalhes ?? [] : []
  registrarErro(metodo, caminho, resposta.status, codigo)
  throw new ApiError(resposta.status, codigo, detalhes)
}

async function executar(caminho: string, opcoes: OpcoesApi) {
  const pedido = montarPedido(caminho, opcoes)
  try {
    return { ...pedido, resposta: await fetch(pedido.url, pedido.init) }
  } catch {
    registrarErro(pedido.metodo, caminho, 0, FALHA_REDE)
    throw new ApiError(0, FALHA_REDE)
  }
}

/** Chamada com envelope `{ sucesso, dados }`: devolve `dados` validado pelo schema do serviço. [API-17][API-04] */
export async function requisitarApi<T>(caminho: string, dados: z.ZodType<T>, opcoes: OpcoesApi): Promise<T> {
  const { metodo, resposta } = await executar(caminho, opcoes)
  if (!resposta.ok) await lancarErroHttp(metodo, caminho, resposta)
  if (resposta.status === 204) {
    registrarErro(metodo, caminho, resposta.status, RESPOSTA_INVALIDA)
    throw new ApiError(resposta.status, RESPOSTA_INVALIDA)
  }
  let corpo: unknown
  try { corpo = await resposta.json() } catch {
    registrarErro(metodo, caminho, resposta.status, RESPOSTA_INVALIDA)
    throw new ApiError(resposta.status, RESPOSTA_INVALIDA)
  }
  const envelope = envelopeSucessoSchema.safeParse(corpo)
  if (!envelope.success) {
    registrarErro(metodo, caminho, resposta.status, RESPOSTA_INVALIDA, envelope.error.issues)
    throw new ApiError(resposta.status, RESPOSTA_INVALIDA)
  }
  const validado = dados.safeParse(envelope.data.dados)
  if (!validado.success) {
    registrarErro(metodo, caminho, resposta.status, RESPOSTA_INVALIDA, validado.error.issues)
    throw new ApiError(resposta.status, RESPOSTA_INVALIDA)
  }
  return validado.data
}

/** Chamada que responde 204 sem corpo: não tenta ler JSON. */
export async function requisitarApiSemConteudo(caminho: string, opcoes: OpcoesApi): Promise<void> {
  const { metodo, resposta } = await executar(caminho, opcoes)
  if (!resposta.ok) await lancarErroHttp(metodo, caminho, resposta)
  if (resposta.status !== 204) {
    registrarErro(metodo, caminho, resposta.status, RESPOSTA_INVALIDA)
    throw new ApiError(resposta.status, RESPOSTA_INVALIDA)
  }
}
