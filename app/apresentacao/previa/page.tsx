import type { Metadata } from 'next'
import { ChamadaTropa } from '@/components/apresentacao/lanternas'
import { NascimentoGalaxia } from '@/components/apresentacao/NascimentoGalaxia'

// TEMPORÁRIO: prévia para os workers durante o desenvolvimento. O coordenador remove antes do merge.
export const metadata: Metadata = { title: 'Prévia', robots: { index: false, follow: false } }

export default function PreviaPage() {
  return (
    <div className="oa-lab dk-deck" style={{ position: 'fixed', inset: 0, display: 'grid', gridTemplateRows: '1fr 240px', gap: 16, padding: 16 }}>
      <div style={{ position: 'relative', minHeight: 0, border: '1px dashed var(--oa-line)' }}>
        <NascimentoGalaxia className="dk-previa-galaxia" />
      </div>
      <div style={{ border: '1px dashed var(--oa-line)' }}>
        <ChamadaTropa />
      </div>
    </div>
  )
}
