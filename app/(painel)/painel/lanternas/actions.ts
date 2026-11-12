'use server'

import * as z from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, destinoDoErro, resultadoDeErroApi } from '@/lib/api-error'
import { exigirPapel } from '@/lib/dal'
import {
  alterarStatusLanterna,
  buscarLanterna,
  criarLanterna,
  editarLanterna,
} from '@/lib/lanternas'
import type { ResultadoAcao } from '@/lib/resultado-acao'
import { slugLanternaSchema } from '@/lib/schemas/lanterna'
import {
  camposAlterados,
  lanternaFormularioSchema,
  type LanternaCriacaoEntrada,
  type LanternaEdicaoEntrada,
} from '@/lib/schemas/gestao-lanterna'

const FICHA_INEXISTENTE: ResultadoAcao = { ok: false, erro: 'Esta ficha de Lanterna não existe mais.' }

/** Código de domínio que pertence a um campo do formulário. [API-18][FORM-19] */
const CAMPO_DO_CODIGO: Record<string, string> = {
  LANTERNA_JA_CADASTRADA: 'id',
  MENTOR_INVALIDO: 'mentorId',
  LANTERNA_EM_USO: 'setorId',
}

/**
 * Trata o erro retornado pela API e o encaminha para o destino apropriado. [API-12][API-18]
 */
function tratarErroApi(erro: unknown, dadosEnviados?: { setorId?: number | null }): ResultadoAcao {
  const destino = destinoDoErro(erro)
  if (destino === 'sessao-expirada') redirect('/sessao-expirada') // [AUTH-13]
  if (destino === 'acesso-negado') redirect('/acesso-negado') // [AUTH-06]
  if (destino === 'nao-encontrado') {
    if (dadosEnviados?.setorId !== undefined && dadosEnviados.setorId !== null) {
      return { ok: false, errors: { setorId: ['Setor informado não existe.'] } }
    }
    return FICHA_INEXISTENTE
  }
  const resultado = resultadoDeErroApi(erro)
  const campo = erro instanceof ApiError && erro.codigo ? CAMPO_DO_CODIGO[erro.codigo] : undefined
  if (campo && resultado.erro) {
    return { ok: false, errors: { [campo]: [resultado.erro] } }
  }
  return resultado
}

function errosDeValidacao(erro: z.ZodError): ResultadoAcao {
  return { ok: false, errors: z.flattenError(erro).fieldErrors } // [FORM-18]
}

/** Server Action para criar uma nova Ficha de Lanterna (Guardião). [AUTH-05][FORM-01] */
export async function criarLanternaAcao(dados: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  const parsed = lanternaFormularioSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return errosDeValidacao(parsed.error)

  if (!parsed.data.id) {
    return { ok: false, errors: { id: ['Informe o identificador da ficha (slug).'] } }
  }

  const corpo: LanternaCriacaoEntrada = {
    id: parsed.data.id,
    codinome: parsed.data.codinome,
    identidadeCivil: parsed.data.identidadeCivil,
    especie: parsed.data.especie,
    planetaNatal: parsed.data.planetaNatal,
    setorId: parsed.data.setorId,
    anoIngresso: parsed.data.anoIngresso,
    primeiraAparicao: parsed.data.primeiraAparicao,
    habilidades: parsed.data.habilidades,
    mentorId: parsed.data.mentorId,
    citacao: parsed.data.citacao,
    biografia: parsed.data.biografia,
    fontes: parsed.data.fontes ?? {},
  }

  try {
    await criarLanterna(corpo)
  } catch (erro) {
    return tratarErroApi(erro, corpo)
  }

  revalidatePath('/painel/lanternas') // [API-14]
  revalidatePath('/lanternas')
  redirect('/painel/lanternas') // [ROTA-20]
}

/** Server Action para editar uma Ficha de Lanterna existente (Guardião). [AUTH-05][FORM-01] */
export async function editarLanternaAcao(slug: unknown, dados: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  const slugValido = slugLanternaSchema.safeParse(slug)
  if (!slugValido.success) return FICHA_INEXISTENTE

  const atual = await buscarLanterna(slugValido.data)
  if (!atual) return FICHA_INEXISTENTE

  const parsed = lanternaFormularioSchema.safeParse(dados)
  let campos: Partial<LanternaEdicaoEntrada>
  if (parsed.success) {
    campos = camposAlterados(atual, parsed.data)
  } else {
    const parcialSchema = lanternaFormularioSchema.partial()
    const parsedParcial = parcialSchema.safeParse(dados)
    if (!parsedParcial.success) return errosDeValidacao(parsedParcial.error)
    campos = camposAlterados(atual, parsedParcial.data)
  }

  if (Object.keys(campos).length === 0) {
    return { ok: false, erro: 'Nada foi alterado.' }
  }

  try {
    await editarLanterna(slugValido.data, campos as LanternaEdicaoEntrada)
  } catch (erro) {
    return tratarErroApi(erro, campos)
  }

  revalidatePath('/painel/lanternas') // [API-14]
  revalidatePath('/lanternas')
  redirect('/painel/lanternas') // [ROTA-20]
}

/** Server Action para afastar ou reativar uma Ficha de Lanterna (Guardião). [AUTH-05] */
export async function alterarStatusLanternaAcao(slug: unknown, status: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  const slugValido = slugLanternaSchema.safeParse(slug)
  if (!slugValido.success) return FICHA_INEXISTENTE

  if (status !== 'ativo' && status !== 'afastado') {
    return { ok: false, erro: 'Status inválido. Apenas ativo ou afastado são permitidos.' }
  }

  try {
    await alterarStatusLanterna(slugValido.data, status)
  } catch (erro) {
    return tratarErroApi(erro)
  }

  revalidatePath('/painel/lanternas') // [API-14]
  revalidatePath('/lanternas')
  return { ok: true }
}
