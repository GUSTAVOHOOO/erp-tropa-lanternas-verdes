import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const AREAS = [
  { href: '/lanternas', titulo: 'Lanternas da Tropa', descricao: 'Conheça os membros e filtre por setor.' },
  { href: '/sobre', titulo: 'Sobre a Tropa', descricao: 'O juramento, Oa e os Guardiões do Universo.' },
  { href: '/painel', titulo: 'Central de Comando', descricao: 'Área restrita: registre e acompanhe ocorrências.' },
]

/** Homepage: ponto de entrada com navegação para todas as áreas. [DEC-09] */
export default function HomePage() {
  return (
    <section>
      <h1 className="text-3xl font-bold md:text-4xl">Central de Ocorrências da Tropa dos Lanternas Verdes</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        De Oa, os Guardiões acompanham o que acontece nos 3600 setores do universo. Aqui a Tropa registra
        cada ocorrência intergaláctica e decide quem vai atendê-la.
      </p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3"> {/* [CSS-06] */}
        {AREAS.map((area) => (
          <li key={area.href}>
            <Link href={area.href} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-ring"> {/* [ROTA-16] */}
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle>{area.titulo}</CardTitle>
                  <CardDescription>{area.descricao}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
