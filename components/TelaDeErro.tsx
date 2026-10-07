'use client'

import { useEffect } from 'react'
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
    <div role="alert" className="mt-6 rounded-xl border border-destructive/40 p-8 text-center">
      <p className="font-medium">Não foi possível falar com a Central de Oa.</p>
      <p className="mt-1 text-sm text-muted-foreground">Verifique sua conexão (ou se a API está ligada) e tente de novo.</p>
      <Button type="button" className="mt-4" onClick={() => retry()}> {/* [API-11] */}
        Tentar de novo
      </Button>
    </div>
  )
}
