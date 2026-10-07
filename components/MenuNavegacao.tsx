'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId, useState } from 'react'
import { MenuIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LinkMenu = { href: string; rotulo: string }

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
          orientacao === 'horizontal' && 'md:flex-row md:items-center md:gap-4',
        )}
      >
        {links.map((link) => (
          <li key={link.href}> {/* [COMP-13] */}
            <Link
              href={link.href} // [ROTA-16]
              aria-current={atual === link.href ? 'page' : undefined} // [ROTA-17]
              onClick={() => setAberto(false)}
              className="block rounded-md px-2 py-1 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:font-semibold aria-[current=page]:text-primary"
            >
              {link.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
