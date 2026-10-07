import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MenuNavegacao, type LinkMenu } from '@/components/MenuNavegacao'
import { lerSessao } from '@/lib/dal'
import { sair } from '@/app/(painel)/actions'

const LINKS_PAINEL: LinkMenu[] = [
  { href: '/painel', rotulo: 'Resumo' },
  { href: '/painel/ocorrencias', rotulo: 'Ocorrências' },
  { href: '/painel/ocorrencias/nova', rotulo: 'Registrar ocorrência' },
]

/** Casca da Central de Comando. Lê a sessão só para mostrar o nome: a proteção fica nas páginas. */
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao() // [AUTH-10]
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row">
      <aside className="border-b p-4 md:w-64 md:border-r md:border-b-0">
        <Link href="/" className="font-semibold text-primary">Central de Oa</Link>
        {sessao && (
          <p className="mt-4 text-sm">
            <span className="font-medium">{sessao.nome}</span>
            <span className="block text-muted-foreground">
              {sessao.papel === 'guardiao' ? 'Guardião' : `Lanterna · Setor ${sessao.setorId}`}
            </span>
          </p>
        )}
        <div className="mt-4">
          <MenuNavegacao links={LINKS_PAINEL} orientacao="vertical" />
        </div>
        <form action={sair} className="mt-6"> {/* [AUTH-09] funciona sem JavaScript */}
          <Button type="submit" variant="outline" className="w-full">Sair</Button>
        </form>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  )
}
