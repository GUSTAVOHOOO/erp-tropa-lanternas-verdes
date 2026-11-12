import 'server-only'
import * as z from 'zod'
import { requisitarApi, requisitarApiSemConteudo, type OpcoesApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { lerTokenObrigatorio } from '@/lib/dal'
import { idSetorSchema, setorSchema, type Setor } from '@/lib/schemas/setor'

export type CriacaoSetor = {
  id: number
  nome: string
  descricao: string
}

export type EdicaoSetor = {
  nome?: string
  descricao?: string
}

async function opcoes(extra: Omit<OpcoesApi, 'cache' | 'token'> = {}): Promise<OpcoesApi> {
  return { ...extra, token: await lerTokenObrigatorio(), cache: { cache: 'no-store' } }
}

function caminho(id: number): string {
  return `/setores/${encodeURIComponent(idSetorSchema.parse(id))}`
}

/** Lista os setores publicos do contrato. */
export async function listarSetores(): Promise<Setor[]> {
  return requisitarApi('/setores', z.array(setorSchema), { cache: { revalidate: 60 } })
}

/** Consulta um setor pelo id (público). Retorna null se não encontrado (404). */
export async function buscarSetor(id: number): Promise<Setor | null> {
  const parse = idSetorSchema.safeParse(id)
  if (!parse.success) return null
  try {
    return await requisitarApi(caminho(parse.data), setorSchema, { cache: { cache: 'no-store' } })
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 404) return null
    throw erro
  }
}

/** Cria um novo setor (restrito ao Guardião). */
export async function criarSetor(dados: CriacaoSetor): Promise<Setor> {
  return requisitarApi('/setores', setorSchema, await opcoes({ metodo: 'POST', corpo: dados }))
}

/** Edita nome e/ou descrição de um setor (restrito ao Guardião). */
export async function editarSetor(id: number, campos: EdicaoSetor): Promise<Setor> {
  return requisitarApi(caminho(id), setorSchema, await opcoes({ metodo: 'PATCH', corpo: campos }))
}

/** Remove um setor sem vínculos ativos (restrito ao Guardião). */
export async function excluirSetor(id: number): Promise<void> {
  await requisitarApiSemConteudo(caminho(id), await opcoes({ metodo: 'DELETE' }))
}
