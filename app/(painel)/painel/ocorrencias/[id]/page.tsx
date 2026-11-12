import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import * as z from 'zod'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { Paginacao } from '@/components/Paginacao'
import { IconeOa } from '@/components/oanet/IconeOa'
import { MolduraOa, SeloOa } from '@/components/oanet/PainelOa'
import { listarComentarios } from '@/lib/comentarios'
import { verificarSessao } from '@/lib/dal'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { podeAcessarSetor } from '@/lib/escopo'
import { listarEventos } from '@/lib/eventos'
import { formatarData } from '@/lib/formatar'
import { listarTodosLanternas } from '@/lib/lanternas'
import { buscarOcorrencia } from '@/lib/ocorrencias'
import { acoesPermitidas, transicoesPermitidas } from '@/lib/permissoes-ocorrencia'
import { listarSetores } from '@/lib/setores'
import { Comentarios } from '@/app/(painel)/painel/ocorrencias/_components/Comentarios'
import { ConfirmarExclusao } from '@/app/(painel)/painel/ocorrencias/_components/ConfirmarExclusao'
import { FormEditarOcorrencia } from '@/app/(painel)/painel/ocorrencias/_components/FormEditarOcorrencia'
import { FormStatus } from '@/app/(painel)/painel/ocorrencias/_components/FormStatus'
import { LinhaDoTempo } from '@/app/(painel)/painel/ocorrencias/_components/LinhaDoTempo'
import { SEM_CACHE } from '@/lib/api'

export const metadata: Metadata = { title: 'Ocorrência | Central de Comando' }

const paginaParamSchema = z.coerce.number().int().min(1).optional().catch(undefined)

type OcorrenciaPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

/** Detalhe da ocorrência com ciclo de vida, edição e exclusão. [ROTA-10][API-07][API-12] */
export default async function OcorrenciaPage({ params, searchParams }: OcorrenciaPageProps) {
  const sessao = await verificarSessao() // [AUTH-04]
  const { id } = await params // [ROTA-10]
  const sp = (await searchParams) ?? {}
  const paginaEventos = paginaParamSchema.parse(sp.eventos) ?? 1
  const paginaComentarios = paginaParamSchema.parse(sp.comentarios) ?? 1

  let ocorrencia, setores, lanternas, eventosPaginados, comentariosPaginados
  try {
    ;[ocorrencia, setores, lanternas, eventosPaginados, comentariosPaginados] = await Promise.all([
      buscarOcorrencia(id),
      listarSetores(SEM_CACHE),
      listarTodosLanternas({}, SEM_CACHE),
      listarEventos(id, paginaEventos),
      listarComentarios(id, paginaComentarios),
    ]) // [API-07]
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }
  if (!ocorrencia) notFound() // [ROTA-12]
  if (!podeAcessarSetor(sessao, ocorrencia.setorId)) redirect('/acesso-negado') // [AUTH-07]

  const setor = setores.find((s) => s.id === ocorrencia.setorId)
  const responsavel = lanternas.find((l) => l.id === ocorrencia.responsavelId)
  const nomeLanterna: Record<string, string> = Object.fromEntries(lanternas.map((l) => [l.id, l.codinome]))
  const acoes = acoesPermitidas(sessao, ocorrencia)
  const transicoes = transicoesPermitidas(acoes)

  const parametrosPaginacao = {
    eventos: paginaEventos > 1 ? String(paginaEventos) : undefined,
    comentarios: paginaComentarios > 1 ? String(paginaComentarios) : undefined,
  }

  return (
    <article className="oa-screen mx-auto grid max-w-3xl gap-8">
      <div className="grid gap-4">
        <LinkVoltar href="/painel/ocorrencias">Voltar à lista</LinkVoltar>
        <CabecalhoPagina titulo={ocorrencia.titulo}>
          {acoes.atribuir && ( // [COMP-14]
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
              <dd className="text-sm font-medium text-(--oa-text)">{responsavel?.codinome ?? <span className="text-(--oa-muted)">Sem responsável</span>}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Prazo</dt>
              <dd className="text-sm font-medium text-(--oa-text) flex items-center gap-2">
                <span>{formatarData(ocorrencia.prazoEm)}</span>
                {ocorrencia.vencida && <SeloOa tom="vermelho">Vencida</SeloOa>}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Registrada em</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{formatarData(ocorrencia.criadaEm)}</dd>
            </div>
            {ocorrencia.resolvidaEm && (
              <div className="grid gap-1">
                <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Resolvida em</dt>
                <dd className="text-sm font-medium text-(--oa-text)">{formatarData(ocorrencia.resolvidaEm)}</dd>
              </div>
            )}
            {ocorrencia.resolucao && ( // [COMP-14]
              <div className="grid gap-1 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Resolução</dt>
                <dd className="max-w-prose text-sm font-medium text-(--oa-text)">{ocorrencia.resolucao}</dd>
              </div>
            )}
          </dl>
        </div>
      </MolduraOa>

      {transicoes.length > 0 && (
        <MolduraOa titulo="Atualizar status" icone="painel">
          <div className="oa-panel-body">
            <FormStatus
              key={`${ocorrencia.status}-${ocorrencia.resolucao ?? ''}`}
              ocorrenciaId={ocorrencia.id}
              statusAtual={ocorrencia.status}
              transicoes={transicoes}
            />
          </div>
        </MolduraOa>
      )}

      {acoes.editar && (
        <MolduraOa titulo="Editar dados" icone="ocorrencias">
          <div className="oa-panel-body">
            <FormEditarOcorrencia ocorrencia={ocorrencia} />
          </div>
        </MolduraOa>
      )}

      <MolduraOa titulo="Linha do tempo" icone="relatorios">
        <div className="p-4 md:p-6">
          <LinhaDoTempo eventos={eventosPaginados.itens} nomeLanterna={nomeLanterna} />
          <Paginacao
            pagina={eventosPaginados.meta.pagina}
            paginas={eventosPaginados.meta.paginas}
            caminho={`/painel/ocorrencias/${ocorrencia.id}`}
            parametros={parametrosPaginacao}
            parametro="eventos"
          />
        </div>
      </MolduraOa>

      <MolduraOa titulo="Comentários" icone="comunicacoes">
        <div className="p-4 md:p-6">
          <Comentarios
            ocorrenciaId={ocorrencia.id}
            comentarios={comentariosPaginados.itens}
            sessao={sessao}
          />
          <Paginacao
            pagina={comentariosPaginados.meta.pagina}
            paginas={comentariosPaginados.meta.paginas}
            caminho={`/painel/ocorrencias/${ocorrencia.id}`}
            parametros={parametrosPaginacao}
            parametro="comentarios"
          />
        </div>
      </MolduraOa>

      {acoes.excluir && (
        <div className="oa-button-row justify-end">
          <ConfirmarExclusao ocorrenciaId={ocorrencia.id} />
        </div>
      )}
    </article>
  )
}
