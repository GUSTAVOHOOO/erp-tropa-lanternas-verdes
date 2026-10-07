import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { rotuloStatusLanterna, type Lanterna } from '@/lib/schemas/lanterna'

type CartaoLanternaProps = {
  lanterna: Lanterna
  nomeSetor: string
}

/** Cartão de um lanterna na listagem pública. */
export function CartaoLanterna({ lanterna, nomeSetor }: CartaoLanternaProps) {
  return (
    <Link href={`/lanternas/${lanterna.id}`} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
      <Card className="h-full transition-colors hover:border-primary">
        <CardHeader>
          <CardTitle>{lanterna.nome}</CardTitle>
          <CardDescription>{lanterna.especie} · {lanterna.planetaNatal}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2 text-sm">
          <span>{nomeSetor}</span>
          <Badge variant="secondary">{rotuloStatusLanterna[lanterna.status]}</Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
