import type { Metadata } from 'next'
import { LaboratorioOa } from '@/components/oanet/LaboratorioOa'

export const metadata: Metadata = {
  title: 'OANET · Laboratório de interface',
  description: 'Central de Oa: uma experiência visual desenhada inteiramente em código.',
}

export default function LaboratorioPage() {
  return <LaboratorioOa />
}
