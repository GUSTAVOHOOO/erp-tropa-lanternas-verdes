import Link from 'next/link'
import { BookOpenIcon, HouseIcon, LayoutDashboardIcon, UsersIcon } from 'lucide-react'
import { Marca } from '@/components/Marca'
import { MenuNavegacao, type LinkMenu } from '@/components/MenuNavegacao'

const LINKS_SITE: LinkMenu[] = [
  { href: '/', rotulo: 'Início', icone: <HouseIcon aria-hidden /> },
  { href: '/lanternas', rotulo: 'Lanternas', icone: <UsersIcon aria-hidden /> },
  { href: '/sobre', rotulo: 'Sobre', icone: <BookOpenIcon aria-hidden /> },
  { href: '/painel', rotulo: 'Central de Comando', icone: <LayoutDashboardIcon aria-hidden /> },
]

/** Casca da área pública: header e rodapé ficam montados entre as páginas. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-sidebar-border bg-sidebar"> {/* [ROTA-06] */}
        <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4 p-4 md:items-center"> {/* [CSS-05] */}
          <Marca href="/" />
          <MenuNavegacao links={LINKS_SITE} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:p-8">
          <p className="font-heading text-lg font-semibold text-foreground">No dia mais claro, na noite mais densa.</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/design-system" className="underline-offset-4 hover:text-foreground hover:underline">Design system</Link> {/* [DEC-12] */}
            <span>Tropa dos Lanternas Verdes · trabalho acadêmico de Desenvolvimento Web</span>
          </p>
        </div>
      </footer>
    </>
  )
}
