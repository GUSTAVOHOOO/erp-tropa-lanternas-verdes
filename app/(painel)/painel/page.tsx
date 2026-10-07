import type { Metadata } from 'next'
import Link from 'next/link'
import { PlusIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { BarraStatus } from '@/components/BarraStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { verificarSessao } from '@/lib/dal'
import { listarLanternas } from '@/lib/lanternas'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/sessao'
import { listarSetores } from '@/lib/setores'

export const metadata: Metadata = { title: 'Resumo | Central de Comando' }

/** Resumo: barra de status e as 5 ocorrências mais recentes (do setor, para o Lanterna). */
export default async function PainelPage() {
  const sessao = await verificarSessao() // [AUTH-04]
  const [ocorrencias, setores, lanternas] = await Promise.all([ // [API-07]
    listarOcorrencias({ setorId: setorParaFiltro(sessao) }), // [AUTH-07]
    listarSetores(),
    listarLanternas(),
  ])

  return (
    <section className="grid gap-8">
      <CabecalhoPagina
        titulo={`Bem-vindo, ${sessao.nome}`}
        descricao={sessao.papel === 'guardiao' ? 'Visão de todos os setores.' : `Ocorrências do Setor ${sessao.setorId}.`}
      >
        <Link href="/painel/ocorrencias/nova" className={buttonVariants()}> {/* [ROTA-16] */}
          <PlusIcon aria-hidden />
          Registrar ocorrência
        </Link>
      </CabecalhoPagina>
      <BarraStatus ocorrencias={ocorrencias} />
      <section aria-labelledby="mais-recentes" className="grid gap-3">
        <h2 id="mais-recentes" className="font-heading text-2xl font-semibold">Mais recentes</h2> {/* [CSS-07] */}
        {ocorrencias.length === 0 ? ( // [API-09]
          <EstadoVazio titulo="Nenhuma ocorrência registrada" descricao="Quando algo acontecer no setor, registre aqui." acao={{ href: '/painel/ocorrencias/nova', rotulo: 'Registrar ocorrência' }} />
        ) : (
          <TabelaOcorrencias
            ocorrencias={ocorrencias.slice(0, 5)}
            nomeSetor={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
            nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.nome]))}
          />
        )}
      </section>
    </section>
  )
}
