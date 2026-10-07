import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Emblema } from '@/components/Emblema'
import { Juramento } from '@/components/Juramento'

const AREAS = [
  { href: '/lanternas', titulo: 'Lanternas da Tropa', descricao: 'Conheça os membros e filtre por setor.' },
  { href: '/sobre', titulo: 'Sobre a Tropa', descricao: 'O juramento, Oa e os Guardiões do Universo.' },
  { href: '/painel', titulo: 'Central de Comando', descricao: 'Área restrita: registre e acompanhe ocorrências.' },
]

/** Homepage: o único lugar com mais expressão; leva a todas as áreas. */
export default function HomePage() { // [DEC-09]
  return (
    <div className="grid gap-16 md:gap-20">
      <section className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between"> {/* [CSS-03][CSS-05] */}
        <div className="grid max-w-2xl gap-6">
          <h1 className="font-heading text-5xl leading-none font-bold md:text-6xl">Central de Ocorrências da Tropa dos Lanternas Verdes</h1> {/* [CSS-13] */}
          <p className="max-w-prose text-lg text-muted-foreground">
            De Oa, os Guardiões acompanham o que acontece nos 3600 setores do universo. Aqui a Tropa registra
            cada ocorrência intergaláctica e decide quem vai atendê-la.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/painel" className={buttonVariants({ size: 'lg' })}>Entrar na Central de Comando</Link> {/* [ROTA-16] */}
            <Link href="/lanternas" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Conhecer os lanternas</Link>
          </div>
        </div>
        <Emblema className="size-32 self-center text-primary-texto drop-shadow-anel md:size-48" /> {/* [CSS-14] */}
      </section>
      <Juramento />
      <section aria-labelledby="areas" className="grid gap-4">
        <h2 id="areas" className="font-heading text-2xl font-semibold">Para onde ir</h2>
        <ul className="border-t border-border"> {/* lista, não cartões iguais: cada área é uma linha */}
          {AREAS.map((area) => (
            <li key={area.href} className="border-b border-border"> {/* [COMP-13] */}
              <Link href={area.href} className="group flex items-center justify-between gap-4 py-5 transition-colors duration-150 ease-out hover:bg-secondary/60 md:px-3">
                <span className="grid gap-1">
                  <span className="text-lg font-semibold">{area.titulo}</span>
                  <span className="text-muted-foreground">{area.descricao}</span>
                </span>
                <ArrowRightIcon aria-hidden className="size-5 shrink-0 text-texto-terciario transition-colors duration-150 group-hover:text-primary-texto" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
