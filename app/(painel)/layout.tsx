import { CascaOa, type LinkCascaOa } from '@/components/oanet/CascaOa'
import { FormSairOa } from '@/components/oanet/FormSairOa'
import { identidadeDaSessao } from '@/components/oanet/identidade'
import { lerSessao } from '@/lib/dal'

const LINKS_PAINEL: LinkCascaOa[] = [
  { href: '/painel', nome: 'Resumo', icone: 'painel', codigo: '01' },
  { href: '/painel/ocorrencias', nome: 'Ocorrências', icone: 'ocorrencias', codigo: '02' },
  { href: '/painel/ocorrencias/nova', nome: 'Registrar ocorrência', icone: 'mais', codigo: '03' },
]

/** Casca da Central de Comando. Lê a sessão só para mostrar a identidade: a proteção fica nas páginas. */
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao() // [AUTH-10]
  return (
    <CascaOa
      links={LINKS_PAINEL}
      rotuloNavegacao="Navegação da Central de Comando"
      identidade={
        sessao ? identidadeDaSessao(sessao) : { titulo: 'Central de Comando', detalhe: 'Sessão não identificada' }
      }
      rodapeNavegacao={sessao ? <FormSairOa /> : undefined}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </CascaOa>
  )
}
