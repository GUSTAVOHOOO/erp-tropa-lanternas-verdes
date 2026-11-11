import type { Metadata } from 'next'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { Juramento } from '@/components/Juramento'
import { LinkVoltar } from '@/components/LinkVoltar'
import { CidadeOa } from '@/components/oanet/ConstructosOa'
import { IconeOa } from '@/components/oanet/IconeOa'
import { MolduraOa } from '@/components/oanet/PainelOa'

export const metadata: Metadata = { // [ROTA-07]
  title: 'Sobre a Tropa | Central de Oa',
  description: 'O juramento, Oa e a organização da Tropa dos Lanternas Verdes.',
}

/** Página institucional estática: Server Component sem busca de dados. */
export default function SobrePage() {
  return (
    <article className="oa-screen max-w-4xl">
      <div className="grid gap-4">
        <LinkVoltar href="/">Voltar ao início</LinkVoltar>
        <CabecalhoPagina titulo="Sobre a Tropa" descricao="O juramento, Oa e a organização da Tropa dos Lanternas Verdes." />
      </div>
      <MolduraOa titulo="O juramento" icone="escudo">
        <div className="p-6 md:p-8">
          <Juramento />
        </div>
      </MolduraOa>
      <MolduraOa titulo="Oa e os Guardiões" icone="hierarquia">
        <div className="relative isolate overflow-hidden p-6 md:min-h-56 md:p-8">
          <p className="relative z-10 max-w-prose leading-relaxed text-(--oa-muted)">
            Oa fica no centro do universo, no Setor 0. Dali os Guardiões coordenam a Tropa, distribuem os anéis
            de poder e acompanham as ocorrências registradas em cada setor.
          </p>
          <CidadeOa className="oa-hierarchy-city" /> {/* decorativa: aria-hidden no próprio SVG */}
        </div>
      </MolduraOa>
      <MolduraOa titulo="Os setores" icone="setores">
        <div className="flex items-start gap-4 p-6 md:p-8">
          <IconeOa nome="setores" className="size-8 shrink-0 text-(--oa-energy)" />
          <p className="max-w-prose leading-relaxed text-(--oa-muted)">
            O universo é dividido em 3600 setores. Cada lanterna protege o seu setor e responde pelas ocorrências
            que acontecem nele.
          </p>
        </div>
      </MolduraOa>
    </article>
  )
}
