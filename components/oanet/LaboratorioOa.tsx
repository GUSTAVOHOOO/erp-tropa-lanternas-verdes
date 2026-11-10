'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { IconeOa, type IconeOaNome } from './IconeOa'
import { EmblemaOa } from './EmblemaOa'
import { CidadeOa } from './ConstructosOa'
import { FundoCosmico } from './FundoCosmico'
import { GaleriaConstructos } from './GaleriaConstructos'
import { BotaoOa } from './PainelOa'
import { CentralOa } from './CentralOa'
import { ComponentesOa } from './ComponentesOa'
import { AcessoOa, LanternasOa, NovaOcorrenciaOa, OcorrenciasOa, PortalOa } from './TelasOa'
import { titulosTela, type TelaOa } from './dados-demo'
import { useMovimentoOa } from './useMovimentoOa'

const links: { tela: TelaOa; nome: string; icone: IconeOaNome; codigo: string }[] = [
  { tela: 'central', nome: 'Visão geral', icone: 'painel', codigo: '01' },
  { tela: 'ocorrencias', nome: 'Ocorrências', icone: 'ocorrencias', codigo: '02' },
  { tela: 'lanternas', nome: 'Lanternas', icone: 'pessoal', codigo: '03' },
  { tela: 'construtos', nome: 'Construtos', icone: 'energia', codigo: '07' },
  { tela: 'componentes', nome: 'Componentes', icone: 'equipamentos', codigo: '04' },
  { tela: 'portal', nome: 'Portal de Oa', icone: 'setores', codigo: '05' },
  { tela: 'acesso', nome: 'Acesso à Central', icone: 'escudo', codigo: '06' },
]

