import { IconeStatus } from '@/components/IconeStatus'
import { rotuloStatus, type StatusOcorrencia } from '@/lib/schemas/ocorrencia'
import { cn } from '@/lib/utils'

/** Status da ocorrência: ícone de carga + texto. Resolvida ganha o verde da Tropa. */
export function BadgeStatus({ status }: { status: StatusOcorrencia }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm whitespace-nowrap', status === 'resolvida' ? 'text-primary-texto' : 'text-muted-foreground')}> {/* [CSS-02] */}
      <IconeStatus status={status} />
      {rotuloStatus[status]}
    </span>
  )
}
