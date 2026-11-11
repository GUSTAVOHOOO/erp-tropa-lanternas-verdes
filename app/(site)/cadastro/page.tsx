import type { Metadata } from 'next'
import Link from 'next/link'
import { EmblemaOa } from '@/components/oanet/EmblemaOa'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { BateriaOa } from '@/components/oanet/ConstructosOa'
import { EstadoVazio } from '@/components/EstadoVazio'
import { listarSetores } from '@/lib/setores'
import type { Setor } from '@/lib/schemas/setor'
import { FormCadastro } from '@/app/(site)/cadastro/_components/FormCadastro'

export const metadata: Metadata = { title: 'Cadastrar | Central de Oa' }

export default async function CadastroPage() {
  let setores: Setor[] | null = null
  let falhaAoCarregar = false

  try {
    setores = await listarSetores()
  } catch {
    falhaAoCarregar = true
  }

  return (
    <MolduraOa className="oa-access-panel">
      <div className="oa-access-art">
        <BateriaOa className="oa-access-battery" />
        <span aria-hidden="true">UMA VONTADE INABALÁVEL.</span>
      </div>
      <div className="oa-access-form">
        <EmblemaOa className="oa-access-emblem" />
        <h1 className="font-heading text-3xl leading-tight font-semibold">
          Criar conta na Central
        </h1>
        <p>Novas contas entram como Lanterna; um Guardião vincula a sua ficha.</p>

        {falhaAoCarregar ? (
          <EstadoVazio
            titulo="Não foi possível carregar os setores"
            descricao="Não foi possível falar com a Central de Oa. Tente novamente."
            acao={{ href: '/cadastro', rotulo: 'Tentar de novo' }}
          />
        ) : !setores || setores.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum setor disponível para cadastro"
            descricao="Não há setores disponíveis no momento. Tente novamente mais tarde."
          />
        ) : (
          <FormCadastro setores={setores} />
        )}

        <Link href="/login" className="oa-text-action">
          Já tenho conta
        </Link>
      </div>
    </MolduraOa>
  )
}
