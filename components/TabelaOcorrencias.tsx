import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { IconeOa } from '@/components/oanet/IconeOa'
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
            <TableCell>
              <Link href={`/painel/ocorrencias/${o.id}`} className="oa-record-link"> {/* [ROTA-16] */}
                <strong>{o.titulo}</strong>
              </Link>
              <small>{o.planeta}</small>
            </TableCell>
            <TableCell /* [CSS-13] */>
              <span className="oa-sector-label">
                <IconeOa nome="setores" />
                {nomeSetor[o.setorId] ?? o.setorId}
              </span>
            </TableCell>
            <TableCell><BadgeGravidade gravidade={o.gravidade} /></TableCell>
            <TableCell><BadgeStatus status={o.status} /></TableCell>
            <TableCell>
              {(o.responsavelId && nomeLanterna[o.responsavelId]) || <span className="text-(--oa-muted)">Sem responsável</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
