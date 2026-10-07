import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { rotuloStatusLanterna, type Lanterna } from '@/lib/schemas/lanterna'

type CartaoLanternaProps = {
  lanterna: Lanterna
  nomeSetor: string
}

/** Cartão de um lanterna na listagem pública: aqui o cartão se justifica, cada lanterna é uma ficha navegável. */
export function CartaoLanterna({ lanterna, nomeSetor }: CartaoLanternaProps) {
  return (
    <Link href={`/lanternas/${lanterna.id}`} className="group block h-full rounded-lg"> {/* [ROTA-16] */}
      <Card className="h-full gap-4 transition-colors duration-150 ease-out group-hover:border-texto-terciario">
        <CardHeader>
          <CardTitle className="font-heading text-2xl leading-none font-bold">{lanterna.nome}</CardTitle> {/* [CSS-13] */}
          <CardDescription>{lanterna.especie} · {lanterna.planetaNatal}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">{nomeSetor}</span>
          <Badge variant="secondary">{rotuloStatusLanterna[lanterna.status]}</Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
