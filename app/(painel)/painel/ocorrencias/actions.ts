'use server'

import * as z from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exigirPapel, verificarSessao } from '@/lib/dal'
import { buscarLanterna } from '@/lib/lanternas'
import { atualizarOcorrencia, buscarOcorrencia, criarOcorrencia } from '@/lib/ocorrencias'
import { MENSAGEM_ERRO_API, type ResultadoAcao } from '@/lib/resultado-acao'
import { atribuicaoSchema, atualizarStatusSchema, novaOcorrenciaSchema, type Ocorrencia } from '@/lib/schemas/ocorrencia'
import { podeAcessarSetor } from '@/lib/escopo'
import { listarSetores } from '@/lib/setores'

/** Registra uma ocorrência. O Lanterna sempre registra no próprio setor. */
export async function registrarOcorrencia(dados: unknown): Promise<ResultadoAcao> {
  const sessao = await verificarSessao() // [AUTH-05]
  const parsed = novaOcorrenciaSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]

  const setorId = sessao.papel === 'lanterna' ? sessao.setorId : Number(parsed.data.setorId) // [AUTH-07]
  let criada: Ocorrencia
  try {
    const setores = await listarSetores()
    if (setorId === null || !Number.isInteger(setorId) || !setores.some((s) => s.id === String(setorId))) {
      return { ok: false, errors: { setorId: ['Escolha um setor válido.'] } }
    }
    criada = await criarOcorrencia({
      ...parsed.data,
      setorId: String(setorId), // FE-04: setor inteiro do contrato
      status: 'aberta',
      responsavelId: null,
      resolucao: null,
      criadaPor: sessao.id,
      criadaEm: new Date().toISOString(),
    })
  } catch (erro) {
    console.error(erro)
    return { ok: false, erro: MENSAGEM_ERRO_API } // [API-13]
  }

  revalidatePath('/painel', 'layout') // [API-14]
  redirect(`/painel/ocorrencias/${criada.id}`) // [ROTA-20]
}

/** Muda o status. "Resolvida" guarda a explicação; os outros status limpam a resolução. */
export async function atualizarStatus(id: unknown, dados: unknown): Promise<ResultadoAcao> {
  const sessao = await verificarSessao() // [AUTH-05]
  if (typeof id !== 'string' || !id) return { ok: false, erro: 'Ocorrência inválida.' }
  const parsed = atualizarStatusSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]

  try {
    const ocorrencia = await buscarOcorrencia(id)
    if (!ocorrencia) return { ok: false, erro: 'Ocorrência não encontrada.' }
    if (!podeAcessarSetor(sessao, Number(ocorrencia.setorId))) { // [AUTH-07] // FE-04: setor inteiro do contrato
      return { ok: false, erro: 'Você não pode alterar ocorrências de outro setor.' }
    }
    const { status, resolucao } = parsed.data
    await atualizarOcorrencia(id, { status, resolucao: status === 'resolvida' ? resolucao : null })
  } catch (erro) {
    console.error(erro)
    return { ok: false, erro: MENSAGEM_ERRO_API } // [API-13]
  }

  revalidatePath('/painel', 'layout') // [API-14]
  return { ok: true }
}

/** Só Guardião: escolhe o lanterna responsável, que precisa ser do setor da ocorrência. */
export async function atribuirResponsavel(id: unknown, dados: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  if (typeof id !== 'string' || !id) return { ok: false, erro: 'Ocorrência inválida.' }
  const parsed = atribuicaoSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]

  try {
    const ocorrencia = await buscarOcorrencia(id)
    if (!ocorrencia) return { ok: false, erro: 'Ocorrência não encontrada.' }
    const lanterna = await buscarLanterna(parsed.data.responsavelId)
    if (!lanterna || lanterna.setorId !== ocorrencia.setorId) {
      return { ok: false, errors: { responsavelId: ['Escolha um lanterna do setor desta ocorrência.'] } }
    }
    await atualizarOcorrencia(id, { responsavelId: lanterna.id })
  } catch (erro) {
    console.error(erro)
    return { ok: false, erro: MENSAGEM_ERRO_API } // [API-13]
  }

  revalidatePath('/painel', 'layout') // [API-14]
  redirect(`/painel/ocorrencias/${id}`) // [ROTA-20]
}
