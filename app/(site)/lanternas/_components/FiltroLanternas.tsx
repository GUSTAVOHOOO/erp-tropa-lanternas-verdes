'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CampoTexto } from '@/components/CampoTexto'
import { CampoSelect } from '@/components/CampoSelect'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { rotuloStatusLanterna } from '@/lib/schemas/lanterna'
import type { Setor } from '@/lib/schemas/setor'

const TODOS = 'todos'

const itensStatus: Record<string, string> = {
  [TODOS]: 'Todos',
  ...rotuloStatusLanterna,
}

const itensOrdenar: Record<string, string> = {
  codinome: 'Codinome',
  setor: 'Setor',
  anoIngresso: 'Ano de ingresso',
}

const itensOrdem: Record<string, string> = {
  asc: 'Crescente',
  desc: 'Decrescente',
}

type FiltroLanternasProps = {
  setores: Setor[]
}

type FormBusca = {
  busca: string
}

/** Filtros de busca, status, setor, ordenação e ordem com sincronização pela URL. [ROTA-13][ROTA-14] */
export function FiltroLanternas({ setores }: FiltroLanternasProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const buscaNaUrl = searchParams.get('busca') ?? ''
  const statusNaUrl = searchParams.get('status')
  const setorNaUrl = searchParams.get('setor')
  const ordenarNaUrl = searchParams.get('ordenar')
  const ordemNaUrl = searchParams.get('ordem')

  const { register, handleSubmit, reset } = useForm<FormBusca>({
    defaultValues: { busca: buscaNaUrl },
  })

  useEffect(() => {
    reset({ busca: buscaNaUrl })
  }, [buscaNaUrl, reset])

  const itensSetor: Record<string, string> = {
    [TODOS]: 'Todos',
    ...Object.fromEntries(setores.map((s) => [String(s.id), `Setor ${s.id} · ${s.nome}`])),
  }

  function mudarFiltro(chave: string, valor: string | null, valorPadrao?: string) {
    const novos = new URLSearchParams(searchParams)
    novos.delete('pagina') // [ROTA-14] mudar filtro remove pagina

    if (!valor || valor === TODOS || valor === valorPadrao) {
      novos.delete(chave)
    } else {
      novos.set(chave, valor)
    }

    const qs = novos.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function aoSubmeter(dados: FormBusca) {
    const novos = new URLSearchParams(searchParams)
    novos.delete('pagina')

    // O texto vai como digitado, sem normalizar
    if (dados.busca && dados.busca.length > 0) {
      novos.set('busca', dados.busca)
    } else {
      novos.delete('busca')
    }

    const qs = novos.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function limparFiltros() {
    reset({ busca: '' })
    router.push(pathname)
  }

  const valorStatus = statusNaUrl && Object.hasOwn(rotuloStatusLanterna, statusNaUrl) ? statusNaUrl : TODOS
  const valorSetor = setorNaUrl && Object.hasOwn(itensSetor, setorNaUrl) ? setorNaUrl : TODOS
  const valorOrdenar = ordenarNaUrl && Object.hasOwn(itensOrdenar, ordenarNaUrl) ? ordenarNaUrl : 'codinome'
  const valorOrdem = ordemNaUrl && Object.hasOwn(itensOrdem, ordemNaUrl) ? ordemNaUrl : 'asc'

  const temFiltro = Boolean(
    searchParams.get('busca') ||
    (statusNaUrl && statusNaUrl !== TODOS) ||
    (setorNaUrl && setorNaUrl !== TODOS) ||
    (ordenarNaUrl && ordenarNaUrl !== 'codinome') ||
    (ordemNaUrl && ordemNaUrl !== 'asc') ||
    searchParams.get('pagina')
  )

  const registroBusca = {
    ...register('busca'),
    maxLength: 100,
  }

  return (
    <form onSubmit={handleSubmit(aoSubmeter)} className="grid gap-4" role="search" aria-label="Filtros de lanternas">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
        <div className="sm:col-span-2 lg:col-span-1">
          <CampoTexto
            id="filtro-busca"
            rotulo="Buscar por codinome"
            registro={registroBusca}
          />
        </div>
        <div>
          <CampoSelect
            id="filtro-status"
            rotulo="Status"
            itens={itensStatus}
            valor={valorStatus}
            aoMudar={(v) => mudarFiltro('status', v, TODOS)}
          />
        </div>
        <div>
          <CampoSelect
            id="filtro-setor"
            rotulo="Setor"
            itens={itensSetor}
            valor={valorSetor}
            aoMudar={(v) => mudarFiltro('setor', v, TODOS)}
          />
        </div>
        <div>
          <CampoSelect
            id="filtro-ordenar"
            rotulo="Ordenar"
            itens={itensOrdenar}
            valor={valorOrdenar}
            aoMudar={(v) => mudarFiltro('ordenar', v, 'codinome')}
          />
        </div>
        <div>
          <CampoSelect
            id="filtro-ordem"
            rotulo="Ordem"
            itens={itensOrdem}
            valor={valorOrdem}
            aoMudar={(v) => mudarFiltro('ordem', v, 'asc')}
          />
        </div>
      </div>
      <div className="oa-button-row justify-end">
        <BotaoOa type="submit" tom="energia">
          Buscar
        </BotaoOa>
        {temFiltro && (
          <BotaoOa type="button" tom="linha" onClick={limparFiltros}>
            Limpar
          </BotaoOa>
        )}
      </div>
    </form>
  )
}
