import { formatarData } from '@/lib/formatar'
import type { Sessao } from '@/lib/schemas/usuario'
import type { Comentario } from '@/lib/schemas/comentario'
import { ApagarComentario } from './ApagarComentario'
import { FormComentario } from './FormComentario'

type ComentariosProps = {
  ocorrenciaId: string
  comentarios: Comentario[]
  sessao: Sessao
}

/** Seção de comentários de uma ocorrência. [COMP-13] */
export function Comentarios({ ocorrenciaId, comentarios, sessao }: ComentariosProps) {
  return (
    <div className="grid gap-6">
      {comentarios.length === 0 ? (
        <p className="text-sm text-(--oa-muted)">Nenhum comentário ainda.</p>
      ) : (
        <ul className="grid gap-4">
          {comentarios.map((comentario) => {
            const podeApagar = sessao.papel === 'guardiao' || sessao.id === comentario.autorId
            const papelFormatado = comentario.autor.papel === 'guardiao' ? 'Guardião' : 'Lanterna'

            return (
              <li
                key={comentario.id}
                className="grid gap-2 border-b border-(--oa-line) pb-4 last:border-b-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-2 text-xs text-(--oa-muted)">
                    <span className="font-medium text-(--oa-text)">
                      {comentario.autor.nome} ({papelFormatado})
                    </span>
                    <span>•</span>
                    <time dateTime={comentario.criadoEm}>{formatarData(comentario.criadoEm)}</time>
                  </div>
                  {podeApagar && (
                    <ApagarComentario
                      ocorrenciaId={ocorrenciaId}
                      comentarioId={comentario.id}
                    />
                  )}
                </div>
                <p className="whitespace-pre-line text-sm text-(--oa-text)">
                  {comentario.texto}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      <div className="border-t border-(--oa-line) pt-4">
        <FormComentario ocorrenciaId={ocorrenciaId} />
      </div>
    </div>
  )
}
