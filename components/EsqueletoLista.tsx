import { Skeleton } from '@/components/ui/skeleton'

/** Formato da página enquanto os dados chegam: título e linhas de tabela, nunca a tela em branco. */
export function EsqueletoLista({ linhas = 6 }: { linhas?: number }) { // [API-10]
  const ids = Array.from({ length: linhas }, (_, i) => `linha-${i + 1}`) // lista fixa: o id nunca muda de posição
  return (
    <div aria-busy="true" aria-label="Carregando" className="grid gap-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-2">
        <Skeleton className="h-5 w-full" />
        {ids.map((id) => (
          <Skeleton key={id} className="h-12 w-full" /> // [COMP-13]
        ))}
      </div>
    </div>
  )
}
