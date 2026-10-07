'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CampoSelect } from '@/components/CampoSelect'
import { normalizarFiltroOcorrencias, parametrosDoFiltro } from '@/lib/filtro-ocorrencias'
import { rotuloGravidade, rotuloStatus } from '@/lib/schemas/ocorrencia'
import type { Setor } from '@/lib/schemas/setor'

const TODOS = 'todos'

type FiltroOcorrenciasProps = { setores: Setor[] }

/** Filtros da lista mantidos na URL. */
export function FiltroOcorrencias({ setores }: FiltroOcorrenciasProps) {
  const params = useSearchParams() // [ROTA-13]
  const router = useRouter()
  const pathname = usePathname()

  function filtrar(chave: 'status' | 'gravidade' | 'setor', valor: string | null) {
    const novos = new URLSearchParams(params)
    if (!valor || valor === TODOS) novos.delete(chave)
    else novos.set(chave, valor)
    router.push(`${pathname}?${novos}`) // [ROTA-14]
  }

  const filtro = normalizarFiltroOcorrencias(parametrosDoFiltro(params), setores.map((s) => s.id))
  const itensStatus = { [TODOS]: 'Todos os status', ...rotuloStatus }
  const itensGravidade = { [TODOS]: 'Todas as gravidades', ...rotuloGravidade }
  const itensSetor = { [TODOS]: 'Todos os setores', ...Object.fromEntries(setores.map((s) => [s.id, s.nome])) }

  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <div className="w-56">
        <CampoSelect id="filtro-status" rotulo="Status" itens={itensStatus} valor={filtro.status && Object.hasOwn(itensStatus, filtro.status) ? filtro.status : TODOS} aoMudar={(v) => filtrar('status', v)} />
      </div>
      <div className="w-56">
        <CampoSelect id="filtro-gravidade" rotulo="Gravidade" itens={itensGravidade} valor={filtro.gravidade && Object.hasOwn(itensGravidade, filtro.gravidade) ? filtro.gravidade : TODOS} aoMudar={(v) => filtrar('gravidade', v)} />
      </div>
      {setores.length > 0 && (
        <div className="w-56">
          <CampoSelect id="filtro-setor" rotulo="Setor" itens={itensSetor} valor={filtro.setor && Object.hasOwn(itensSetor, filtro.setor) ? filtro.setor : TODOS} aoMudar={(v) => filtrar('setor', v)} />
        </div>
      )}
    </div>
  )
}
