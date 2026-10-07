import Link from 'next/link'
import { InboxIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

type EstadoVazioProps = {
  titulo: string
  descricao: string
  acao?: { href: string; rotulo: string }
}

/** Estado "deu certo, mas não há dados": explica e oferece uma saída. */
export function EstadoVazio({ titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center"> {/* [API-09] */}
      <InboxIcon aria-hidden className="size-6 text-texto-terciario" />
      <div className="grid gap-1">
        <p className="font-semibold">{titulo}</p>
        <p className="max-w-prose text-sm text-muted-foreground">{descricao}</p>
      </div>
      {acao && (
        <Link href={acao.href} className={buttonVariants({ variant: 'outline' })}>
          {acao.rotulo}
        </Link>
      )}
    </div>
  )
}
