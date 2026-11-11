import type { Metadata } from 'next'
import Link from 'next/link'
import { BarraStatus } from '@/components/BarraStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { IconeOa } from '@/components/oanet/IconeOa'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { verificarSessao } from '@/lib/dal'
import { listarTodosLanternas } from '@/lib/lanternas'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/escopo'
import { listarSetores } from '@/lib/setores'

export const metadata: Metadata = { title: 'Resumo | Central de Comando' }

/** Resumo: barra de status e as 5 ocorrências mais recentes (do setor, para o Lanterna). */
export default async function PainelPage() {
  const sessao = await verificarSessao() // [AUTH-04]
  const [ocorrencias, setores, lanternas] = await Promise.all([ // [API-07]
    listarOcorrencias({ setorId: setorParaFiltro(sessao) === undefined ? undefined : String(setorParaFiltro(sessao)) }), // [AUTH-07] // FE-04: setor inteiro do contrato
    listarSetores(),
    listarTodosLanternas(),
  ])

  return (
    <section className="oa-screen grid gap-8">
      <CabecalhoPagina
        titulo={`Bem-vindo, ${sessao.nome}`}
        descricao={sessao.papel === 'guardiao' ? 'Visão de todos os setores.' : `Ocorrências do Setor ${sessao.setorId}.`}
      >
        <Link href="/painel/ocorrencias/nova" className="oa-button oa-button--energia"> {/* [ROTA-16] */}
          <span className="oa-button-content">
            <IconeOa nome="mais" />
            Registrar ocorrência
          </span>
        </Link>
      </CabecalhoPagina>

      <MolduraOa titulo="Status operacional" icone="painel">
        <div className="oa-panel-body">
          <BarraStatus ocorrencias={ocorrencias} />
        </div>
      </MolduraOa>

      <MolduraOa titulo="Mais recentes" icone="ocorrencias">
        {ocorrencias.length === 0 ? ( // [API-09]
          <EstadoVazio titulo="Nenhuma ocorrência registrada" descricao="Quando algo acontecer no setor, registre aqui." acao={{ href: '/painel/ocorrencias/nova', rotulo: 'Registrar ocorrência' }} />
        ) : (
          <TabelaOcorrencias
            ocorrencias={ocorrencias.slice(0, 5)}
            nomeSetor={Object.fromEntries(setores.map((s) => [String(s.id), s.nome]))}
            nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.codinome]))}
          />
        )}
      </MolduraOa>
    </section>
  )
}
