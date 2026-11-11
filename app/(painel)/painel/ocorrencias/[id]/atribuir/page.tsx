import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { LinkVoltar } from '@/components/LinkVoltar'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { exigirPapel } from '@/lib/dal'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { listarTodosLanternas } from '@/lib/lanternas'
import { buscarOcorrencia } from '@/lib/ocorrencias'
import { acoesPermitidas } from '@/lib/permissoes-ocorrencia'
import type { LanternaLista } from '@/lib/schemas/lanterna'
import { FormAtribuir } from '@/app/(painel)/painel/ocorrencias/_components/FormAtribuir'

export const metadata: Metadata = { title: 'Atribuir responsável | Central de Comando' }

type AtribuirPageProps = { params: Promise<{ id: string }> }

/** Só Guardião. Designa lanterna responsável ou libera ocorrência aberta. [AUTH-06][ROTA-10] */
export default async function AtribuirPage({ params }: AtribuirPageProps) {
  const sessao = await exigirPapel('guardiao') // [AUTH-06]
  const { id } = await params // [ROTA-10]
  let ocorrencia
  try {
    ocorrencia = await buscarOcorrencia(id)
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }
  if (!ocorrencia) notFound() // [ROTA-12]

  let lanternas: LanternaLista[] = []
  try {
    lanternas = await listarTodosLanternas({ setor: ocorrencia.setorId })
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }

  const acoes = acoesPermitidas(sessao, ocorrencia)

  return (
    <article className="oa-screen mx-auto grid max-w-xl gap-6">
      <LinkVoltar href={`/painel/ocorrencias/${ocorrencia.id}`}>Voltar à ocorrência</LinkVoltar>
      <CabecalhoPagina titulo="Atribuir responsável" descricao={ocorrencia.titulo} />
      <MolduraOa titulo="Designação de Lanterna" icone="pessoal">
        {lanternas.length === 0 && !acoes.liberar ? (
          <EstadoVazio titulo="Nenhum lanterna neste setor" descricao="Não há lanternas designados no setor desta ocorrência." />
        ) : (
          <FormAtribuir
            ocorrenciaId={ocorrencia.id}
            lanternas={lanternas}
            responsavelAtual={ocorrencia.responsavelId}
            podeLiberar={acoes.liberar}
          />
        )}
      </MolduraOa>
    </article>
  )
}
