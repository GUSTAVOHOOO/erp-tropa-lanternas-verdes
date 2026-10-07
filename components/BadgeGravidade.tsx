import { Badge } from '@/components/ui/badge'
import { rotuloGravidade, type Gravidade } from '@/lib/schemas/ocorrencia'

const variantePorGravidade = {
  baixa: 'outline',
  media: 'secondary',
  alta: 'default',
  critica: 'destructive',
} as const

/** Selo de gravidade: cor e texto (nunca só a cor). */
export function BadgeGravidade({ gravidade }: { gravidade: Gravidade }) {
  return <Badge variant={variantePorGravidade[gravidade]}>{rotuloGravidade[gravidade]}</Badge>
}
