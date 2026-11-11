import { SeloOa } from '@/components/oanet/PainelOa'
import { rotuloStatus, type StatusOcorrencia } from '@/lib/schemas/ocorrencia'

// [CSS-12] mapa explícito por valor de status
const tomPorStatus = {
  aberta: 'ambar',
  em_andamento: 'neutro',
  resolvida: 'verde',
} as const

/** Status da ocorrência: selo OANET com símbolo + texto. Resolvida ganha o verde da Tropa. */
export function BadgeStatus({ status }: { status: StatusOcorrencia }) {
  return <SeloOa tom={tomPorStatus[status]}>{rotuloStatus[status]}</SeloOa> // [CSS-02]
}
