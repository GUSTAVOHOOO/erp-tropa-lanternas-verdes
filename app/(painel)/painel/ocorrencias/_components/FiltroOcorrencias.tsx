'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CampoSelect } from '@/components/CampoSelect'
import { CampoTexto } from '@/components/CampoTexto'
import { Label } from '@/components/ui/label'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { rotuloGravidade, rotuloStatus } from '@/lib/schemas/ocorrencia'
import type { LanternaLista } from '@/lib/schemas/lanterna'
import type { Setor } from '@/lib/schemas/setor'

const TODOS = 'todos'

const itensOrdenar: Record<string, string> = {
  [TODOS]: 'Padrão',
  prazo: 'Prazo',
  criadaEm: 'Registro',
  gravidade: 'Gravidade',
}

const itensOrdem: Record<string, string> = {
  [TODOS]: 'Padrão',
  asc: 'Crescente',
  desc: 'Decrescente',
}

type FiltroOcorrenciasProps = {
  setores?: Setor[]
  lanternas?: LanternaLista[]
}

type FormBusca = {
  busca: string
}

/** Filtros da lista de ocorrências sincronizados com a URL. [ROTA-13][ROTA-14] */
export function FiltroOcorrencias({ setores = [], lanternas = [] }: FiltroOcorrenciasProps) {
  const searchParams = useSearchParams() // [ROTA-13]
  const router = useRouter()
  const pathname = usePathname()

  const buscaNaUrl = searchParams.get('busca') ?? ''
  const statusNaUrl = searchParams.get('status')
  const gravidadeNaUrl = searchParams.get('gravidade')
  const setorNaUrl = searchParams.get('setor')
  const responsavelNaUrl = searchParams.get('responsavel')
  const vencidaNaUrl = searchParams.get('vencida')
  const ordenarNaUrl = searchParams.get('ordenar')
  const ordemNaUrl = searchParams.get('ordem')

  const { register, handleSubmit, reset } = useForm<FormBusca>({
    defaultValues: { busca: buscaNaUrl },
  })

  useEffect(() => {
    reset({ busca: buscaNaUrl })
  }, [buscaNaUrl, reset])

  function mudarFiltro(chave: string, valor: string | null) {
    const novos = new URLSearchParams(searchParams)
    novos.delete('pagina') // [ROTA-14] mudar filtro remove pagina

    if (valor === null || valor === '' || valor === TODOS) {
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

  const itensStatus: Record<string, string> = {
    [TODOS]: 'Todos os status',
    ...rotuloStatus,
  }

  const itensGravidade: Record<string, string> = {
    [TODOS]: 'Todas as gravidades',
    ...rotuloGravidade,
  }

  const itensSetor: Record<string, string> = {
    [TODOS]: 'Todos os setores',
    ...Object.fromEntries(setores.map((s) => [String(s.id), `Setor ${s.id} · ${s.nome}`])),
  }

  const itensResponsavel: Record<string, string> = {
    [TODOS]: 'Todos os responsáveis',
    ...Object.fromEntries(lanternas.map((l) => [l.id, l.codinome])),
  }

  const valorStatus = statusNaUrl && Object.hasOwn(itensStatus, statusNaUrl) ? statusNaUrl : TODOS
  const valorGravidade = gravidadeNaUrl && Object.hasOwn(itensGravidade, gravidadeNaUrl) ? gravidadeNaUrl : TODOS
  const valorSetor = setorNaUrl && Object.hasOwn(itensSetor, setorNaUrl) ? setorNaUrl : TODOS
  const valorResponsavel = responsavelNaUrl && Object.hasOwn(itensResponsavel, responsavelNaUrl) ? responsavelNaUrl : TODOS
  const valorOrdenar = ordenarNaUrl && Object.hasOwn(itensOrdenar, ordenarNaUrl) ? ordenarNaUrl : TODOS
  const valorOrdem = ordemNaUrl && Object.hasOwn(itensOrdem, ordemNaUrl) ? ordemNaUrl : TODOS

  const temFiltro = Boolean(
    searchParams.get('busca') ||
    (statusNaUrl && statusNaUrl !== TODOS) ||
    (gravidadeNaUrl && gravidadeNaUrl !== TODOS) ||
    (setorNaUrl && setorNaUrl !== TODOS) ||
    (responsavelNaUrl && responsavelNaUrl !== TODOS) ||
    vencidaNaUrl === 'true' ||
    (ordenarNaUrl && ordenarNaUrl !== TODOS) ||
    (ordemNaUrl && ordemNaUrl !== TODOS) ||
    searchParams.get('pagina'),
  )

  return (
    <form onSubmit={handleSubmit(aoSubmeter)} className="grid gap-4" role="search" aria-label="Filtros operacionais">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
        <div>
          <CampoTexto
            id="filtro-busca"
            rotulo="Buscar por título"
            type="search"
            registro={register('busca')}
          />
        </div>
        <div>
          <CampoSelect
            id="filtro-status"
            rotulo="Status"
            itens={itensStatus}
            valor={valorStatus}
            aoMudar={(v) => mudarFiltro('status', v)}
          />
        </div>
        <div>
          <CampoSelect
            id="filtro-gravidade"
            rotulo="Gravidade"
            itens={itensGravidade}
            valor={valorGravidade}
            aoMudar={(v) => mudarFiltro('gravidade', v)}
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
        <div>
          <CampoSelect
            id="filtro-responsavel"
            rotulo="Responsável"
            itens={itensResponsavel}
            valor={valorResponsavel}
            aoMudar={(v) => mudarFiltro('responsavel', v)}
          />
        </div>
        <div>
          <CampoSelect
            id="filtro-ordenar"
            rotulo="Ordenar"
            itens={itensOrdenar}
            valor={valorOrdenar}
            aoMudar={(v) => mudarFiltro('ordenar', v)}
          />
        </div>
        <div>
          <CampoSelect
            id="filtro-ordem"
            rotulo="Ordem"
            itens={itensOrdem}
            valor={valorOrdem}
            aoMudar={(v) => mudarFiltro('ordem', v)}
          />
        </div>
        <div className="oa-field oa-field--inline">
          <input
            id="filtro-vencida"
            type="checkbox"
            checked={vencidaNaUrl === 'true'}
            onChange={(e) => mudarFiltro('vencida', e.target.checked ? 'true' : null)}
            className="oa-checkbox"
          />
          <Label htmlFor="filtro-vencida">Somente vencidas</Label>
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
