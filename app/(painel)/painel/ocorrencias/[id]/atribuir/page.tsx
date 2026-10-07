import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { LinkVoltar } from '@/components/LinkVoltar'
import { exigirPapel } from '@/lib/dal'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { listarLanternas } from '@/lib/lanternas'
import { buscarOcorrencia } from '@/lib/ocorrencias'
import { FormAtribuir } from '@/app/(painel)/painel/ocorrencias/_components/FormAtribuir'

export const metadata: Metadata = { title: 'Atribuir responsável | Central de Comando' }

type AtribuirPageProps = { params: Promise<{ id: string }> }

/** Só Guardião. Um Lanterna que digitar esta URL vai para /acesso-negado. */
export default async function AtribuirPage({ params }: AtribuirPageProps) {
  await exigirPapel('guardiao') // [AUTH-06]
  const { id } = await params // [ROTA-10]
  let ocorrencia
  try {
    ocorrencia = await buscarOcorrencia(id)
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }
  if (!ocorrencia) notFound() // [ROTA-12]
  let lanternas
  try {
    lanternas = await listarLanternas({ setorId: ocorrencia.setorId })
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }

  return (
    <section className="grid max-w-xl gap-6">
      <LinkVoltar href={`/painel/ocorrencias/${ocorrencia.id}`}>Voltar à ocorrência</LinkVoltar>
      <CabecalhoPagina titulo="Atribuir responsável" descricao={ocorrencia.titulo} />
      {lanternas.length === 0 ? (
        <EstadoVazio titulo="Nenhum lanterna neste setor" descricao="Não há lanternas designados no setor desta ocorrência." />
      ) : (
        <FormAtribuir ocorrenciaId={ocorrencia.id} lanternas={lanternas} responsavelAtual={ocorrencia.responsavelId} />
      )}
    </section>
  )
}
