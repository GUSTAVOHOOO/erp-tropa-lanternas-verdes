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

/** Tabela de ocorrências usada no resumo e na lista do painel. [COMP-03] */
export function TabelaOcorrencias({ ocorrencias, nomeSetor, nomeLanterna }: TabelaOcorrenciasProps) {
  return (
    <Table className="mt-6">
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Planeta</TableHead>
          <TableHead>Setor</TableHead>
          <TableHead>Gravidade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Responsável</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ocorrencias.map((o) => (
          <TableRow key={o.id}>
            <TableCell>
              <Link href={`/painel/ocorrencias/${o.id}`} className="font-medium text-primary hover:underline">
                {o.titulo}
              </Link>
            </TableCell>
            <TableCell>{o.planeta}</TableCell>
            <TableCell>{nomeSetor[o.setorId] ?? o.setorId}</TableCell>
            <TableCell><BadgeGravidade gravidade={o.gravidade} /></TableCell>
            <TableCell><BadgeStatus status={o.status} /></TableCell>
            <TableCell>{(o.responsavelId && nomeLanterna[o.responsavelId]) || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
