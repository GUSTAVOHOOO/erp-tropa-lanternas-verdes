import { formatarData } from '@/lib/formatar'
import type { Evento } from '@/lib/schemas/evento'

type LinhaDoTempoProps = {
  eventos: Evento[]
  nomeLanterna: Record<string, string>
}

function resolverCodinome(slug: string | null, nomeLanterna: Record<string, string>): string {
  if (!slug) return ''
  return nomeLanterna[slug] ?? slug
}

function ConteudoEvento({ evento, nomeLanterna }: { evento: Evento; nomeLanterna: Record<string, string> }) {
  switch (evento.tipo) {
    case 'criada':
      return <span className="text-(--oa-text)">registrou a ocorrência</span>

    case 'atribuida': {
      const { de, para } = evento.dados
      if (de && para) {
        return (
          <span className="text-(--oa-text)">
            trocou o responsável de {resolverCodinome(de, nomeLanterna)} para {resolverCodinome(para, nomeLanterna)}
          </span>
        )
      }
      if (para) {
        return (
          <span className="text-(--oa-text)">
            atribuiu a {resolverCodinome(para, nomeLanterna)}
          </span>
        )
      }
      if (de) {
        return (
          <span className="text-(--oa-text)">
            liberou o responsável {resolverCodinome(de, nomeLanterna)}
          </span>
        )
      }
      return <span className="text-(--oa-text)">alterou a atribuição</span>
    }

    case 'status_alterado':
      return <span className="text-(--oa-text)">iniciou o atendimento</span>

    case 'resolvida':
      return (
        <div className="grid gap-1">
          <span className="text-(--oa-text)">resolveu</span>
          <p className="whitespace-pre-line text-sm text-(--oa-muted)">{evento.dados.resolucao}</p>
        </div>
      )

    case 'reaberta': {
      const liberouResponsavel = evento.dados.responsavelId === null && evento.dados.responsavelAnteriorId !== null
      const codinomeAnterior = liberouResponsavel ? resolverCodinome(evento.dados.responsavelAnteriorId, nomeLanterna) : null
      return (
        <div className="grid gap-1">
          <span className="text-(--oa-text)">reabriu</span>
          <p className="whitespace-pre-line text-sm text-(--oa-muted)">{evento.dados.motivo}</p>
          {liberouResponsavel && (
            <p className="text-xs text-(--oa-energy)">responsável {codinomeAnterior} liberado</p>
          )}
        </div>
      )
    }

    case 'comentario_apagado':
      return <span className="text-(--oa-text)">apagou um comentário</span>
  }
}

/** Linha do tempo com histórico de eventos e transições de ocorrência. [COMP-13] */
export function LinhaDoTempo({ eventos, nomeLanterna }: LinhaDoTempoProps) {
  if (eventos.length === 0) {
    return <p className="text-sm text-(--oa-muted)">Nenhum evento registrado.</p>
  }

  return (
    <ol className="grid gap-4 border-l border-(--oa-line) pl-4">
      {eventos.map((evento) => {
        const papelFormatado = evento.autor.papel === 'guardiao' ? 'Guardião' : 'Lanterna'
        return (
          <li key={evento.id} className="grid gap-1">
            <div className="flex flex-wrap items-baseline gap-2 text-xs text-(--oa-muted)">
              <time dateTime={evento.criadoEm}>{formatarData(evento.criadoEm)}</time>
              <span>•</span>
              <span className="font-medium text-(--oa-text)">
                {evento.autor.nome} ({papelFormatado})
              </span>
            </div>
            <ConteudoEvento evento={evento} nomeLanterna={nomeLanterna} />
          </li>
        )
      })}
    </ol>
  )
}
