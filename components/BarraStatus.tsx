import Link from 'next/link'
import { IconeStatus } from '@/components/IconeStatus'
import { STATUS_OCORRENCIA, type StatusOcorrencia } from '@/lib/schemas/ocorrencia'
import { cn } from '@/lib/utils'

// Mesma metáfora do IconeStatus: vazio, meio carregado, cheio. [CSS-12]
const corPorStatus = {
  aberta: 'bg-texto-terciario',
  em_andamento: 'bg-primary/50',
  resolvida: 'bg-primary',
} as const

const rotuloPlural = {
  aberta: 'abertas',
  em_andamento: 'em andamento',
  resolvida: 'resolvidas',
} as const

type BarraStatusProps = { contagens: Record<StatusOcorrencia, number> }

/** Resumo do painel: contagens de status recebidas do servidor. [COMP-14] */
export function BarraStatus({ contagens }: BarraStatusProps) {
  const total = STATUS_OCORRENCIA.reduce((acc, status) => acc + (contagens[status] ?? 0), 0)

  return (
    <div className="grid gap-3">
      {total > 0 && ( // [COMP-14]
        // [CSS-02] um segmento flex-1 por ocorrência: a proporção sai sem style inline
        <div aria-hidden="true" className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-border">
          {STATUS_OCORRENCIA.flatMap((status) =>
            Array.from({ length: contagens[status] ?? 0 }, (_, i) => (
              <span key={`${status}-${i}`} data-status={status} className={cn('flex-1', corPorStatus[status])} /> // [COMP-13]
            )),
          )}
        </div>
      )}
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {STATUS_OCORRENCIA.map((status) => {
          const quantidade = contagens[status] ?? 0
          return (
            <li key={status}>
              <Link href={`/painel/ocorrencias?status=${status}`} className="group flex items-baseline gap-2 text-muted-foreground"> {/* [ROTA-14] */}
                <IconeStatus status={status} className="size-4 self-center" />
                <strong className="text-xl font-semibold text-foreground">{quantidade}</strong>
                <span className="underline-offset-4 group-hover:text-foreground group-hover:underline">{rotuloPlural[status]}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
