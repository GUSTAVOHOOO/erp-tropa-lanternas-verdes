'use client'

import { useEffect } from 'react'
import { IconeOa } from '@/components/oanet/IconeOa'
import { BotaoOa } from '@/components/oanet/PainelOa'

type TelaDeErroProps = {
  error: Error & { digest?: string }
  retry: () => void
}

/** Conteúdo dos error.tsx: mensagem para humanos e "Tentar de novo". O detalhe vai só para o console. */
export function TelaDeErro({ error, retry }: TelaDeErroProps) {
  useEffect(() => {
    console.error(error) // [API-13]
  }, [error])

  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <IconeOa nome="ocorrencias" className="size-8 oa-tone-danger" />
      <div className="grid gap-1">
        <p className="font-semibold">Não foi possível falar com a Central de Oa.</p>
        <p className="max-w-prose text-sm text-(--oa-muted)">Verifique sua conexão (ou se a API está ligada) e tente de novo.</p>
      </div>
      <BotaoOa type="button" onClick={() => retry()} className="mt-2">
        Tentar de novo
      </BotaoOa>
    </div>
  )
}