/** Vitrine isolada: navegação e interações locais, sem escrever na API do ERP. */
export function LaboratorioOa() {
  const laboratorioRef = useRef<HTMLDivElement>(null)
  useMovimentoOa(laboratorioRef)
  const [tela, setTela] = useState<TelaOa>('central') // [COMP-09] estado da demonstração visual
  const [menuAberto, setMenuAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [notificacoes, setNotificacoes] = useState(false)
  const [modoCalmo, setModoCalmo] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const [abaOculta, setAbaOculta] = useState(false)
  useEffect(() => {
    const atualizar = () => setAbaOculta(document.hidden)
    atualizar()
    document.addEventListener('visibilitychange', atualizar)
    return () => document.removeEventListener('visibilitychange', atualizar)
  }, [])
  function navegar(destino: TelaOa) {
    setTela(destino)
    setMenuAberto(false)
    setNotificacoes(false)
    mainRef.current?.focus({ preventScroll: true })
  }
  useEffect(() => {
    if (!menuAberto) return
    navRef.current?.querySelector('button')?.focus()
    function fecharMenu(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMenuAberto(false)
      menuRef.current?.focus()
    }
    window.addEventListener('keydown', fecharMenu)
    return () => window.removeEventListener('keydown', fecharMenu)
  }, [menuAberto])
  useEffect(() => { if (!mensagem) return; const timer = window.setTimeout(() => setMensagem(''), 6500); return () => window.clearTimeout(timer) }, [mensagem])
  return <div ref={laboratorioRef} className={`oa-lab ${modoCalmo ? 'oa-lab--quiet' : ''} ${abaOculta ? 'oa-lab--hidden' : ''}`}>
    <FundoCosmico />
    <a className="oa-skip-link" href="#oa-conteudo">Ir para o conteúdo</a>
    <div className="oa-shell">
      <aside className={`oa-sidebar ${menuAberto ? 'oa-sidebar--open' : ''}`}>
        <div className="oa-brand"><EmblemaOa className="oa-brand-emblem" /><strong>OANET</strong><span>GREEN LANTERN CORPS</span><small>ADMINISTRATIVE NETWORK</small></div>
        <nav ref={navRef} id="oa-navegacao" className="oa-navigation" aria-label="Telas do laboratório">{links.map(link => <button key={link.tela} className={tela === link.tela || (tela === 'nova' && link.tela === 'ocorrencias') ? 'oa-nav-item oa-nav-item--active' : 'oa-nav-item'} aria-current={tela === link.tela ? 'page' : undefined} onClick={() => navegar(link.tela)}><IconeOa nome={link.icone} /><span>{link.nome}</span><small aria-hidden="true">{link.codigo}</small></button>)}</nav>
        <div className="oa-sidebar-bottom"><CidadeOa className="oa-sidebar-city" /><p>No dia mais claro.<br />Na noite mais densa.</p><span className="oa-sidebar-coordinate">OA / NÚCLEO CENTRAL</span></div>
        <Link className="oa-back-link" href="/"><IconeOa nome="sair" />Voltar ao sistema atual</Link>
      </aside>
      <div className="oa-workspace">
        <header className="oa-topbar"><button ref={menuRef} className="oa-mobile-menu oa-icon-button" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-controls="oa-navegacao" aria-expanded={menuAberto} onClick={() => setMenuAberto(!menuAberto)}><IconeOa nome={menuAberto ? 'fechar' : 'menu'} /></button><div className="oa-user-emblem"><IconeOa nome="escudo" /></div><div className="oa-user"><strong>Olá, Lanterna Romagnoli</strong><span>Oficial 3ª Classe <i />Setor: <b>2814</b></span></div><span className="oa-live oa-header-status"><i />Online</span><div className="oa-headquarters"><strong>Tropa dos Lanternas Verdes</strong><span>Sede Central · Oa</span></div><div className="oa-topbar-actions"><div className="oa-topbar-globe"><IconeOa nome="setores" /></div><button className="oa-icon-button" aria-label="Notificações" aria-expanded={notificacoes} onClick={() => setNotificacoes(!notificacoes)}><IconeOa nome="sino" /><span className="oa-notification-dot" /></button><button className="oa-icon-button" aria-label="Reduzir efeitos luminosos" aria-pressed={modoCalmo} onClick={() => setModoCalmo(!modoCalmo)}><IconeOa nome="configuracao" /></button></div></header>
        {notificacoes && <section className="oa-notification-tray" aria-label="Notificações da Central"><div><IconeOa nome="verificado" /><strong>Todos os sistemas estão online.</strong></div><p>A rede de patrulha foi sincronizada com a Bateria Central de Oa.</p><button className="oa-text-action" onClick={() => { setNotificacoes(false); navegar('ocorrencias') }}>Consultar ocorrências <IconeOa nome="seta" /></button></section>}
        <main ref={mainRef} id="oa-conteudo" className="oa-main" tabIndex={-1}>
          <div className="oa-page-heading"><div><div className="oa-breadcrumb">OA CENTRAL <span>/</span> {tela === 'componentes' ? 'SISTEMA DE INTERFACE' : 'REDE ADMINISTRATIVA'}</div><h1>{titulosTela[tela]}</h1><p>{tela === 'central' ? 'O universo sob sua proteção.' : tela === 'componentes' ? 'Precisão alienígena. Energia em cada detalhe.' : 'União. Justiça. Proteção.'}</p></div>{tela !== 'acesso' && tela !== 'nova' && tela !== 'portal' && <BotaoOa onClick={() => navegar('nova')}><IconeOa nome="mais" />Nova ocorrência</BotaoOa>}</div>
          {tela === 'central' && <CentralOa navegar={navegar} efeitosReduzidos={modoCalmo} />}
          {tela === 'ocorrencias' && <OcorrenciasOa navegar={navegar} />}
          {tela === 'lanternas' && <LanternasOa />}
          {tela === 'construtos' && <GaleriaConstructos />}
          {tela === 'componentes' && <ComponentesOa notificar={setMensagem} efeitosReduzidos={modoCalmo} abaOculta={abaOculta} />}
          {tela === 'portal' && <PortalOa navegar={navegar} />}
          {tela === 'acesso' && <AcessoOa navegar={navegar} notificar={setMensagem} />}
          {tela === 'nova' && <NovaOcorrenciaOa navegar={navegar} notificar={setMensagem} />}
          <footer className="oa-demo-note"><IconeOa nome="codigo" /><span>Ambiente de demonstração · Dados ilustrativos · Visuais 100% gerados em código</span></footer>
        </main>
      </div>
    </div>
    <footer className="oa-system-footer"><span><i />OA CENTRAL COMMAND <b>{'//'}</b> v.4.0</span><span>Servir, proteger, manter a ordem.</span><EmblemaOa className="oa-footer-emblem" /></footer>
    <div className="oa-toast-region" role="status" aria-live="polite">{mensagem && <div className="oa-toast"><IconeOa nome="verificado" /><span>{mensagem}</span><button className="oa-icon-button" aria-label="Dispensar mensagem" onClick={() => setMensagem('')}><IconeOa nome="fechar" /></button></div>}</div>
  </div>
}
