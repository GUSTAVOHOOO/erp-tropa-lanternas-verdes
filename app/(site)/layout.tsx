import Link from 'next/link'
import { MenuNavegacao, type LinkMenu } from '@/components/MenuNavegacao'

const LINKS_SITE: LinkMenu[] = [
  { href: '/', rotulo: 'Início' },
  { href: '/lanternas', rotulo: 'Lanternas' },
  { href: '/sobre', rotulo: 'Sobre' },
  { href: '/painel', rotulo: 'Central de Comando' },
]

/** Casca da área pública: header e rodapé ficam montados entre as páginas. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b"> {/* [ROTA-06] */}
        <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4 p-4 md:items-center">
          <Link href="/" className="font-semibold text-primary">Central de Oa</Link>
          <MenuNavegacao links={LINKS_SITE} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        Tropa dos Lanternas Verdes · trabalho acadêmico de Desenvolvimento Web
      </footer>
    </>
  )
}
