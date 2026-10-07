import type { StatusOcorrencia } from '@/lib/schemas/ocorrencia'
import { cn } from '@/lib/utils'

/** Ícone de "carga" do status: vazio (aberta), meio (em andamento), cheio com check (resolvida). */
export function IconeStatus({ status, className }: { status: StatusOcorrencia; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn('size-3.5 shrink-0', className)}>
      {status === 'resolvida' ? ( // [COMP-14]
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M5 8.2l2 2 4-4.2" fill="none" className="stroke-background" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {status === 'em_andamento' && <path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />}
        </>
      )}
    </svg>
  )
}
