'use client'

import { TelaDeErro } from '@/components/TelaDeErro'

/** Error boundary raiz do App Router. */
export default function ErrorRaiz({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="oa-screen flex min-h-[50vh] items-center justify-center p-6">
      <TelaDeErro error={error} retry={reset} />
    </main>
  )
}
