import Link from 'next/link'
import { CascaOa } from '@/components/oanet/CascaOa'
import { FormSairOa } from '@/components/oanet/FormSairOa'
import { identidadeDaSessao } from '@/components/oanet/identidade'
import { linksDoSite } from '@/components/oanet/navegacao'
import { lerSessao } from '@/lib/dal'

/**
 * Casca da área pública (OANET, D28): fica montada entre as páginas; o conteúdo vem do servidor.
 * Lê a sessão só para exibir quem navega; sem sessão válida, é visitante. A proteção fica no painel.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao() // [AUTH-10]
  return (
    <CascaOa
      links={linksDoSite(Boolean(sessao))}
      rotuloNavegacao="Navegação principal"
      identidade={identidadeDaSessao(sessao)}
      rodapeNavegacao={sessao ? <FormSairOa /> : undefined}
      rodape={
        <>
          <Link href="/design-system" className="underline-offset-4 hover:underline">Design system</Link> {/* [DEC-12] */}
          {' · '}Tropa dos Lanternas Verdes · trabalho acadêmico de Desenvolvimento Web
        </>
      }
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </CascaOa>
  )
}
