import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { verificarSessao } from '@/lib/dal'
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
  const [ocorrencia, setores, lanternas] = await Promise.all([buscarOcorrencia(id), listarSetores(), listarLanternas()]) // [API-07]
  if (!ocorrencia) notFound() // [ROTA-12]
  if (!podeAcessarSetor(sessao, ocorrencia.setorId)) redirect('/acesso-negado') // [AUTH-07]

  const setor = setores.find((s) => s.id === ocorrencia.setorId)
  const responsavel = lanternas.find((l) => l.id === ocorrencia.responsavelId)

  return (
    <article className="max-w-3xl">
      <Link href="/painel/ocorrencias" className="text-sm text-primary hover:underline">← Voltar à lista</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{ocorrencia.titulo}</h1>
        {sessao.papel === 'guardiao' && (
          <Link href={`/painel/ocorrencias/${ocorrencia.id}/atribuir`} className={buttonVariants({ variant: 'outline' })}>
            Atribuir responsável
          </Link>
        )}
      </div>
      <p className="mt-2 text-muted-foreground">{ocorrencia.descricao}</p>
      <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
        <dt className="font-medium">Planeta</dt>
        <dd>{ocorrencia.planeta}</dd>
        <dt className="font-medium">Setor</dt>
        <dd>{setor?.nome ?? `Setor ${ocorrencia.setorId}`}</dd>
        <dt className="font-medium">Gravidade</dt>
        <dd><BadgeGravidade gravidade={ocorrencia.gravidade} /></dd>
        <dt className="font-medium">Status</dt>
        <dd><BadgeStatus status={ocorrencia.status} /></dd>
        <dt className="font-medium">Seres envolvidos</dt>
        <dd>{ocorrencia.envolvidos}</dd>
        <dt className="font-medium">Responsável</dt>
        <dd>{responsavel?.nome ?? '—'}</dd>
        <dt className="font-medium">Registrada em</dt>
        <dd>{formatarData(ocorrencia.criadaEm)}</dd>
        {ocorrencia.resolucao && (
          <>
            <dt className="font-medium">Resolução</dt>
            <dd>{ocorrencia.resolucao}</dd>
          </>
        )}
      </dl>
      <FormStatus
        key={`${ocorrencia.status}-${ocorrencia.resolucao ?? ''}`}
        ocorrenciaId={ocorrencia.id}
        statusAtual={ocorrencia.status}
        resolucaoAtual={ocorrencia.resolucao ?? ''}
      />
    </article>
  )
}
