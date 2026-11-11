import type { Metadata } from 'next'
import Link from 'next/link'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { MolduraOa } from '@/components/oanet/PainelOa'
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
    <section className="oa-screen">
      <CabecalhoPagina titulo="Lanternas da Tropa" descricao="Membros da Tropa, por setor." />
      <nav aria-label="Filtrar por setor" className="oa-button-row">
        <Link
          href="/lanternas"
          aria-current={!setor ? 'page' : undefined}
          className={`oa-button ${!setor ? 'oa-button--energia' : 'oa-button--linha'}`}
        >
          <span className="oa-button-content">Todos</span>
        </Link>
        {setores.map((s) => {
          const ativo = setor === s.id
          return (
            <Link
              key={s.id}
              href={`/lanternas?setor=${s.id}`}
              aria-current={ativo ? 'page' : undefined}
              className={`oa-button ${ativo ? 'oa-button--energia' : 'oa-button--linha'}`}
            >
              <span className="oa-button-content">{s.nome}</span>
            </Link>
          )
        })}
      </nav>
      <MolduraOa titulo="Efetivo da Tropa" icone="pessoal">
        <div className="p-4 md:p-6">
          {lanternas.length === 0 ? ( // [COMP-14][API-09]
            <EstadoVazio
              titulo="Nenhum lanterna neste setor"
              descricao="Este setor ainda não tem lanterna designado. Escolha outro setor ou veja todos."
              acao={{ href: '/lanternas', rotulo: 'Ver todos' }}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"> {/* [CSS-03][CSS-06] */}
              {lanternas.map((l) => (
                <li key={l.id}>
                  <CartaoLanterna lanterna={l} nomeSetor={nomeSetor[l.setorId] ?? `Setor ${l.setorId}`} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </MolduraOa>
    </section>
  )
}
