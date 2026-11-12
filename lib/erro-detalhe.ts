import { notFound, redirect } from 'next/navigation'
import { ApiError } from '@/lib/api-error'

/** Classifica falhas HTTP das leituras de detalhe. */
export function tratarErroDetalhe(erro: unknown): never {
  if (erro instanceof ApiError) {
    // 400 DADOS_INVALIDOS (UUID/slug malformado) vira 404 sem revelar o recurso [ROTA-11]
    if (erro.status === 400) notFound()
    if (erro.status === 404) notFound() // [API-12]
    // A troca para /sessao-expirada é do FE-02, que cria a rota [AUTH-13]
    if (erro.status === 401) redirect('/login') // [API-12]
    if (erro.status === 403) redirect('/acesso-negado') // [API-12]
  }
  throw erro
}
