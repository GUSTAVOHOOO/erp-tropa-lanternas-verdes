'use server'

import * as z from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, destinoDoErro, resultadoDeErroApi } from '@/lib/api-error'
import { exigirPapel } from '@/lib/dal'
import { alterarPapel, vincularLanterna } from '@/lib/gestao-usuarios'
import type { ResultadoAcao } from '@/lib/resultado-acao'
import { papelFormularioSchema, vinculoFormularioSchema } from '@/lib/schemas/gestao-usuario'

const CONTA_OU_FICHA_INEXISTENTE: ResultadoAcao = {
  ok: false,
  erro: 'Esta conta ou Ficha não existe mais.',
}

const CAMPO_DO_CODIGO_PAPEL: Record<string, string> = {
  SETOR_OBRIGATORIO: 'setorId',
  SETOR_DIFERENTE: 'setorId',
}

const CAMPO_DO_CODIGO_VINCULO: Record<string, string> = {
  VINCULO_NAO_PERMITIDO: 'lanternaId',
  SETOR_DIFERENTE: 'lanternaId',
  LANTERNA_JA_VINCULADA: 'lanternaId',
}

/** Trata erro da API para contexto de papel ou de vínculo. [API-12][API-18] */
function tratarErroApi(erro: unknown, contexto: 'papel' | 'vinculo'): ResultadoAcao {
  const destino = destinoDoErro(erro)
  if (destino === 'sessao-expirada') redirect('/sessao-expirada') // [AUTH-13]
  if (destino === 'acesso-negado') redirect('/acesso-negado') // [AUTH-06]
  if (destino === 'nao-encontrado') return CONTA_OU_FICHA_INEXISTENTE

  const mapaCampos = contexto === 'papel' ? CAMPO_DO_CODIGO_PAPEL : CAMPO_DO_CODIGO_VINCULO
  const campo = erro instanceof ApiError && erro.codigo ? mapaCampos[erro.codigo] : undefined
  const resultado = resultadoDeErroApi(erro)

  if (campo && resultado.erro) {
    return { ok: false, errors: { [campo]: [resultado.erro] } }
  }
  return resultado
}

/** Altera papel de um usuário. Destino guardiao nunca envia setorId. [AUTH-05][ROTA-20] */
export async function alterarPapelAcao(id: unknown, dados: unknown): Promise<ResultadoAcao> {
  const sessao = await exigirPapel('guardiao') // [AUTH-05]
  if (typeof id !== 'string' || !id.trim()) return CONTA_OU_FICHA_INEXISTENTE

  const parsed = papelFormularioSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]
  }

  const { papel, setorId } = parsed.data
  const corpo = papel === 'lanterna' && setorId !== undefined ? { papel, setorId } : { papel }

  try {
    await alterarPapel(id, corpo)
  } catch (erro) {
    return tratarErroApi(erro, 'papel')
  }

  if (sessao.id === id) {
    revalidatePath('/', 'layout')
  }
  revalidatePath('/painel/usuarios')
  redirect(`/painel/usuarios?conta=${id}`) // [ROTA-20]
}

/** Vincula ou desvincula (string vazia -> null) conta a uma Ficha de Lanterna. [AUTH-05][ROTA-20] */
export async function vincularLanternaAcao(id: unknown, dados: unknown): Promise<ResultadoAcao> {
  const sessao = await exigirPapel('guardiao') // [AUTH-05]
  if (typeof id !== 'string' || !id.trim()) return CONTA_OU_FICHA_INEXISTENTE

  const parsed = vinculoFormularioSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]
  }

  const lanternaId = parsed.data.lanternaId === '' ? null : parsed.data.lanternaId

  try {
    await vincularLanterna(id, lanternaId)
  } catch (erro) {
    return tratarErroApi(erro, 'vinculo')
  }

  if (sessao.id === id) {
    revalidatePath('/', 'layout')
  }
  revalidatePath('/painel/usuarios')
  redirect(`/painel/usuarios?conta=${id}`) // [ROTA-20]
}
