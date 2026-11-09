import { CascaOa, type LinkCascaOa } from '@/components/oanet/CascaOa'
import { IconeOa } from '@/components/oanet/IconeOa'
import { lerSessao } from '@/lib/dal'
import { sair } from '@/app/(painel)/actions'

const LINKS_PAINEL: LinkCascaOa[] = [
  { href: '/painel', nome: 'Resumo', icone: 'painel', codigo: '01' },
  { href: '/painel/ocorrencias', nome: 'Ocorrências', icone: 'ocorrencias', codigo: '02' },
  { href: '/painel/ocorrencias/nova', nome: 'Registrar ocorrência', icone: 'mais', codigo: '03' },
]

/** Casca da Central de Comando. Lê a sessão só para mostrar a identidade: a proteção fica nas páginas. */
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao() // [AUTH-10]
  const identidade = sessao
    ? {
        titulo: sessao.nome,
        detalhe: sessao.papel === 'guardiao' ? 'Guardião · todos os setores' : `Lanterna · Setor ${sessao.setorId}`,
      }
    : { titulo: 'Central de Comando', detalhe: 'Sessão não identificada' }
  return (
    <CascaOa
      links={LINKS_PAINEL}
      rotuloNavegacao="Navegação da Central de Comando"
      identidade={identidade}
      rodapeNavegacao={
        <form action={sair} className="oa-back-form"> {/* [AUTH-09] funciona sem JavaScript */}
          <button type="submit" className="oa-back-link oa-back-button">
            <IconeOa nome="sair" />
            Sair
          </button>
        </form>
      }
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </CascaOa>
  )
}
