'use server'

import * as z from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verificarSessao } from '@/lib/dal'
import { criarOcorrencia } from '@/lib/ocorrencias'
import { MENSAGEM_ERRO_API, type ResultadoAcao } from '@/lib/resultado-acao'
import { novaOcorrenciaSchema, type Ocorrencia } from '@/lib/schemas/ocorrencia'
import { listarSetores } from '@/lib/setores'

/** Registra uma ocorrência. O Lanterna sempre registra no próprio setor. */
export async function registrarOcorrencia(dados: unknown): Promise<ResultadoAcao> {
  const sessao = await verificarSessao() // [AUTH-05]
  const parsed = novaOcorrenciaSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]

  const setorId = sessao.papel === 'lanterna' ? sessao.setorId : parsed.data.setorId // [AUTH-07]
  let criada: Ocorrencia
  try {
    const setores = await listarSetores()
    if (!setorId || !setores.some((s) => s.id === setorId)) {
      return { ok: false, errors: { setorId: ['Escolha um setor válido.'] } }
    }
    criada = await criarOcorrencia({
      ...parsed.data,
      setorId,
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
