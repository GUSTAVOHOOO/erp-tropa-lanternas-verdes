import { rotuloGravidade, type Gravidade } from '@/lib/schemas/ocorrencia'
import { cn } from '@/lib/utils'

// [CSS-12] classe inteira por valor: o Tailwind só gera a classe que encontra escrita por completo
const corPorGravidade = {
  baixa: 'bg-gravidade-baixa',
  media: 'bg-gravidade-media',
  alta: 'bg-gravidade-alta',
  critica: 'bg-gravidade-critica',
} as const

/** Gravidade no espectro emocional da Tropa: losango colorido + texto (nunca só a cor). */
export function BadgeGravidade({ gravidade }: { gravidade: Gravidade }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap">
      <span aria-hidden="true" className={cn('size-2.5 shrink-0 rotate-45 rounded-xs', corPorGravidade[gravidade])} />
      {rotuloGravidade[gravidade]}
    </span>
  )
}
