import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { EstadoVazio } from '@/components/EstadoVazio'
import { listarLanternas } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import { filtroLanternasSchema } from '@/lib/schemas/lanterna'
import { CartaoLanterna } from '@/app/(site)/lanternas/_components/CartaoLanterna'

export const metadata: Metadata = {
  title: 'Lanternas | Central de Oa',
  description: 'Membros da Tropa dos Lanternas Verdes, por setor.',
}

type LanternasPageProps = { searchParams: Promise<{ setor?: string }> }

/** Listagem pública com filtro por setor na URL (?setor=2814). */
export default async function LanternasPage({ searchParams }: LanternasPageProps) {
  const { setor } = filtroLanternasSchema.parse(await searchParams) // [ROTA-10][ROTA-11][ROTA-14]
  const [setores, lanternas] = await Promise.all([listarSetores(), listarLanternas({ setorId: setor })]) // [API-07]
  const nomeSetor = Object.fromEntries(setores.map((s) => [s.id, s.nome]))

  return (
    <section>
      <h1 className="text-3xl font-bold">Lanternas da Tropa</h1>
      <nav aria-label="Filtrar por setor" className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/lanternas"
          aria-current={!setor ? 'page' : undefined}
          className={buttonVariants({ variant: !setor ? 'default' : 'outline', size: 'sm' })}
        >
          Todos
        </Link>
        {setores.map((s) => (
          <Link
            key={s.id}
            href={`/lanternas?setor=${s.id}`}
            aria-current={setor === s.id ? 'page' : undefined}
            className={buttonVariants({ variant: setor === s.id ? 'default' : 'outline', size: 'sm' })}
          >
            {s.nome}
          </Link>
        ))}
      </nav>
      {lanternas.length === 0 ? ( // [COMP-14][API-09]
        <EstadoVazio
          titulo="Nenhum lanterna neste setor"
          descricao="Este setor ainda não tem lanterna designado. Escolha outro setor ou veja todos."
          acao={{ href: '/lanternas', rotulo: 'Ver todos' }}
        />
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lanternas.map((l) => (
            <li key={l.id}>
              <CartaoLanterna lanterna={l} nomeSetor={nomeSetor[l.setorId] ?? `Setor ${l.setorId}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
