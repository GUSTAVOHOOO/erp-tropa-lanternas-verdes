'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { EmblemaOa } from '@/components/oanet/EmblemaOa'
import { FundoCosmico } from '@/components/oanet/FundoCosmico'
import { IconeOa } from '@/components/oanet/IconeOa'
import { useMovimentoOa } from '@/components/oanet/useMovimentoOa'
import { desenharDobra, gerarEstrelasDobra } from './dobra'
import { variaveisMolas } from './mola'
import { PARTES, SLIDES, type Parte } from './slides'

const LARGURA = 1920
const ALTURA = 1080
const DURACAO_DOBRA = 1500
const DURACAO_SAIDA: Record<TipoTransicao, number> = { dobra: 900, feixe: 650 }
const ESTRELAS = gerarEstrelasDobra()
const NUMERAIS: Record<Parte, string> = { 1: 'I', 2: 'II', 3: 'III' }

type TipoTransicao = 'dobra' | 'feixe'
type Transicao = { tipo: TipoTransicao; chave: number; direcao: 1 | -1 }
type Cronometro = { inicio: number | null; acumulado: number }

/** Minutos previstos até o início de cada slide, para comparar com o cronômetro. */
const PREVISTO = SLIDES.reduce<number[]>((lista, slide, i) => [...lista, (lista[i] ?? 0) + slide.minutos], [0])

function poucoMovimento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function lerHash(): number | null {
  const numero = Number.parseInt(window.location.hash.replace('#', ''), 10)
  return Number.isInteger(numero) && numero >= 1 && numero <= SLIDES.length ? numero - 1 : null
}

function relogio(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function campoDeTexto(alvo: EventTarget | null) {
  return alvo instanceof HTMLElement && (alvo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName))
}

/**
 * A apresentação final como uma rota do próprio sistema.
 * Palco fixo de 1920 × 1080 escalado à janela; teclado, toque e hash `#n`.
 */
