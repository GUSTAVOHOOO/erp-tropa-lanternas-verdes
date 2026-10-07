'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CampoSelect } from '@/components/CampoSelect'
import { rotuloStatus } from '@/lib/schemas/ocorrencia'
import type { Setor } from '@/lib/schemas/setor'

const TODOS = 'todos'

type FiltroOcorrenciasProps = { setores: Setor[] }

/** Filtros da lista mantidos na URL. [ROTA-14] */
export function FiltroOcorrencias({ setores }: FiltroOcorrenciasProps) {
  const params = useSearchParams() // [ROTA-13]
  const router = useRouter()
  const pathname = usePathname()

  function filtrar(chave: 'status' | 'setor', valor: string | null) {
    const novos = new URLSearchParams(params)
    if (!valor || valor === TODOS) novos.delete(chave)
    else novos.set(chave, valor)
    router.push(`${pathname}?${novos}`)
  }

  const statusAtual = params.get('status')
  const setorAtual = params.get('setor')
  const itensStatus = { [TODOS]: 'Todos os status', ...rotuloStatus }
  const itensSetor = { [TODOS]: 'Todos os setores', ...Object.fromEntries(setores.map((s) => [s.id, s.nome])) }

  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <div className="w-56">
        <CampoSelect id="filtro-status" rotulo="Status" itens={itensStatus} valor={statusAtual && statusAtual in itensStatus ? statusAtual : TODOS} aoMudar={(v) => filtrar('status', v)} />
      </div>
      {setores.length > 0 && (
        <div className="w-56">
          <CampoSelect id="filtro-setor" rotulo="Setor" itens={itensSetor} valor={setorAtual && setorAtual in itensSetor ? setorAtual : TODOS} aoMudar={(v) => filtrar('setor', v)} />
        </div>
      )}
    </div>
  )
}
