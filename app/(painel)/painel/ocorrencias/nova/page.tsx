import type { Metadata } from 'next'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { verificarSessao } from '@/lib/dal'
import { listarSetores } from '@/lib/setores'
import { FormOcorrencia } from '@/app/(painel)/painel/ocorrencias/_components/FormOcorrencia'

export const metadata: Metadata = { title: 'Registrar ocorrência | Central de Comando' }

export default async function NovaOcorrenciaPage() {
  const sessao = await verificarSessao() // [AUTH-04]
  const setores = sessao.papel === 'guardiao' ? await listarSetores() : []
  return (
    <section className="grid max-w-xl gap-6">
      <LinkVoltar href="/painel/ocorrencias">Voltar à lista</LinkVoltar>
      <CabecalhoPagina
        titulo="Registrar ocorrência"
        descricao={sessao.papel === 'lanterna' ? `A ocorrência será registrada no Setor ${sessao.setorId}.` : undefined}
      />
      <FormOcorrencia setores={setores} setorFixo={sessao.papel === 'lanterna' ? sessao.setorId : null} />
    </section>
  )
}
