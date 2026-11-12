'use server'

import * as z from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, destinoDoErro, resultadoDeErroApi } from '@/lib/api-error'
import { exigirPapel } from '@/lib/dal'
import type { ResultadoAcao } from '@/lib/resultado-acao'
import {
  edicaoSetorSchema,
  idSetorSchema,
  setorFormularioSchema,
} from '@/lib/schemas/setor'
import {
  buscarSetor,
  criarSetor,
  editarSetor,
  excluirSetor,
  type EdicaoSetor,
} from '@/lib/setores'

const SETOR_INEXISTENTE: ResultadoAcao = { ok: false, erro: 'Este setor não existe mais.' }
const SETOR_EM_USO_MENSAGEM = 'Este setor tem lanternas, ocorrências ou contas ligadas e não pode ser removido.'

function tratarErroApi(erro: unknown): ResultadoAcao {
  const destino = destinoDoErro(erro)
  if (destino === 'sessao-expirada') redirect('/sessao-expirada') // [AUTH-13]
  if (destino === 'acesso-negado') redirect('/acesso-negado') // [AUTH-06]
  if (destino === 'nao-encontrado') return SETOR_INEXISTENTE

  if (erro instanceof ApiError && erro.status === 409) {
    if (erro.codigo === 'SETOR_JA_CADASTRADO') {
      return { ok: false, errors: { id: ['Este setor já está cadastrado.'] } }
    }
    if (erro.codigo === 'SETOR_EM_USO') {
      return { ok: false, erro: SETOR_EM_USO_MENSAGEM }
    }
  }

  return resultadoDeErroApi(erro)
}

function errosDeValidacao(erro: z.ZodError): ResultadoAcao {
  return { ok: false, errors: z.flattenError(erro).fieldErrors } // [FORM-18]
}

function revalidarCaminhosSetores(): void {
  revalidatePath('/painel/setores')
  revalidatePath('/lanternas')
  revalidatePath('/cadastro')
}

/** Cria um novo setor (restrito ao Guardião). */
export async function criarSetorAcao(dados: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  const parsed = setorFormularioSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return errosDeValidacao(parsed.error)

  try {
    await criarSetor(parsed.data)
  } catch (erro) {
    return tratarErroApi(erro)
  }

  revalidarCaminhosSetores()
  redirect('/painel/setores') // [ROTA-20]
}

/** Edita nome e/ou descrição de um setor existente (restrito ao Guardião). */
export async function editarSetorAcao(id: unknown, dados: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  const idParsed = idSetorSchema.safeParse(id)
  if (!idParsed.success) return SETOR_INEXISTENTE

  const parsed = edicaoSetorSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return errosDeValidacao(parsed.error)

  let atual
  try {
    atual = await buscarSetor(idParsed.data)
  } catch (erro) {
    return tratarErroApi(erro)
  }
  if (!atual) return SETOR_INEXISTENTE

  const campos: EdicaoSetor = {}
  if (parsed.data.nome !== undefined && parsed.data.nome !== atual.nome) {
    campos.nome = parsed.data.nome
  }
  if (parsed.data.descricao !== undefined && parsed.data.descricao !== atual.descricao) {
    campos.descricao = parsed.data.descricao
  }

  if (Object.keys(campos).length === 0) {
    return { ok: false, erro: 'Nada foi alterado.' }
  }

  try {
    await editarSetor(idParsed.data, campos)
  } catch (erro) {
    return tratarErroApi(erro)
  }

  revalidarCaminhosSetores()
  redirect('/painel/setores') // [ROTA-20]
}

/** Remove um setor que não possui vínculos ativos (restrito ao Guardião). */
export async function excluirSetorAcao(id: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  const idParsed = idSetorSchema.safeParse(id)
  if (!idParsed.success) return SETOR_INEXISTENTE

  try {
    await excluirSetor(idParsed.data)
  } catch (erro) {
    return tratarErroApi(erro)
  }

  revalidarCaminhosSetores()
  redirect('/painel/setores') // [ROTA-20]
}
