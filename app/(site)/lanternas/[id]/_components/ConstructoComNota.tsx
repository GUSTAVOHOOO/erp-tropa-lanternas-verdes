'use client'

import { constructosLanternas, ConstructoDoLanterna } from '@/components/oanet/GaleriaConstructos'

/**
 * Construto artístico com a nota de que não é registro canônico. Fica no cliente porque a lista de
 * construtos vem de um módulo 'use client': no servidor ela chegaria como referência, não como array.
 */
export function ConstructoComNota({ codinome }: { codinome: string }) {
  if (!constructosLanternas.some((c) => c.nome === codinome)) return null
  return (
    <>
      <ConstructoDoLanterna nome={codinome} />
      <p className="mt-2 text-center text-xs text-(--oa-muted)">Interpretação artística; não é registro canônico.</p>
    </>
  )
}
