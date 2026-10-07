'use client'

import type { Ref } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type CampoSelectProps = {
  id: string
  rotulo: string
  itens: Record<string, string>
  valor: string | null | undefined
  aoMudar: (valor: string | null) => void
  aoSair?: () => void
  refCampo?: Ref<HTMLButtonElement>
  erro?: string
  placeholder?: string
}

/** Select controlado com label e erro acessível. [FORM-16] */
export function CampoSelect({ id, rotulo, itens, valor, aoMudar, aoSair, refCampo, erro, placeholder = 'Escolha uma opção' }: CampoSelectProps) {
  const idErro = `${id}-erro`
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Select items={itens} value={valor || null} onValueChange={(novo) => aoMudar(novo)}>
        <SelectTrigger
          id={id}
          ref={refCampo}
          onBlur={aoSair}
          aria-invalid={erro ? true : undefined} // [FORM-10]
          aria-describedby={erro ? idErro : undefined}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(itens).map(([valorItem, rotuloItem]) => (
            <SelectItem key={valorItem} value={valorItem}>{rotuloItem}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {erro && <p id={idErro} role="alert" className="text-sm text-destructive">{erro}</p>}
    </div>
  )
}
