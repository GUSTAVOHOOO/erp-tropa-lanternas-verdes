import type { Metadata } from 'next'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { Juramento } from '@/components/Juramento'

export const metadata: Metadata = { // [ROTA-07]
  title: 'Sobre a Tropa | Central de Oa',
  description: 'O juramento, Oa e a organização da Tropa dos Lanternas Verdes.',
}

/** Página institucional estática: Server Component sem busca de dados. */
export default function SobrePage() {
  return (
    <article className="grid max-w-3xl gap-12">
      <CabecalhoPagina titulo="Sobre a Tropa" descricao="O juramento, Oa e a organização da Tropa dos Lanternas Verdes." />
      <section aria-labelledby="juramento" className="grid gap-4">
        <h2 id="juramento" className="font-heading text-2xl font-semibold">O juramento</h2>
        <Juramento />
      </section>
      <section aria-labelledby="oa" className="grid gap-3">
        <h2 id="oa" className="font-heading text-2xl font-semibold">Oa e os Guardiões</h2>
        <p className="max-w-prose text-muted-foreground">
          Oa fica no centro do universo, no Setor 0. Dali os Guardiões coordenam a Tropa, distribuem os anéis
          de poder e acompanham as ocorrências registradas em cada setor.
        </p>
      </section>
      <section aria-labelledby="setores" className="grid gap-3">
        <h2 id="setores" className="font-heading text-2xl font-semibold">Os setores</h2>
        <p className="max-w-prose text-muted-foreground">
          O universo é dividido em 3600 setores. Cada lanterna protege o seu setor e responde pelas ocorrências
          que acontecem nele.
        </p>
      </section>
    </article>
  )
}
