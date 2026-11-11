import { SeloOa } from '@/components/oanet/PainelOa'
import { rotuloGravidade, type Gravidade } from '@/lib/schemas/ocorrencia'

// [CSS-12] mapa explícito por valor: sempre acompanhado de texto
const tomPorGravidade = {
  baixa: 'azul',
  media: 'ambar',
  alta: 'ambar',
  critica: 'vermelho',
} as const

/** Gravidade da ocorrência em selo OANET: símbolo + texto (nunca só a cor). */
export function BadgeGravidade({ gravidade }: { gravidade: Gravidade }) {
  return <SeloOa tom={tomPorGravidade[gravidade]}>{rotuloGravidade[gravidade]}</SeloOa>
}
