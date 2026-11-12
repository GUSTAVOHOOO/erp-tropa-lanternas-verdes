'use client'

import { useState } from 'react'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { alterarStatusLanternaAcao } from '@/app/(painel)/painel/lanternas/actions'
import type { StatusLanterna as StatusLanternaTipo } from '@/lib/schemas/lanterna'

type StatusLanternaProps = {
  slug: string
  status: StatusLanternaTipo
}

/** Controle de status de uma Ficha no painel de gestão (afastar / reativar). [COMP-01] */
export function StatusLanterna({ slug, status }: StatusLanternaProps) {
  const [pendente, setPendente] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (status === 'em_missao') {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <BotaoOa type="button" disabled tom="linha" className="opacity-60 cursor-not-allowed text-xs">
          Em missão: o status muda quando a missão terminar
        </BotaoOa>
      </span>
    )
  }

  async function handleMudarStatus(novoStatus: 'ativo' | 'afastado') {
    setPendente(true)
    setErro(null)
    const resultado = await alterarStatusLanternaAcao(slug, novoStatus)
    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível alterar o status.')
    }
    setPendente(false)
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      {status === 'ativo' ? (
        <BotaoOa
          type="button"
          tom="linha"
          disabled={pendente}
          onClick={() => handleMudarStatus('afastado')}
          className="text-xs"
        >
          {pendente ? 'Afastando...' : 'Afastar'}
        </BotaoOa>
      ) : (
        <BotaoOa
          type="button"
          tom="energia"
          disabled={pendente}
          onClick={() => handleMudarStatus('ativo')}
          className="text-xs"
        >
          {pendente ? 'Reativando...' : 'Reativar'}
        </BotaoOa>
      )}
      {erro && (
        <span role="alert" className="text-xs oa-tone-danger">
          {erro}
        </span>
      )}
    </div>
  )
}
