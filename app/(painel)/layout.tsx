import { CirclePlusIcon, LayoutDashboardIcon, ListIcon, LogOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Marca } from '@/components/Marca'
import { MenuNavegacao, type LinkMenu } from '@/components/MenuNavegacao'
import { lerSessao } from '@/lib/dal'
import { sair } from '@/app/(painel)/actions'

const LINKS_PAINEL: LinkMenu[] = [
  { href: '/painel', rotulo: 'Resumo', icone: <LayoutDashboardIcon aria-hidden /> },
  { href: '/painel/ocorrencias', rotulo: 'Ocorrências', icone: <ListIcon aria-hidden /> },
  { href: '/painel/ocorrencias/nova', rotulo: 'Registrar ocorrência', icone: <CirclePlusIcon aria-hidden /> },
]

/** Casca da Central de Comando. Lê a sessão só para mostrar o nome: a proteção fica nas páginas. */
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao() // [AUTH-10]
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-5 border-b border-sidebar-border bg-sidebar p-4 md:sticky md:top-0 md:h-dvh md:w-56 md:shrink-0 md:border-r md:border-b-0">
        <Marca href="/" />
        {sessao && (
          <p className="grid gap-0.5 rounded-md border border-border bg-card p-3 text-sm">
            <span className="font-semibold">{sessao.nome}</span>
            <span className="text-muted-foreground">
              {sessao.papel === 'guardiao' ? 'Guardião · todos os setores' : `Lanterna · Setor ${sessao.setorId}`}
            </span>
          </p>
        )}
        <MenuNavegacao links={LINKS_PAINEL} orientacao="vertical" />
        <form action={sair} className="md:mt-auto"> {/* [AUTH-09] funciona sem JavaScript */}
          <Button type="submit" variant="ghost" className="w-full justify-start">
            <LogOutIcon aria-hidden />
            Sair
          </Button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  )
}
