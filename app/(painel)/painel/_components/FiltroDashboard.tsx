'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CampoSelect } from '@/components/CampoSelect'
import { DIAS_PADRAO } from '@/lib/schemas/dashboard'
import type { Setor } from '@/lib/schemas/setor'

const TODOS = 'todos'

const itensDias: Record<string, string> = {
  '7': '7 dias',
  '30': '30 dias',
  '90': '90 dias',
}

type FiltroDashboardProps = {
  setores?: Setor[]
}

/**
 * Seletor de período e setor sincronizados com a URL. [ROTA-13][ROTA-14]
 * Preserva parâmetros existentes ao mudar filtro.
 */
export function FiltroDashboard({ setores = [] }: FiltroDashboardProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const diasNaUrl = searchParams.get('dias')
  const setorNaUrl = searchParams.get('setor')

  const valorDias = diasNaUrl && Object.hasOwn(itensDias, diasNaUrl) ? diasNaUrl : String(DIAS_PADRAO)

  const itensSetor: Record<string, string> = {
    [TODOS]: 'Todos os setores',
    ...Object.fromEntries(setores.map((s) => [String(s.id), `Setor ${s.id} · ${s.nome}`])),
  }

  const valorSetor = setorNaUrl && Object.hasOwn(itensSetor, setorNaUrl) ? setorNaUrl : TODOS

  function mudarFiltro(chave: 'dias' | 'setor', valor: string | null) {
    const novos = new URLSearchParams(searchParams.toString())

    if (chave === 'dias') {
      if (!valor) {
        novos.delete('dias')
      } else {
        novos.set('dias', valor)
      }
    } else if (chave === 'setor') {
      if (!valor || valor === TODOS) {
        novos.delete('setor')
      } else {
        novos.set('setor', valor)
      }
    }

    const qs = novos.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
      <div>
        <CampoSelect
          id="filtro-periodo"
          rotulo="Período"
          itens={itensDias}
          valor={valorDias}
          aoMudar={(v) => mudarFiltro('dias', v)}
        />
      </div>
      {setores.length > 0 && (
        <div>
          <CampoSelect
            id="filtro-setor"
            rotulo="Setor"
            itens={itensSetor}
            valor={valorSetor}
            aoMudar={(v) => mudarFiltro('setor', v)}
          />
        </div>
      )}
    </div>
  )
}
