import type { Metadata } from 'next'
import { ApresentacaoOa } from '@/components/apresentacao/ApresentacaoOa'

// [PROD-04] material de aula: fora do índice dos buscadores.
export const metadata: Metadata = {
  title: 'Apresentação final',
  description: 'Apresentação final da Central de Oa: processo, front-end e back-end conferidos com as skills do projeto.',
  robots: { index: false, follow: false },
}

export default function ApresentacaoPage() {
  return <ApresentacaoOa />
}
