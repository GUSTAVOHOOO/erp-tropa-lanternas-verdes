import Link from 'next/link'
import { STATUS_OCORRENCIA, type Ocorrencia } from '@/lib/schemas/ocorrencia'
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

type BarraStatusProps = { ocorrencias: Pick<Ocorrencia, 'id' | 'status'>[] }

/** Resumo do painel: cada ocorrência acende um segmento da barra; a legenda leva à lista filtrada. */
export function BarraStatus({ ocorrencias }: BarraStatusProps) {
  const porStatus = STATUS_OCORRENCIA.map((status) => ({
    status,
    itens: ocorrencias.filter((o) => o.status === status), // [JS-09]
  }))

  return (
    <div className="grid gap-3">
      {ocorrencias.length > 0 && ( // [COMP-14]
        // [CSS-02] um segmento flex-1 por ocorrência: a proporção sai sem style inline
        <div aria-hidden="true" className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-border">
          {porStatus.flatMap(({ itens }) => itens).map((o) => (
            <span key={o.id} data-status={o.status} className={cn('flex-1', corPorStatus[o.status])} /> // [COMP-13]
          ))}
        </div>
      )}
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {porStatus.map(({ status, itens }) => (
          <li key={status}>
            <Link href={`/painel/ocorrencias?status=${status}`} className="group flex items-baseline gap-2 text-muted-foreground"> {/* [ROTA-14] */}
              <strong className="text-xl font-semibold text-foreground">{itens.length}</strong>
              <span className="underline-offset-4 group-hover:text-foreground group-hover:underline">{rotuloPlural[status]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
