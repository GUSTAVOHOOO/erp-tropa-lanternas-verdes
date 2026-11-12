'use server'

import * as z from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, destinoDoErro, resultadoDeErroApi } from '@/lib/api-error'
import { exigirPapel, verificarSessao } from '@/lib/dal'
import {
  alterarStatusOcorrencia,
  buscarOcorrencia,
  criarOcorrencia,
  definirResponsavel,
  editarOcorrencia as persistirEdicao,
  excluirOcorrencia as persistirExclusao,
  type CamposEdicaoOcorrencia,
} from '@/lib/ocorrencias'
import { acoesPermitidas, transicoesPermitidas } from '@/lib/permissoes-ocorrencia'
import type { ResultadoAcao } from '@/lib/resultado-acao'
import {
  atribuicaoSchema,
  atualizarStatusSchema,
  edicaoOcorrenciaSchema,
  novaOcorrenciaSchema,
  type Ocorrencia,
} from '@/lib/schemas/ocorrencia'

const OCORRENCIA_INEXISTENTE: ResultadoAcao = { ok: false, erro: 'Esta ocorrência não existe mais.' }
const SEM_PERMISSAO: ResultadoAcao = { ok: false, erro: 'Você não tem permissão para esta alteração.' }

/** Código de domínio que pertence a um campo do formulário. [API-18][FORM-19] */
const CAMPO_DO_CODIGO: Record<string, string> = {
  RESOLUCAO_OBRIGATORIA: 'resolucao',
  MOTIVO_OBRIGATORIO: 'motivo',
  RESPONSAVEL_DE_OUTRO_SETOR: 'responsavelId',
  LANTERNA_AFASTADO: 'responsavelId',
  SEM_RESPONSAVEL: 'responsavelId',
}

/**
 * Leva o erro da API ao destino certo: 401/403 navegam, 404 vira mensagem, códigos de campo vão
 * ao campo e o resto é erro geral. Nunca anuncia sucesso em conflito.
 */
function tratarErroApi(erro: unknown): ResultadoAcao {
  const destino = destinoDoErro(erro)
  if (destino === 'sessao-expirada') redirect('/sessao-expirada') // [AUTH-13]
  if (destino === 'acesso-negado') redirect('/acesso-negado') // [AUTH-06]
  if (destino === 'nao-encontrado') return OCORRENCIA_INEXISTENTE
  const resultado = resultadoDeErroApi(erro)
  const campo = erro instanceof ApiError && erro.codigo ? CAMPO_DO_CODIGO[erro.codigo] : undefined
  if (campo && resultado.erro) return { ok: false, errors: { [campo]: [resultado.erro] } }
  return resultado
}

function errosDeValidacao(erro: z.ZodError): ResultadoAcao {
  return { ok: false, errors: z.flattenError(erro).fieldErrors } // [FORM-18]
}

/** Busca a ocorrência para conferir permissão antes de escrever; a API confere de novo. */
async function carregar(id: unknown): Promise<Ocorrencia | ResultadoAcao> {
  if (typeof id !== 'string') return OCORRENCIA_INEXISTENTE
  try {
    return (await buscarOcorrencia(id)) ?? OCORRENCIA_INEXISTENTE
  } catch (erro) {
    return tratarErroApi(erro)
  }
}

function ehResultado(valor: Ocorrencia | ResultadoAcao): valor is ResultadoAcao {
  return 'ok' in valor
}

/** Registrar: o Lanterna nunca envia setorId (a API usa o setor da conta); o Guardião sempre escolhe. */
export async function registrarOcorrencia(dados: unknown): Promise<ResultadoAcao> {
  const sessao = await verificarSessao() // [AUTH-05]
  const parsed = novaOcorrenciaSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return errosDeValidacao(parsed.error)

  const { setorId, ...campos } = parsed.data
  if (sessao.papel === 'guardiao' && setorId === undefined) {
    return { ok: false, errors: { setorId: ['Escolha o setor da ocorrência.'] } }
  }
  const corpo = sessao.papel === 'guardiao' && setorId !== undefined ? { ...campos, setorId } : campos // [AUTH-07]

  let criada: Ocorrencia
  try {
    criada = await criarOcorrencia(corpo)
  } catch (erro) {
    return tratarErroApi(erro)
  }
  revalidatePath('/painel', 'layout') // [API-14]
  redirect(`/painel/ocorrencias/${criada.id}`) // [ROTA-20]
}

/** Mudar status pelo sub-recurso /status; reabrir exige Guardião e motivo. */
export async function atualizarStatus(id: unknown, dados: unknown): Promise<ResultadoAcao> {
  const sessao = await verificarSessao() // [AUTH-05]
  const parsed = atualizarStatusSchema.safeParse(dados)
  if (!parsed.success) return errosDeValidacao(parsed.error)

  const atual = await carregar(id)
  if (ehResultado(atual)) return atual
  if (!transicoesPermitidas(acoesPermitidas(sessao, atual)).includes(parsed.data.status)) return SEM_PERMISSAO

  const { status, resolucao, motivo } = parsed.data
  try {
    await alterarStatusOcorrencia(atual.id, {
      status,
      ...(status === 'resolvida' ? { resolucao } : {}),
      ...(status === 'aberta' ? { motivo } : {}),
    })
  } catch (erro) {
    return tratarErroApi(erro)
  }
  revalidatePath('/painel', 'layout') // [API-14]
  return { ok: true }
}

/** Atribuir, reatribuir ou liberar ('' → null). Só o Guardião. */
export async function atribuirResponsavel(id: unknown, dados: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  const parsed = atribuicaoSchema.safeParse(dados)
  if (!parsed.success) return errosDeValidacao(parsed.error)
  if (typeof id !== 'string') return OCORRENCIA_INEXISTENTE

  try {
    await definirResponsavel(id, parsed.data.responsavelId || null)
  } catch (erro) {
    return tratarErroApi(erro)
  }
  revalidatePath('/painel', 'layout') // [API-14]
  redirect(`/painel/ocorrencias/${id}`) // [ROTA-20]
}

/** Editar dados (Guardião ou Lanterna criador, não resolvida): envia só o que mudou. */
export async function editarOcorrencia(id: unknown, dados: unknown): Promise<ResultadoAcao> {
  const sessao = await verificarSessao() // [AUTH-05]
  const atual = await carregar(id)
  if (ehResultado(atual)) return atual
  if (!acoesPermitidas(sessao, atual).editar) return SEM_PERMISSAO

  const parsed = edicaoOcorrenciaSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return errosDeValidacao(parsed.error)

  const campos: CamposEdicaoOcorrencia = {}
  for (const chave of ['titulo', 'descricao', 'planeta', 'gravidade', 'envolvidos'] as const) {
    if (parsed.data[chave] !== atual[chave]) Object.assign(campos, { [chave]: parsed.data[chave] })
  }
  if (Object.keys(campos).length === 0) return { ok: false, erro: 'Nada foi alterado.' }

  try {
    await persistirEdicao(atual.id, campos)
  } catch (erro) {
    return tratarErroApi(erro)
  }
  revalidatePath('/painel', 'layout') // [API-14]
  redirect(`/painel/ocorrencias/${atual.id}`) // [ROTA-20]
}

/** Exclusão lógica pelo Guardião; o detalhe passa a ser 404. */
export async function excluirOcorrencia(id: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  if (typeof id !== 'string') return OCORRENCIA_INEXISTENTE

  try {
    await persistirExclusao(id)
  } catch (erro) {
    return tratarErroApi(erro)
  }
  revalidatePath('/painel', 'layout') // [API-14]
  redirect('/painel/ocorrencias') // [ROTA-20]
}
