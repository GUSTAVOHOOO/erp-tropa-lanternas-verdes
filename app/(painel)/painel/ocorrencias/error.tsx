'use client'

import { TelaDeErro } from '@/components/TelaDeErro'

export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <TelaDeErro error={error} retry={retry} /> // [ROTA-21][API-11]
}
