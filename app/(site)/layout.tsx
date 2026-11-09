import Link from 'next/link'
import { CascaOa, type LinkCascaOa } from '@/components/oanet/CascaOa'

const LINKS_SITE: LinkCascaOa[] = [
  { href: '/', nome: 'Início', icone: 'painel', codigo: '01' },
  { href: '/lanternas', nome: 'Lanternas', icone: 'pessoal', codigo: '02' },
  { href: '/sobre', nome: 'Sobre', icone: 'escudo', codigo: '03' },
  { href: '/painel', nome: 'Central de Comando', icone: 'setores', codigo: '04' },
]

/** Casca da área pública (OANET, D28): fica montada entre as páginas; o conteúdo vem do servidor. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CascaOa
      links={LINKS_SITE}
      rotuloNavegacao="Navegação principal"
      identidade={{ titulo: 'Central de Oa', detalhe: 'Portal público' }}
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
