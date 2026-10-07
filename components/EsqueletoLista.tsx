import { Skeleton } from '@/components/ui/skeleton'

/** Formato da lista enquanto os dados chegam: nunca a tela em branco. [API-10] */
export function EsqueletoLista({ linhas = 6 }: { linhas?: number }) {
  const ids = Array.from({ length: linhas }, (_, i) => `linha-${i + 1}`) // lista fixa: o id nunca muda de posição
  return (
    <div aria-busy="true" aria-label="Carregando" className="mt-6 grid gap-3">
      <Skeleton className="h-8 w-48" />
      {ids.map((id) => (
        <Skeleton key={id} className="h-12 w-full" /> // [COMP-13]
      ))}
    </div>
  )
}
