'use client'

import { TelaDeErro } from '@/components/TelaDeErro'

export default function Erro({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string }
  reset?: () => void
  retry?: () => void
}) {
  return <TelaDeErro error={error} retry={reset ?? retry ?? (() => {})} /> // [ROTA-21][API-11]
}
