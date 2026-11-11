'use client'

import { useEffect, useRef, useState } from 'react'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { MensagemErro } from '@/components/MensagemErro'
import { apagarComentario } from '@/app/(painel)/painel/ocorrencias/comentarios-actions'

type ApagarComentarioProps = {
  ocorrenciaId: string
  comentarioId: string
}

/** Diálogo acessível para confirmação de exclusão de comentário. [PROD-08] */
export function ApagarComentario({ ocorrenciaId, comentarioId }: ApagarComentarioProps) {
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string>()
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!aberto) return
    cancelarRef.current?.focus()

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setAberto(false)
        gatilhoRef.current?.focus()
      }
    }

    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  async function aoConfirmar() {
    setEnviando(true)
    setErro(undefined)
    try {
      const resultado = await apagarComentario(ocorrenciaId, comentarioId)
      if (!resultado.ok) {
        setErro(resultado.erro ?? 'Não foi possível apagar o comentário.')
      } else {
        setAberto(false)
      }
    } finally {
      setEnviando(false)
    }
  }

  function fechar() {
    setAberto(false)
    gatilhoRef.current?.focus()
  }

  return (
    <>
      <BotaoOa
        ref={gatilhoRef}
        type="button"
        tom="linha"
        onClick={() => setAberto(true)}
      >
        Apagar
      </BotaoOa>

      {aberto && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`confirmar-apagar-titulo-${comentarioId}`}
          aria-describedby={`confirmar-apagar-desc-${comentarioId}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="oa-panel max-w-md w-full bg-background p-6 shadow-xl border border-(--oa-line)">
            <h2 id={`confirmar-apagar-titulo-${comentarioId}`} className="text-lg font-semibold text-foreground">
              Apagar comentário
            </h2>
            <p id={`confirmar-apagar-desc-${comentarioId}`} className="mt-2 text-sm text-(--oa-muted)">
              O comentário será removido da lista e registrado na linha do tempo. Esta ação não pode ser desfeita.
            </p>
            {erro && (
              <div className="mt-3">
                <MensagemErro>{erro}</MensagemErro>
              </div>
            )}
            <div className="mt-6 oa-button-row justify-end">
              <BotaoOa
                ref={cancelarRef}
                type="button"
                tom="linha"
                disabled={enviando}
                onClick={fechar}
              >
                Cancelar
              </BotaoOa>
              <BotaoOa
                type="button"
                tom="perigo"
                disabled={enviando}
                onClick={aoConfirmar}
              >
                {enviando ? 'Apagando...' : 'Apagar'}
              </BotaoOa>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
