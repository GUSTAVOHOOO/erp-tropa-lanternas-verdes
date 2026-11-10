import type { Sessao } from '@/lib/sessao'
import type { IdentidadeOa } from './CascaOa'

/**
 * Texto de identidade da casca, derivado só da sessão atual (D28: nunca de `dados-demo.ts`).
 * Serve para exibir; a proteção continua em cada página e action. [AUTH-10]
 */
export function identidadeDaSessao(sessao: Sessao | null): IdentidadeOa {
  if (!sessao) return { titulo: 'Visitante', detalhe: 'Portal público' }
  return {
    titulo: sessao.nome,
    detalhe: sessao.papel === 'guardiao' ? 'Guardião · todos os setores' : `Lanterna · Setor ${sessao.setorId}`,
  }
}
