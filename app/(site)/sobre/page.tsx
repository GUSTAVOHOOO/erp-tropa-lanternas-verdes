import type { Metadata } from 'next'

export const metadata: Metadata = { // [ROTA-07]
  title: 'Sobre a Tropa | Central de Oa',
  description: 'O juramento, Oa e a organização da Tropa dos Lanternas Verdes.',
}

/** Página institucional estática: Server Component sem busca de dados. */
export default function SobrePage() {
  return (
    <article className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold">Sobre a Tropa</h1>
      <section>
        <h2 className="text-xl font-semibold">O juramento</h2>
        <blockquote className="mt-3 border-l-4 border-primary pl-4 italic">
          No dia mais claro, na noite mais densa, o mal sucumbirá diante da minha presença.
          Todo aquele que venera o mal há de penar quando o poder do Lanterna Verde enfrentar!
        </blockquote>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Oa e os Guardiões</h2>
        <p className="mt-2 text-muted-foreground">
          Oa fica no centro do universo, no Setor 0. Dali os Guardiões coordenam a Tropa, distribuem os anéis
          de poder e acompanham as ocorrências registradas em cada setor.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Os setores</h2>
        <p className="mt-2 text-muted-foreground">
          O universo é dividido em 3600 setores. Cada lanterna protege o seu setor e responde pelas ocorrências
          que acontecem nele.
        </p>
      </section>
    </article>
  )
}
