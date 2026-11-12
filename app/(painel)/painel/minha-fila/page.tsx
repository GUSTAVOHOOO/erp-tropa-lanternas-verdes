import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import * as z from 'zod'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { MolduraOa, SeloOa } from '@/components/oanet/PainelOa'
import { Paginacao } from '@/components/Paginacao'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { ApiError } from '@/lib/api-error'
import { exigirPapel } from '@/lib/dal'
import { listarTodosLanternas } from '@/lib/lanternas'
import { listarMinhaFila } from '@/lib/ocorrencias'
import type { Ocorrencia } from '@/lib/schemas/ocorrencia'
import type { Pagina } from '@/lib/schemas/paginacao'
import { listarSetores } from '@/lib/setores'
import { SEM_CACHE } from '@/lib/api'

export const metadata: Metadata = { title: 'Minha fila | Central de Comando' }

type MinhaFilaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const paginaParamSchema = z.coerce.number().int().min(1)

export default async function MinhaFilaPage({ searchParams }: MinhaFilaPageProps) {
  await exigirPapel('lanterna') // [AUTH-06]

  const parametros = await searchParams
  const resultadoPagina = paginaParamSchema.safeParse(parametros.pagina)
  const pagina = resultadoPagina.success ? resultadoPagina.data : 1

  let semVinculo = false
  let resultado: Pagina<Ocorrencia> | null = null
  let erroNaoTratado: unknown = null

  try {
    resultado = await listarMinhaFila(pagina)
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 409 && erro.codigo === 'CONTA_SEM_LANTERNA') {
      semVinculo = true
    } else if (erro instanceof ApiError && erro.status === 403) {
      redirect('/acesso-negado')
    } else {
      erroNaoTratado = erro
    }
  }

  if (erroNaoTratado) {
    throw erroNaoTratado
  }

  const [setores, lanternas] = semVinculo
    ? [[], []]
    : await Promise.all([listarSetores(SEM_CACHE), listarTodosLanternas({}, SEM_CACHE)])

  const total = resultado?.meta.total ?? 0

  return (
    <section className="oa-screen grid gap-6">
      <CabecalhoPagina
        titulo="Minha fila"
        descricao="Ocorrências atribuídas a você, por prazo e gravidade."
      />
      <MolduraOa
        titulo="Ocorrências atribuídas"
        icone="alvo"
        acao={
          resultado ? (
            <SeloOa tom="neutro">
              {total} {total === 1 ? 'ocorrência' : 'ocorrências'}
            </SeloOa>
          ) : undefined
        }
      >
        {semVinculo ? (
          <EstadoVazio
            titulo="Sua conta ainda não tem uma Ficha de Lanterna vinculada"
            descricao="Peça a um Guardião para vincular a sua Ficha; enquanto isso, você pode registrar e comentar ocorrências do seu setor."
            acao={{ href: '/painel/ocorrencias', rotulo: 'Ver ocorrências' }}
          />
        ) : resultado && resultado.itens.length > 0 ? (
          <div className="grid gap-4">
            <TabelaOcorrencias
              ocorrencias={resultado.itens}
              nomeSetor={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
              nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.codinome]))}
            />
            <Paginacao
              pagina={resultado.meta.pagina}
              paginas={resultado.meta.paginas}
              caminho="/painel/minha-fila"
              parametros={{}}
            />
          </div>
        ) : (
          <EstadoVazio
            titulo="Nenhuma ocorrência na sua fila"
            descricao="Você não tem ocorrências pendentes atribuídas no momento."
            acao={{ href: '/painel/ocorrencias', rotulo: 'Ver ocorrências' }}
          />
        )}
      </MolduraOa>
    </section>
  )
}
