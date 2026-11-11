import Link from 'next/link'
import { IconeOa } from '@/components/oanet/IconeOa'

type LinkVoltarProps = {
  href: string
  children: React.ReactNode
}

/** "Voltar" das telas de detalhe e de formulário. [CSS-10][ROTA-16] */
export function LinkVoltar({ href, children }: LinkVoltarProps) {
  return (
    <Link href={href} className="oa-text-action">
      <IconeOa nome="seta" className="-scale-x-100" />
      {children}
    </Link>
  )
}
