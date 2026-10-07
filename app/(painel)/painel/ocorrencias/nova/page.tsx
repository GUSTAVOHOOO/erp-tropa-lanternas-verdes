import type { Metadata } from 'next'
import Link from 'next/link'
import { verificarSessao } from '@/lib/dal'
import { listarSetores } from '@/lib/setores'
import { FormOcorrencia } from '@/app/(painel)/painel/ocorrencias/_components/FormOcorrencia'

export const metadata: Metadata = { title: 'Registrar ocorrência | Central de Comando' }

export default async function NovaOcorrenciaPage() {
  const sessao = await verificarSessao() // [AUTH-04]
  const setores = sessao.papel === 'guardiao' ? await listarSetores() : []
  return (
    <section className="max-w-2xl">
      <Link href="/painel/ocorrencias" className="text-sm text-primary hover:underline">← Voltar à lista</Link>
      <h1 className="mt-4 text-2xl font-semibold">Registrar ocorrência</h1>
      {sessao.papel === 'lanterna' && (
        <p className="mt-1 text-sm text-muted-foreground">A ocorrência será registrada no Setor {sessao.setorId}.</p>
      )}
      <FormOcorrencia setores={setores} setorFixo={sessao.papel === 'lanterna' ? sessao.setorId : null} />
    </section>
  )
}
