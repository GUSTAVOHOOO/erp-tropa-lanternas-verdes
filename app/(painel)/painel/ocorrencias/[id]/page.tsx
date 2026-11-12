import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { IconeOa } from '@/components/oanet/IconeOa'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { verificarSessao } from '@/lib/dal'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { formatarData } from '@/lib/formatar'
import { listarLanternas } from '@/lib/lanternas'
import { buscarOcorrencia } from '@/lib/ocorrencias'
import { podeAcessarSetor } from '@/lib/sessao'
import { listarSetores } from '@/lib/setores'
import { FormStatus } from '@/app/(painel)/painel/ocorrencias/_components/FormStatus'

export const metadata: Metadata = { title: 'Ocorrência | Central de Comando' }

type OcorrenciaPageProps = { params: Promise<{ id: string }> }

/** Detalhe da ocorrência com o formulário de status. */
export default async function OcorrenciaPage({ params }: OcorrenciaPageProps) {
  const sessao = await verificarSessao() // [AUTH-04]
  const { id } = await params // [ROTA-10]
  let ocorrencia, setores, lanternas
  try {
    ;[ocorrencia, setores, lanternas] = await Promise.all([buscarOcorrencia(id), listarSetores(), listarLanternas()]) // [API-07]
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }
  if (!ocorrencia) notFound() // [ROTA-12]
  if (!podeAcessarSetor(sessao, ocorrencia.setorId)) redirect('/acesso-negado') // [AUTH-07]

  const setor = setores.find((s) => s.id === ocorrencia.setorId)
  const responsavel = lanternas.find((l) => l.id === ocorrencia.responsavelId)

  return (
    <article className="oa-screen mx-auto grid max-w-3xl gap-8">
      <div className="grid gap-4">
        <LinkVoltar href="/painel/ocorrencias">Voltar à lista</LinkVoltar>
        <CabecalhoPagina titulo={ocorrencia.titulo}>
          {sessao.papel === 'guardiao' && ( // [COMP-14]
            <Link href={`/painel/ocorrencias/${ocorrencia.id}/atribuir`} className="oa-button oa-button--linha">
              <span className="oa-button-content">
                <IconeOa nome="pessoal" />
                Atribuir responsável
              </span>
            </Link>
          )}
        </CabecalhoPagina>
        <div className="flex flex-wrap items-center gap-4">
          <BadgeGravidade gravidade={ocorrencia.gravidade} />
          <BadgeStatus status={ocorrencia.status} />
        </div>
      </div>

      <MolduraOa titulo="Registro operacional" icone="ocorrencias">
        <div className="oa-panel-body">
          <p className="max-w-prose text-(--oa-text)">{ocorrencia.descricao}</p>
          <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-(--oa-line) pt-6 sm:grid-cols-2"> {/* [CSS-03] */}
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Planeta</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{ocorrencia.planeta}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Setor</dt>
              <dd className="font-mono text-sm text-(--oa-text)">{setor?.nome ?? `Setor ${ocorrencia.setorId}`}</dd> {/* [CSS-13] */}
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Seres envolvidos</dt>
              <dd className="tabular-nums text-sm font-medium text-(--oa-text)">{ocorrencia.envolvidos}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Responsável</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{responsavel?.nome ?? <span className="text-(--oa-muted)">Sem responsável</span>}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Registrada em</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{formatarData(ocorrencia.criadaEm)}</dd>
            </div>
            {ocorrencia.resolucao && ( // [COMP-14]
              <div className="grid gap-1 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Resolução</dt>
                <dd className="max-w-prose text-sm font-medium text-(--oa-text)">{ocorrencia.resolucao}</dd>
              </div>
            )}
          </dl>
        </div>
      </MolduraOa>

      <MolduraOa titulo="Atualizar status" icone="painel">
        <div className="oa-panel-body">
          <FormStatus
            key={`${ocorrencia.status}-${ocorrencia.resolucao ?? ''}`}
            ocorrenciaId={ocorrencia.id}
            statusAtual={ocorrencia.status}
            resolucaoAtual={ocorrencia.resolucao ?? ''}
          />
        </div>
      </MolduraOa>
    </article>
  )
}
