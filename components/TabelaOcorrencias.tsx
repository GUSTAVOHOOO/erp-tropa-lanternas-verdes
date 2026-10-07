import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import type { Ocorrencia } from '@/lib/schemas/ocorrencia'

type TabelaOcorrenciasProps = {
  ocorrencias: Ocorrencia[]
  nomeSetor: Record<string, string>
  nomeLanterna: Record<string, string>
}

/** Tabela de ocorrências usada no resumo e na lista do painel. */
export function TabelaOcorrencias({ ocorrencias, nomeSetor, nomeLanterna }: TabelaOcorrenciasProps) { // [COMP-03]
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ocorrência</TableHead>
          <TableHead>Setor</TableHead>
          <TableHead>Gravidade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Responsável</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ocorrencias.map((o) => (
          <TableRow key={o.id} /* [COMP-13] */>
            <TableCell className="min-w-56">
              <Link href={`/painel/ocorrencias/${o.id}`} className="font-semibold text-foreground underline-offset-4 hover:underline"> {/* [ROTA-16] */}
                {o.titulo}
              </Link>
              <span className="block text-sm text-muted-foreground">{o.planeta}</span>
            </TableCell>
            <TableCell /* [CSS-13] */ className="font-mono text-xs whitespace-nowrap text-muted-foreground">{nomeSetor[o.setorId] ?? o.setorId}</TableCell>
            <TableCell><BadgeGravidade gravidade={o.gravidade} /></TableCell>
            <TableCell><BadgeStatus status={o.status} /></TableCell>
            <TableCell className="whitespace-nowrap">
              {(o.responsavelId && nomeLanterna[o.responsavelId]) || <span className="text-texto-terciario">Sem responsável</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
