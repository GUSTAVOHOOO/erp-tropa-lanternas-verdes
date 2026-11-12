import type { Metadata } from 'next'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { verificarSessao } from '@/lib/dal'
import { listarSetores } from '@/lib/setores'
import { FormOcorrencia } from '@/app/(painel)/painel/ocorrencias/_components/FormOcorrencia'
import { SEM_CACHE } from '@/lib/api'

export const metadata: Metadata = { title: 'Registrar ocorrência | Central de Comando' }

export default async function NovaOcorrenciaPage() {
  const sessao = await verificarSessao() // [AUTH-04]
  const ehGuardiao = sessao.papel === 'guardiao'
  const setores = ehGuardiao ? await listarSetores(SEM_CACHE) : []

  return (
    <article className="oa-screen mx-auto grid w-full max-w-2xl gap-6">
      <LinkVoltar href="/painel/ocorrencias">Voltar à lista</LinkVoltar>
      <CabecalhoPagina
        titulo="Registrar ocorrência"
        descricao={ehGuardiao ? undefined : `A ocorrência será registrada no Setor ${sessao.setorId}.`}
      />
      <MolduraOa titulo="Dados da ocorrência" icone="ocorrencias">
        <div className="oa-panel-body">
          <FormOcorrencia setores={setores} exigeSetor={ehGuardiao} />
        </div>
      </MolduraOa>
    </article>
  )
}
