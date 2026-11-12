'use client'

import { useEffect, useRef, useState } from 'react'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { MensagemErro } from '@/components/MensagemErro'
import { excluirSetorAcao } from '@/app/(painel)/painel/setores/actions'

type ExcluirSetorProps = {
  setorId: number
}

/** Diálogo acessível de confirmação para remoção de setor (restrito ao Guardião). */
export function ExcluirSetor({ setorId }: ExcluirSetorProps) {
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
      const resultado = await excluirSetorAcao(setorId)
      if (resultado && !resultado.ok) {
        setErro(resultado.erro ?? 'Não foi possível excluir o setor.')
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
        tom="perigo"
        className="text-xs"
        onClick={() => setAberto(true)}
      >
        Excluir
      </BotaoOa>

      {aberto && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`confirmar-exclusao-titulo-${setorId}`}
          aria-describedby={`confirmar-exclusao-descricao-${setorId}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="oa-panel max-w-md w-full bg-background p-6 shadow-xl border border-(--oa-line)">
            <h2
              id={`confirmar-exclusao-titulo-${setorId}`}
              className="text-lg font-semibold text-foreground"
            >
              Excluir setor {setorId}
            </h2>
            <p
              id={`confirmar-exclusao-descricao-${setorId}`}
              className="mt-2 text-sm text-(--oa-muted)"
            >
              Setores com Lanternas, ocorrências ou contas ligadas não podem ser excluídos. Esta ação não pode ser desfeita.
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
                {enviando ? 'Excluindo...' : 'Confirmar exclusão'}
              </BotaoOa>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
