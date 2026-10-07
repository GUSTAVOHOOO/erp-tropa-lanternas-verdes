import { Badge } from '@/components/ui/badge'
import { rotuloStatus, type StatusOcorrencia } from '@/lib/schemas/ocorrencia'

const variantePorStatus = {
  aberta: 'destructive',
  em_andamento: 'secondary',
  resolvida: 'outline',
} as const

/** Selo do status da ocorrência. */
export function BadgeStatus({ status }: { status: StatusOcorrencia }) {
  return <Badge variant={variantePorStatus[status]}>{rotuloStatus[status]}</Badge>
}
