import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EstadoVazio } from '@/components/EstadoVazio'
import { exigirPapel } from '@/lib/dal'
import { listarLanternas } from '@/lib/lanternas'
import { buscarOcorrencia } from '@/lib/ocorrencias'
import { FormAtribuir } from '@/app/(painel)/painel/ocorrencias/_components/FormAtribuir'

export const metadata: Metadata = { title: 'Atribuir responsável | Central de Comando' }

type AtribuirPageProps = { params: Promise<{ id: string }> }

/** Só Guardião. Um Lanterna que digitar esta URL vai para /acesso-negado. */
export default async function AtribuirPage({ params }: AtribuirPageProps) {
  await exigirPapel('guardiao') // [AUTH-06]
  const { id } = await params // [ROTA-10]
  const ocorrencia = await buscarOcorrencia(id)
  if (!ocorrencia) notFound() // [ROTA-12]
  const lanternas = await listarLanternas({ setorId: ocorrencia.setorId })

  return (
    <section className="max-w-xl">
      <Link href={`/painel/ocorrencias/${ocorrencia.id}`} className="text-sm text-primary hover:underline">← Voltar à ocorrência</Link>
      <h1 className="mt-4 text-2xl font-semibold">Atribuir responsável</h1>
      <p className="mt-1 text-muted-foreground">{ocorrencia.titulo}</p>
      {lanternas.length === 0 ? (
        <EstadoVazio titulo="Nenhum lanterna neste setor" descricao="Não há lanternas designados no setor desta ocorrência." />
      ) : (
        <FormAtribuir ocorrenciaId={ocorrencia.id} lanternas={lanternas} responsavelAtual={ocorrencia.responsavelId} />
      )}
    </section>
  )
}
