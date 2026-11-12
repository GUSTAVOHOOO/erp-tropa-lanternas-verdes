'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconeOa, type IconeOaNome } from './IconeOa'
import { EmblemaOa } from './EmblemaOa'
import { CidadeOa } from './ConstructosOa'
import { FundoCosmico } from './FundoCosmico'
import { useMovimentoOa } from './useMovimentoOa'

/** Item da navegação da casca. `icone` é um nome (string): o layout é Server Component. */
export type LinkCascaOa = { href: string; nome: string; icone: IconeOaNome; codigo: string }

export type IdentidadeOa = { titulo: string; detalhe: string }

type CascaOaProps = {
  links: LinkCascaOa[]
  /** Quem está usando a casca; vem da sessão ou de um texto público, nunca de dados de demonstração. */
  identidade: IdentidadeOa
  /** Rótulo do `<nav>`; distingue a área pública da privada para leitores de tela. */
  rotuloNavegacao: string
  /** Slot no fim da barra lateral (ex.: formulário de saída renderizado no servidor). */
  rodapeNavegacao?: ReactNode
  /** Conteúdo à direita do rodapé do sistema. */
  rodape?: ReactNode
  children: ReactNode
}

/** Escolhe o link mais específico que corresponde ao caminho (`/painel/ocorrencias/3` → Ocorrências). */
export function linkAtivo(links: LinkCascaOa[], caminho: string): string | null {
  let melhor: string | null = null
  for (const { href } of links) {
    const confere = caminho === href || (href !== '/' && caminho.startsWith(`${href}/`))
    if (confere && (melhor === null || href.length > melhor.length)) melhor = href
  }
  return melhor
}

/**
 * Casca OANET das rotas reais: fundo, navegação por URL, identidade e controles de movimento.
 * Só ela é Client Component; `children` chega pronto do servidor.
 */
export function CascaOa({ links, identidade, rotuloNavegacao, rodapeNavegacao, rodape, children }: CascaOaProps) {
  const raizRef = useRef<HTMLDivElement>(null)
  useMovimentoOa(raizRef)
  const caminho = usePathname() // [ROTA-13]
  const ativo = linkAtivo(links, caminho)
  const [menuAberto, setMenuAberto] = useState(false) // [COMP-09] estado local de interface
  const [modoCalmo, setModoCalmo] = useState(false)
  const [abaOculta, setAbaOculta] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const atualizar = () => setAbaOculta(document.hidden)
    atualizar()
    document.addEventListener('visibilitychange', atualizar)
    return () => document.removeEventListener('visibilitychange', atualizar)
  }, [])

  useEffect(() => {
    if (!menuAberto) return
    navRef.current?.querySelector('a')?.focus()
    function fecharMenu(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMenuAberto(false)
      menuRef.current?.focus()
    }
    window.addEventListener('keydown', fecharMenu)
    return () => window.removeEventListener('keydown', fecharMenu)
  }, [menuAberto])

  return (
    <div ref={raizRef} className={`oa-lab ${modoCalmo ? 'oa-lab--quiet' : ''} ${abaOculta ? 'oa-lab--hidden' : ''}`}>
      <FundoCosmico />
      <a className="oa-skip-link" href="#oa-conteudo">Ir para o conteúdo</a>
      <div className="oa-shell">
        <aside className={`oa-sidebar ${menuAberto ? 'oa-sidebar--open' : ''}`}>
          <div className="oa-brand">
            <EmblemaOa className="oa-brand-emblem" />
            <strong>OANET</strong>
            <span>GREEN LANTERN CORPS</span>
            <small>ADMINISTRATIVE NETWORK</small>
          </div>
          <nav ref={navRef} id="oa-navegacao" className="oa-navigation" aria-label={rotuloNavegacao}>
            {links.map((link) => (
              <Link
                key={link.href} // [COMP-13]
                href={link.href} // [ROTA-16]
                className={ativo === link.href ? 'oa-nav-item oa-nav-item--active' : 'oa-nav-item'}
                aria-current={ativo === link.href ? 'page' : undefined} // [ROTA-17]
                onClick={() => setMenuAberto(false)}
              >
                <IconeOa nome={link.icone} />
                <span>{link.nome}</span>
                <small aria-hidden="true">{link.codigo}</small>
              </Link>
            ))}
          </nav>
          <div className="oa-sidebar-bottom">
            <div className="oa-sidebar-city-frame">
              <CidadeOa className="oa-sidebar-city" />
            </div>
            <p>No dia mais claro.<br />Na noite mais densa.</p>
            <span className="oa-sidebar-coordinate">OA / NÚCLEO CENTRAL</span>
          </div>
          {rodapeNavegacao}
        </aside>
        <div className="oa-workspace">
          <header className="oa-topbar">
            <button
              ref={menuRef}
              type="button"
              className="oa-mobile-menu oa-icon-button"
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-controls="oa-navegacao"
              aria-expanded={menuAberto}
              onClick={() => setMenuAberto(!menuAberto)}
            >
              <IconeOa nome={menuAberto ? 'fechar' : 'menu'} />
            </button>
            <div className="oa-user-emblem"><IconeOa nome="escudo" /></div>
            <div className="oa-user">
              <strong>{identidade.titulo}</strong>
              <span>{identidade.detalhe}</span>
            </div>
            <div className="oa-headquarters"><strong>Tropa dos Lanternas Verdes</strong><span>Sede Central · Oa</span></div>
            <div className="oa-topbar-actions">
              <div className="oa-topbar-globe oa-has-tooltip" role="img" aria-label="Rede OANET: 3.600 setores sob a guarda de Oa">
                <IconeOa nome="setores" />
                <span className="oa-tooltip" aria-hidden="true">Rede OANET: 3.600 setores sob a guarda de Oa</span>
              </div>
              <button
                type="button"
                className="oa-icon-button oa-calm-toggle oa-has-tooltip"
                aria-label="Reduzir efeitos luminosos"
                aria-pressed={modoCalmo}
                aria-describedby="oa-dica-modo-calmo"
                onClick={() => setModoCalmo(!modoCalmo)}
              >
                <IconeOa nome="brilho" />
                <span className="oa-tooltip" role="tooltip" id="oa-dica-modo-calmo">
                  {modoCalmo ? 'Modo calmo ligado: brilho e animações reduzidos' : 'Modo calmo: reduz brilho e animações'}
                </span>
              </button>
            </div>
          </header>
          <main id="oa-conteudo" className="oa-main oa-main--real" tabIndex={-1}>{children}</main>
        </div>
      </div>
      <footer className="oa-system-footer">
        <span><i />OA CENTRAL COMMAND</span>
        <span>{rodape ?? 'Servir, proteger, manter a ordem.'}</span>
        <EmblemaOa className="oa-footer-emblem" />
      </footer>
    </div>
  )
}
