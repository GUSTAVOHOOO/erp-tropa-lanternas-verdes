'use client'

import { useEffect } from 'react'
import { EmblemaOa } from '@/components/oanet/EmblemaOa'

/** Global error boundary: captura falhas no layout raiz. Deve renderizar <html> e <body> próprios. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('GlobalError:', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="oa-lab flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <section className="mx-auto flex max-w-md flex-col items-center gap-4">
          <EmblemaOa className="size-20" />
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider">Falha crítica no sistema</h1>
          <p className="text-sm text-(--oa-muted)">
            A conexão com a Bateria Central foi interrompida no nível estrutural.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="oa-button oa-button--energia mt-4 inline-flex"
          >
            <span className="oa-button-content">Reiniciar sistema</span>
          </button>
        </section>
      </body>
    </html>
  )
}
