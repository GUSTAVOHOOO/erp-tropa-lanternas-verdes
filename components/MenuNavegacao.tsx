'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId, useState } from 'react'
import { MenuIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** `icone` é um elemento (ex.: <HouseIcon aria-hidden />): o layout é Server Component e não pode passar função para cá. */
export type LinkMenu = { href: string; rotulo: string; icone?: React.ReactNode }

type MenuNavegacaoProps = {
  links: LinkMenu[]
  orientacao?: 'horizontal' | 'vertical'
}

/** Menu com o link da página atual marcado e botão de abrir/fechar no celular. */
export function MenuNavegacao({ links, orientacao = 'horizontal' }: MenuNavegacaoProps) {
  const atual = usePathname() // [ROTA-13]
  const [aberto, setAberto] = useState(false) // [COMP-09] só este componente precisa saber se o menu está aberto
  const idLista = useId()

  return (
    <nav aria-label="Navegação principal">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-expanded={aberto}
        aria-controls={idLista}
        onClick={() => setAberto((estava) => !estava)} // [COMP-10]
      >
        {aberto ? <XIcon aria-hidden /> : <MenuIcon aria-hidden />}
        <span className="sr-only">{aberto ? 'Fechar menu' : 'Abrir menu'}</span>
      </Button>
      <ul
        id={idLista}
        className={cn(
          aberto ? 'flex' : 'hidden',
          'mt-2 flex-col gap-1 md:mt-0 md:flex',
          orientacao === 'horizontal' && 'md:flex-row md:items-center',
        )}
      >
        {links.map((link) => (
          <li key={link.href}> {/* [COMP-13] */}
            <Link
              href={link.href} // [ROTA-16]
              aria-current={atual === link.href ? 'page' : undefined} // [ROTA-17]
              onClick={() => setAberto(false)}
              // [CSS-08][CSS-14][CSS-15] página atual: fundo de superfície + contorno, sem listra lateral
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-secondary hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:text-foreground aria-[current=page]:ring-1 aria-[current=page]:ring-border outline-none focus-visible:shadow-anel [&_svg]:size-4.5 [&_svg]:shrink-0 [&_svg]:text-texto-terciario aria-[current=page]:[&_svg]:text-primary-texto"
            >
              {link.icone}
              {link.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