export function ApresentacaoOa() {
  const raizRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const indiceRef = useRef(0)
  useMovimentoOa(raizRef)

  const [indice, setIndice] = useState(0)
  const [saindo, setSaindo] = useState<number | null>(null)
  const [transicao, setTransicao] = useState<Transicao | null>(null)
  const [notas, setNotas] = useState(false)
  const [visao, setVisao] = useState(false)
  const [ocioso, setOcioso] = useState(false)
  const [cronometro, setCronometro] = useState<Cronometro>({ inicio: null, acumulado: 0 })
  const [agora, setAgora] = useState(0)

  const irPara = useCallback((destino: number, semTransicao = false) => {
    const alvo = Math.min(SLIDES.length - 1, Math.max(0, destino))
    const atual = indiceRef.current
    if (alvo === atual) return
    indiceRef.current = alvo
    window.history.replaceState(null, '', `#${alvo + 1}`)
    setIndice(alvo)
    setVisao(false)
    if (semTransicao || poucoMovimento()) {
      setSaindo(null)
      setTransicao(null)
      return
    }
    setSaindo(atual)
    const tipo: TipoTransicao = SLIDES[alvo].capitulo || SLIDES[atual].capitulo ? 'dobra' : 'feixe'
    setTransicao({ tipo, chave: performance.now(), direcao: alvo > atual ? 1 : -1 })
  }, [])

  const alternarCronometro = useCallback(() => {
    setCronometro((estado) => estado.inicio === null
      ? { ...estado, inicio: performance.now() }
      : { inicio: null, acumulado: estado.acumulado + performance.now() - estado.inicio })
  }, [])

  // Escala do palco e slide inicial vindo do endereço (#n).
  useEffect(() => {
    const raiz = raizRef.current!
    const ajustar = () => {
      raiz.style.setProperty('--dk-escala', String(Math.min(window.innerWidth / LARGURA, window.innerHeight / ALTURA)))
      raiz.dataset.pronto = 'true'
    }
    const seguirHash = () => {
      const destino = lerHash()
      if (destino !== null) irPara(destino, true)
    }
    ajustar()
    seguirHash()
    window.addEventListener('resize', ajustar)
    window.addEventListener('hashchange', seguirHash)
    return () => {
      window.removeEventListener('resize', ajustar)
      window.removeEventListener('hashchange', seguirHash)
    }
  }, [irPara])

  // Teclado: setas, espaço, Home/End, N (notas), O (visão geral), F (tela cheia), T (cronômetro).
  useEffect(() => {
    function tecla(evento: KeyboardEvent) {
      if (evento.ctrlKey || evento.metaKey || evento.altKey || campoDeTexto(evento.target)) return
      const atual = indiceRef.current
      const acoes: Record<string, () => void> = {
        ArrowRight: () => irPara(atual + 1), ArrowDown: () => irPara(atual + 1), PageDown: () => irPara(atual + 1), ' ': () => irPara(atual + 1),
        ArrowLeft: () => irPara(atual - 1), ArrowUp: () => irPara(atual - 1), PageUp: () => irPara(atual - 1), Backspace: () => irPara(atual - 1),
        Home: () => irPara(0), End: () => irPara(SLIDES.length - 1),
        n: () => setNotas((aberto) => !aberto), o: () => setVisao((aberta) => !aberta), Escape: () => setVisao(false),
        t: alternarCronometro,
        f: () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen() },
      }
      const acao = acoes[evento.key.length === 1 ? evento.key.toLowerCase() : evento.key]
      if (!acao) return
      evento.preventDefault()
      acao()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [irPara, alternarCronometro])

  // Os controles somem com o mouse parado, para não poluir o projetor.
  useEffect(() => {
    let espera = 0
    const mexeu = () => {
      setOcioso(false)
      window.clearTimeout(espera)
      espera = window.setTimeout(() => setOcioso(true), 2600)
    }
    mexeu()
    window.addEventListener('pointermove', mexeu)
    return () => {
      window.clearTimeout(espera)
      window.removeEventListener('pointermove', mexeu)
    }
  }, [])

  // O slide que sai fica montado só durante a transição.
  useEffect(() => {
    if (!transicao) return
    const espera = window.setTimeout(() => setSaindo(null), DURACAO_SAIDA[transicao.tipo])
    return () => window.clearTimeout(espera)
  }, [transicao])

  // Dobra espacial: cada quadro é `desenharDobra(t)`, com t = tempo decorrido / duração.
  useEffect(() => {
    if (transicao?.tipo !== 'dobra') return
    const canvas = canvasRef.current
    const contexto = canvas?.getContext('2d')
    if (!canvas || !contexto) return
    const densidade = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(window.innerWidth * densidade)
    canvas.height = Math.round(window.innerHeight * densidade)
    const estilo = getComputedStyle(raizRef.current!)
    const cores = {
      energia: estilo.getPropertyValue('--oa-energy').trim() || '#3cff8a',
      texto: estilo.getPropertyValue('--oa-text').trim() || '#f0fff4',
      fundo: estilo.getPropertyValue('--oa-ink').trim() || '#020805',
    }
    const inicio = performance.now()
    let quadro = 0
    const pintar = (instante: number) => {
      const t = Math.min(1, (instante - inicio) / DURACAO_DOBRA)
      desenharDobra(contexto, t, canvas.width, canvas.height, ESTRELAS, cores)
      if (t < 1) quadro = requestAnimationFrame(pintar)
    }
    quadro = requestAnimationFrame(pintar)
    return () => {
      cancelAnimationFrame(quadro)
      contexto.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [transicao])

  // O cronômetro só redesenha enquanto corre.
  useEffect(() => {
    if (cronometro.inicio === null) return
    const intervalo = window.setInterval(() => setAgora(performance.now()), 500)
    return () => window.clearInterval(intervalo)
  }, [cronometro.inicio])

  // Toque: deslizar para os lados troca de slide.
  const toqueRef = useRef<{ x: number; y: number } | null>(null)
  const inicioToque = (evento: React.PointerEvent) => {
    if (evento.pointerType !== 'mouse') toqueRef.current = { x: evento.clientX, y: evento.clientY }
  }
  const fimToque = (evento: React.PointerEvent) => {
    const toque = toqueRef.current
    toqueRef.current = null
    if (!toque) return
    const dx = evento.clientX - toque.x
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(evento.clientY - toque.y)) irPara(indiceRef.current + (dx < 0 ? 1 : -1))
  }

  const slide = SLIDES[indice]
  const Conteudo = slide.Conteudo
  const Anterior = saindo === null ? null : SLIDES[saindo].Conteudo
  const decorrido = cronometro.acumulado + (cronometro.inicio === null ? 0 : Math.max(agora, cronometro.inicio) - cronometro.inicio)
  const previsto = PREVISTO[indice] * 60_000
  const adiantado = decorrido <= PREVISTO[indice + 1] * 60_000
  const proximo = SLIDES[indice + 1]

  return (
    <div
      ref={raizRef}
      className={`oa-lab dk-deck ${ocioso ? 'dk-deck--ocioso' : ''} ${notas ? 'dk-deck--notas' : ''}`}
      style={variaveisMolas as CSSProperties}
      onPointerDown={inicioToque}
      onPointerUp={fimToque}
    >
      <FundoCosmico />
      <div className="dk-grade-fundo" aria-hidden="true" />
      <p className="dk-sr" aria-live="polite">{`Slide ${indice + 1} de ${SLIDES.length}: ${slide.titulo}`}</p>

      <main className="dk-palco" aria-roledescription="apresentação" aria-label="Apresentação final da Central de Oa">
        <header className="dk-hud dk-hud--topo" aria-hidden="true">
          <span className="dk-hud-marca"><EmblemaOa className="dk-hud-emblema" />OANET<small>briefing final</small></span>
          <span className="dk-hud-parte"><b>PARTE {NUMERAIS[slide.parte]}</b>{PARTES[slide.parte].nome}</span>
          <span className="dk-hud-codigo">SLD <b>{String(indice + 1).padStart(2, '0')}</b> / {SLIDES.length}</span>
        </header>

        {Anterior && (
          <section key={`saindo-${saindo}`} className={`dk-slide dk-slide--saindo dk-slide--${transicao?.tipo ?? 'feixe'}`} data-direcao={transicao?.direcao} aria-hidden="true" inert>
            <Anterior />
          </section>
        )}
        <section
          key={`ativo-${indice}`}
          className={`dk-slide dk-slide--ativo ${transicao ? `dk-slide--${transicao.tipo}` : ''}`}
          data-direcao={transicao?.direcao}
          aria-roledescription="slide"
          aria-label={`${indice + 1} de ${SLIDES.length}: ${slide.titulo}`}
        >
          <Conteudo />
        </section>
        {transicao?.tipo === 'feixe' && <span key={transicao.chave} className="dk-feixe" data-direcao={transicao.direcao} aria-hidden="true" />}

        <footer className="dk-hud dk-hud--base" aria-hidden="true">
          <ol className="dk-progresso">
            {([1, 2, 3] as Parte[]).map((parte) => (
              <li key={parte} className={slide.parte === parte ? 'dk-progresso-parte dk-progresso-parte--ativa' : 'dk-progresso-parte'}>
                <span className="dk-progresso-nome">{NUMERAIS[parte]} · {PARTES[parte].nome}</span>
                <span className="dk-progresso-marcas">
                  {SLIDES.map((s, i) => s.parte === parte && <i key={s.id} className={i < indice ? 'dk-feito' : i === indice ? 'dk-atual' : ''} />)}
                </span>
              </li>
            ))}
          </ol>
        </footer>
      </main>

      <canvas ref={canvasRef} className="dk-dobra" aria-hidden="true" />

      <nav className="dk-controles" aria-label="Controles da apresentação">
        <button type="button" onClick={() => irPara(indice - 1)} disabled={indice === 0} aria-label="Slide anterior"><IconeOa nome="seta" className="dk-girar" /></button>
        <button type="button" onClick={() => irPara(indice + 1)} disabled={indice === SLIDES.length - 1} aria-label="Próximo slide"><IconeOa nome="seta" /></button>
        <button type="button" onClick={() => setNotas(!notas)} aria-pressed={notas} aria-label="Notas do apresentador (N)"><IconeOa nome="comunicacoes" /></button>
        <button type="button" onClick={() => setVisao(true)} aria-label="Visão geral (O)"><IconeOa nome="painel" /></button>
        <button type="button" onClick={alternarCronometro} aria-pressed={cronometro.inicio !== null} aria-label="Cronômetro (T)"><IconeOa nome={cronometro.inicio === null ? 'play' : 'pausa'} /></button>
        <Link href="/" aria-label="Sair da apresentação"><IconeOa nome="sair" /></Link>
      </nav>

      {notas && (
        <aside className="dk-notas" aria-label="Notas do apresentador">
          <div className="dk-notas-cabeca">
            <strong>{slide.titulo}</strong>
            <span>{slide.minutos} min · previsto até aqui {relogio(previsto)}</span>
            <span className={adiantado ? 'dk-no-tempo' : 'dk-atrasado'}>cronômetro {relogio(decorrido)}{cronometro.inicio === null ? ' (T inicia)' : ''}</span>
          </div>
          <p>{slide.notas}</p>
          {proximo && <small>Próximo: {proximo.titulo}</small>}
        </aside>
      )}

      {visao && (
        <div className="dk-visao" role="dialog" aria-modal="true" aria-label="Visão geral dos slides">
          <button type="button" className="dk-visao-fechar" onClick={() => setVisao(false)} aria-label="Fechar visão geral"><IconeOa nome="fechar" /></button>
          {([1, 2, 3] as Parte[]).map((parte) => (
            <section key={parte}>
              <h2>Parte {NUMERAIS[parte]} · {PARTES[parte].nome}</h2>
              <ol>
                {SLIDES.map((s, i) => s.parte === parte && (
                  <li key={s.id}>
                    <button type="button" onClick={() => irPara(i)} aria-current={i === indice ? 'step' : undefined} autoFocus={i === indice}>
                      <b>{String(i + 1).padStart(2, '0')}</b>{s.titulo}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
