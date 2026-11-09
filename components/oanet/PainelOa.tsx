'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { IconeOa, type IconeOaNome } from './IconeOa'

/** Moldura técnica com cortes assimétricos e terminais vetoriais. */
export function MolduraOa({ titulo, icone, acao, children, className = '' }: {
  titulo?: string; icone?: IconeOaNome; acao?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <section className={`oa-panel ${className}`}>
      <div className="oa-panel-corners" aria-hidden="true"><i /><i /><i /><i /></div>
      {titulo && <header className="oa-panel-heading"><h2>{icone && <IconeOa nome={icone} />}{titulo}</h2>{acao}</header>}
      <div className="oa-panel-content">{children}</div>
    </section>
  )
}

/** Variante cinematográfica do botão Base UI já utilizado no ERP. */
export function BotaoOa({ className = '', tom = 'energia', children, ...props }: ComponentProps<typeof Button> & { tom?: 'energia' | 'linha' | 'perigo' }) {
  return <Button {...props} variant={tom === 'energia' ? 'default' : 'outline'} className={`oa-button oa-button--${tom} ${className}`}><span className="oa-button-content">{children}</span></Button>
}

/** Estado sempre expresso por texto e símbolo, além da cor. */
export function SeloOa({ children, tom = 'verde' }: { children: ReactNode; tom?: 'verde' | 'ambar' | 'vermelho' | 'azul' | 'neutro' }) {
  return <span className={`oa-badge oa-badge--${tom}`}><span aria-hidden="true" />{children}</span>
}

/** Medidor circular vetorial; o valor permanece disponível em texto. */
export function MedidorOa({ valor, legenda = 'Operacional' }: { valor: number; legenda?: string }) {
  return <div className="oa-gauge"><svg viewBox="0 0 160 160" aria-hidden="true"><circle className="oa-gauge-track" cx="80" cy="80" r="65" /><circle className="oa-gauge-value" cx="80" cy="80" r="65" pathLength="100" strokeDasharray={`${valor} 100`} transform="rotate(-90 80 80)" /><circle className="oa-gauge-inner" cx="80" cy="80" r="56" /><path d="M80 6v12M80 142v12M6 80h12M142 80h12" /></svg><div><strong>{valor}<small>%</small></strong><span>{legenda}</span></div></div>
}

/** Série de atividade com geometria SVG, sem biblioteca de gráficos. */
export function LinhaSinal({ variante = 0 }: { variante?: number }) {
  const valores = [14, 11, 17, 9, 13, 19, 12, 24, 21, 18, 28, 23, 32, 27, 38, 33, 42, 37, 49, 45]
  const pontos = valores.map((n, i) => `${i * 6},${56 - ((n + variante * (i % 4)) % 49)}`).join(' ')
  return <svg className="oa-signal" viewBox="0 0 114 60" preserveAspectRatio="none" aria-hidden="true"><polyline points={pontos} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
}
