// FE-07a: substituído pelo /dashboard
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
import { contarOcorrencias, listarOcorrencias } from '@/lib/ocorrencias'
import type { StatusOcorrencia } from '@/lib/schemas/ocorrencia'
import { listarSetores } from '@/lib/setores'

export const metadata: Metadata = { title: 'Resumo | Central de Comando' }

/** Resumo: barra de status com contagens do servidor e as 5 ocorrências mais recentes. */
export default async function PainelPage() {
  const sessao = await verificarSessao() // [AUTH-04]
  const [aberta, emAndamento, resolvida, respostaRecentes, setores, lanternas] = await Promise.all([ // [API-07]
    contarOcorrencias({ status: 'aberta' }),
    contarOcorrencias({ status: 'em_andamento' }),
    contarOcorrencias({ status: 'resolvida' }),
    listarOcorrencias({ limite: 5 }),
    listarSetores(),
    listarTodosLanternas(),
  ])

  const contagens: Record<StatusOcorrencia, number> = {
    aberta,
    em_andamento: emAndamento,
    resolvida,
  }

  const ocorrencias = respostaRecentes.itens

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
        <BarraStatus contagens={contagens} />
      </MolduraOa>

      <MolduraOa titulo="Mais recentes" icone="ocorrencias">
        {ocorrencias.length === 0 ? ( // [API-09]
          <EstadoVazio titulo="Nenhuma ocorrência registrada" descricao="Quando algo acontecer no setor, registre aqui." acao={{ href: '/painel/ocorrencias/nova', rotulo: 'Registrar ocorrência' }} />
        ) : (
          <TabelaOcorrencias
            ocorrencias={ocorrencias}
            nomeSetor={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
            nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.codinome]))}
          />
        )}
      </MolduraOa>
    </section>
  )
}
