import type { Sessao } from '@/lib/schemas/usuario'

export function podeAcessarSetor(sessao: Sessao, setorId: number): boolean {
  return sessao.papel === 'guardiao' || sessao.setorId === setorId
}

export function setorParaFiltro(sessao: Sessao, setorDaUrl?: number): number | undefined {
  if (sessao.papel === 'lanterna') return sessao.setorId ?? -1
  return setorDaUrl
}
