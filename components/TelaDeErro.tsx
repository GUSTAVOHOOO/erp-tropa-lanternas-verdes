'use client'

import { useEffect } from 'react'
import { CircleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-destructive/50 bg-card px-6 py-10 text-center">
      <CircleAlertIcon aria-hidden className="size-6 text-destructive" />
      <div className="grid gap-1">
        <p className="font-semibold">Não foi possível falar com a Central de Oa.</p>
        <p className="max-w-prose text-sm text-muted-foreground">Verifique sua conexão (ou se a API está ligada) e tente de novo.</p>
      </div>
      <Button type="button" onClick={() => retry()}> {/* [API-11] */}
        Tentar de novo
      </Button>
    </div>
  )
}
