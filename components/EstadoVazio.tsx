import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

type EstadoVazioProps = {
  titulo: string
  descricao: string
  acao?: { href: string; rotulo: string }
}

/** Estado "deu certo, mas não há dados": explica e oferece uma saída. */
export function EstadoVazio({ titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div role="status" className="mt-6 rounded-xl border border-dashed p-8 text-center"> {/* [API-09] */}
      <p className="font-medium">{titulo}</p>
      <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      {acao && (
        <Link href={acao.href} className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
          {acao.rotulo}
        </Link>
      )}
    </div>
  )
}
