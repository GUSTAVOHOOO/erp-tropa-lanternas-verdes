import { notFound, redirect } from 'next/navigation'
import { ApiError } from '@/lib/api-error'

/** Classifica falhas HTTP das leituras de detalhe. */
export function tratarErroDetalhe(erro: unknown): never {
  if (erro instanceof ApiError) {
    if (erro.status === 404) notFound() // [API-12]
    if (erro.status === 401) redirect('/login') // [API-12]
    if (erro.status === 403) redirect('/acesso-negado') // [API-12]
  }
  throw erro
}
