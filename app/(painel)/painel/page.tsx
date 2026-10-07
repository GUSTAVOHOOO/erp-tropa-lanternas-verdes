import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EstadoVazio } from '@/components/EstadoVazio'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { verificarSessao } from '@/lib/dal'
import { listarLanternas } from '@/lib/lanternas'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/sessao'
import { listarSetores } from '@/lib/setores'
import { rotuloStatus, STATUS_OCORRENCIA } from '@/lib/schemas/ocorrencia'

export const metadata: Metadata = { title: 'Resumo | Central de Comando' }

/** Resumo: contadores por status e as 5 ocorrências mais recentes (do setor, para o Lanterna). */
export default async function PainelPage() {
  const sessao = await verificarSessao() // [AUTH-04]
  const [ocorrencias, setores, lanternas] = await Promise.all([ // [API-07]
    listarOcorrencias({ setorId: setorParaFiltro(sessao) }), // [AUTH-07]
    listarSetores(),
    listarLanternas(),
  ])
  const contagem = STATUS_OCORRENCIA.map((status) => ({
    status,
    total: ocorrencias.filter((o) => o.status === status).length, // [JS-09]
  }))

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bem-vindo, {sessao.nome}</h1>
          <p className="text-muted-foreground">
            {sessao.papel === 'guardiao' ? 'Visão de todos os setores.' : `Ocorrências do Setor ${sessao.setorId}.`}
          </p>
        </div>
        <Link href="/painel/ocorrencias/nova" className={buttonVariants()}>Registrar ocorrência</Link>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {contagem.map(({ status, total }) => (
          <li key={status}>
            <Link href={`/painel/ocorrencias?status=${status}`} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <CardDescription>{rotuloStatus[status]}</CardDescription>
                  <CardTitle className="text-3xl">{total}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-lg font-semibold">Mais recentes</h2>
      {ocorrencias.length === 0 ? (
        <EstadoVazio titulo="Nenhuma ocorrência registrada" descricao="Quando algo acontecer no setor, registre aqui." acao={{ href: '/painel/ocorrencias/nova', rotulo: 'Registrar ocorrência' }} />
      ) : (
        <TabelaOcorrencias
          ocorrencias={ocorrencias.slice(0, 5)}
          nomeSetor={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
          nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.nome]))}
        />
      )}
    </section>
  )
}
