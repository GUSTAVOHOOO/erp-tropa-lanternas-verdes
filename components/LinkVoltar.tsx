import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

type LinkVoltarProps = {
  href: string
  children: React.ReactNode
}

/** "Voltar" das telas de detalhe e de formulário. [CSS-10][ROTA-16] */
export function LinkVoltar({ href, children }: LinkVoltarProps) {
  return (
    <Link href={href} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground">
      <ArrowLeftIcon aria-hidden className="size-4" />
      {children}
    </Link>
  )
}
