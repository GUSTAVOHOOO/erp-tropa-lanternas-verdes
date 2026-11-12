import type { Ocorrencia } from '@/lib/schemas/ocorrencia'
import type { Sessao } from '@/lib/schemas/usuario'

export type AcoesOcorrencia = {
  iniciar: boolean
  resolver: boolean
  reabrir: boolean
  atribuir: boolean
  liberar: boolean
  editar: boolean
  excluir: boolean
}

/**
 * O que a tela de detalhe oferece, pela matriz de TELAS.md e do plano FE-05. Só decide visibilidade:
 * a API confere tudo de novo e é a autoridade. [AUTH-07]
 */
export function acoesPermitidas(sessao: Sessao, ocorrencia: Ocorrencia): AcoesOcorrencia {
  const guardiao = sessao.papel === 'guardiao'
  const doSetor = guardiao || sessao.setorId === ocorrencia.setorId
  const criador = sessao.id === ocorrencia.criadaPorId
  const aberta = ocorrencia.status === 'aberta'
  const emAndamento = ocorrencia.status === 'em_andamento'
  const resolvida = ocorrencia.status === 'resolvida'

  return {
    iniciar: doSetor && aberta && ocorrencia.responsavelId !== null, // sem responsável a API recusa
    resolver: doSetor && emAndamento,
    reabrir: guardiao && resolvida,
    atribuir: guardiao && !resolvida,
    liberar: guardiao && aberta && ocorrencia.responsavelId !== null, // em andamento a API recusa (422)
    editar: !resolvida && (guardiao || (doSetor && criador)),
    excluir: guardiao,
  }
}

/** Transições de status que o formulário oferece, derivadas das ações permitidas. */
export function transicoesPermitidas(acoes: AcoesOcorrencia): Ocorrencia['status'][] {
  const transicoes: Ocorrencia['status'][] = []
  if (acoes.iniciar) transicoes.push('em_andamento')
  if (acoes.resolver) transicoes.push('resolvida')
  if (acoes.reabrir) transicoes.push('aberta')
  return transicoes
}
