'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { IconeOa } from './IconeOa'
import { formatarAtributoGalaxia, gerarParticulasGalaxia } from './galaxia'

const PARTICULAS = gerarParticulasGalaxia()
const ESTRELAS = gerarParticulasGalaxia(150, 1187)
const SETORES = [
  { id: '2814', nome: 'Terra · Via Láctea', status: 'Patrulha ativa', x: 0.5, y: -0.31 },
  { id: '1187', nome: 'Órbita de Thanagar', status: 'Sinal em observação', x: -0.49, y: -0.33 },
  { id: '7632', nome: 'Fronteira de Oa', status: 'Perímetro estável', x: 0.13, y: 0.72 },
] as const

function observarMovimento(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function movimentoReduzido() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function movimentoNoServidor() {
  return false
}

type GalaxiaProceduralProps = { className?: string; compact?: boolean; efeitosReduzidos?: boolean }

/** Cartografia galáctica desenhada em tempo real, com navegação e seleção de setores. */
export function GalaxiaProcedural({ className = '', compact = false, efeitosReduzidos = false }: GalaxiaProceduralProps) {
  // [COMP-09] Controles da simulação são locais e não alteram os dados do ERP.
  const [zoom, setZoom] = useState(1)
  const [pausada, setPausada] = useState(false)
  const [setorId, setSetorId] = useState<string>('2814')
  const [enquadramento, setEnquadramento] = useState(0)
  const reduzirMovimento = useSyncExternalStore(observarMovimento, movimentoReduzido, movimentoNoServidor)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const anguloRef = useRef(-0.38)
  const ponteiroRef = useRef({ x: 0, y: 0 })
  const setor = SETORES.find((item) => item.id === setorId) ?? SETORES[0]
  const parada = pausada || reduzirMovimento

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const contexto = canvas.getContext('2d')
    if (!contexto) return

    // [CSS-12] O desenho procedural compartilha os tokens semânticos da interface.
    const estilo = getComputedStyle(canvas)
    const cor = (token: string, alternativa: string) => estilo.getPropertyValue(token).trim() || alternativa
    const cores = {
      energia: cor('--oa-energy', 'currentColor'),
      tenue: cor('--oa-energy-dim', 'currentColor'),
      fundo: cor('--oa-ink', 'Canvas'),
      linha: cor('--oa-line', 'currentColor'),
      texto: cor('--oa-text', 'CanvasText'),
      secundario: cor('--oa-muted', 'CanvasText'),
    }

    // Sprites criados por código uma única vez; nenhum arquivo ou imagem externa.
    const criarBrilho = (tinta: string) => {
      const sprite = document.createElement('canvas')
      sprite.width = 64
      sprite.height = 64
      const pincel = sprite.getContext('2d')
      if (pincel) {
        const gradiente = pincel.createRadialGradient(32, 32, 0, 32, 32, 32)
        gradiente.addColorStop(0, tinta)
        gradiente.addColorStop(0.12, tinta)
        gradiente.addColorStop(1, 'transparent')
        pincel.fillStyle = gradiente
        pincel.fillRect(0, 0, 64, 64)
      }
      return sprite
    }
    const halo = criarBrilho(cores.energia)
    const estrela = criarBrilho(cores.texto)
    let largura = 0
    let altura = 0
    let quadro = 0
    let ultimoTempo = 0
    let visivel = true
    let encerrado = false

    const desenhar = () => {
      if (!largura || !altura) return
      const centroX = largura * 0.5 + ponteiroRef.current.x * 8
      const centroY = altura * 0.47 + ponteiroRef.current.y * 5
      const escala = Math.min(largura * 0.44, altura * 0.86) * zoom
      const cosseno = Math.cos(anguloRef.current)
      const seno = Math.sin(anguloRef.current)
      const inclinar = -0.23
      const projetar = (x: number, y: number, z = 0) => {
        const horizontal = (x * cosseno - y * seno) * escala
        const vertical = (x * seno + y * cosseno) * escala * 0.43 - z * escala
        return {
          x: centroX + horizontal * Math.cos(inclinar) - vertical * Math.sin(inclinar),
          y: centroY + horizontal * Math.sin(inclinar) + vertical * Math.cos(inclinar),
        }
      }

      contexto.globalCompositeOperation = 'source-over'
      contexto.globalAlpha = 1
      contexto.fillStyle = cores.fundo
      contexto.fillRect(0, 0, largura, altura)

      // Campo distante, independente do movimento da espiral.
      contexto.fillStyle = cores.texto
      for (let indice = 0; indice < ESTRELAS.length; indice++) {
        const ponto = ESTRELAS[indice]
        const x = ((ponto.fase / (Math.PI * 2) * 7.13) % 1) * largura
        const y = ((ponto.brilho * 13.7) % 1) * altura
        contexto.globalAlpha = ponto.brilho * 0.57
        contexto.fillRect(x, y, indice % 7 === 0 ? 1.6 : 0.8, indice % 7 === 0 ? 1.6 : 0.8)
        if (indice % 31 === 0) {
          contexto.globalAlpha = 0.17
          contexto.fillRect(x - 4, y, 9, 0.5)
          contexto.fillRect(x, y - 4, 0.5, 9)
        }
      }

      contexto.save()
      contexto.translate(centroX, centroY)
      contexto.rotate(inclinar)
      contexto.scale(1, 0.43)
      contexto.globalAlpha = 0.1
      contexto.drawImage(halo, -escala * 1.3, -escala * 1.3, escala * 2.6, escala * 2.6)
      contexto.lineWidth = 0.65
      contexto.strokeStyle = cores.linha
      contexto.globalAlpha = 0.75
      for (const raio of [0.38, 0.7, 1.04, 1.28]) {
        contexto.beginPath()
        contexto.ellipse(0, 0, escala * raio, escala * raio, 0, 0, Math.PI * 2)
        contexto.stroke()
      }
      contexto.setLineDash([3, 12])
      contexto.globalAlpha = 0.6
      for (let indice = 0; indice < 8; indice++) {
        const angulo = indice * Math.PI / 4
        contexto.beginPath()
        contexto.moveTo(Math.cos(angulo) * escala * 0.17, Math.sin(angulo) * escala * 0.17)
        contexto.lineTo(Math.cos(angulo) * escala * 1.3, Math.sin(angulo) * escala * 1.3)
        contexto.stroke()
      }
      contexto.restore()

      contexto.globalCompositeOperation = 'lighter'
      // Uma projeção por partícula e quadro, reutilizada para poeira e ponto luminoso.
      for (let indice = 0; indice < PARTICULAS.length; indice++) {
        const ponto = PARTICULAS[indice]
        const tela = projetar(ponto.x, ponto.y, ponto.z)
        if (ponto.poeira) {
          const tamanho = (4 + ponto.tamanho * 5) * zoom
          contexto.globalAlpha = ponto.brilho * 0.16
          contexto.drawImage(halo, tela.x - tamanho / 2, tela.y - tamanho / 2, tamanho, tamanho)
        } else {
          const tamanho = ponto.tamanho * zoom
          contexto.globalAlpha = ponto.brilho * 0.88
          contexto.fillStyle = indice % 11 === 0 ? cores.texto : cores.energia
          contexto.fillRect(tela.x, tela.y, tamanho, tamanho)
          if (indice % 19 === 0) {
            contexto.globalAlpha = ponto.brilho * 0.65
            contexto.drawImage(estrela, tela.x - tamanho * 5, tela.y - tamanho * 5, tamanho * 10, tamanho * 10)
          }
        }
      }

      // Núcleo emissivo e difração anamórfica.
      contexto.save()
      contexto.translate(centroX, centroY)
      contexto.rotate(inclinar)
      contexto.scale(1, 0.48)
      contexto.globalAlpha = 0.65
      contexto.drawImage(halo, -escala * 0.28, -escala * 0.28, escala * 0.56, escala * 0.56)
      contexto.globalAlpha = 0.9
      contexto.drawImage(estrela, -escala * 0.09, -escala * 0.09, escala * 0.18, escala * 0.18)
      contexto.restore()
      contexto.globalAlpha = 0.23
      contexto.drawImage(halo, centroX - escala * 0.62, centroY - 2, escala * 1.24, 4)
      contexto.globalCompositeOperation = 'source-over'

      for (const item of SETORES) {
        const ponto = projetar(item.x, item.y)
        const selecionado = item.id === setorId
        contexto.strokeStyle = selecionado ? cores.energia : cores.secundario
        contexto.fillStyle = selecionado ? cores.energia : cores.secundario
        contexto.lineWidth = selecionado ? 1.2 : 0.7
        contexto.globalAlpha = selecionado ? 1 : 0.6
        contexto.beginPath()
        contexto.arc(ponto.x, ponto.y, selecionado ? 9 : 3, 0, Math.PI * 2)
        contexto.stroke()
        contexto.fillRect(ponto.x - 1.5, ponto.y - 1.5, 3, 3)
        if (selecionado) {
          contexto.beginPath()
          contexto.arc(ponto.x, ponto.y, 15, -0.2, Math.PI * 1.25)
          contexto.moveTo(ponto.x + 15, ponto.y - 11)
          contexto.lineTo(ponto.x + 40, ponto.y - 34)
          contexto.lineTo(ponto.x + 99, ponto.y - 34)
          contexto.stroke()
          contexto.font = '10px monospace'
          contexto.fillText(`SETOR ${item.id}`, ponto.x + 43, ponto.y - 41)
          contexto.globalAlpha = 0.47
          contexto.font = '8px monospace'
          contexto.fillText('SINAL LOCALIZADO', ponto.x + 43, ponto.y - 21)
        }
      }
      contexto.globalAlpha = 1
    }

    const podeAnimar = () => !encerrado && !parada && visivel && !document.hidden
    const animar = (tempo: number) => {
      if (!podeAnimar()) { quadro = 0; return }
      if (tempo - ultimoTempo >= 1000 / 30) {
        const intervalo = ultimoTempo ? Math.min(tempo - ultimoTempo, 100) : 0
        anguloRef.current += intervalo * 0.000012
        ultimoTempo = tempo
        desenhar()
      }
      quadro = requestAnimationFrame(animar)
    }
    const atualizarAnimacao = () => {
      if (quadro) cancelAnimationFrame(quadro)
      quadro = 0
      ultimoTempo = 0
      if (visivel && !document.hidden) desenhar()
      if (podeAnimar()) quadro = requestAnimationFrame(animar)
    }
    const medir = () => {
      const caixa = canvas.getBoundingClientRect()
      largura = caixa.width
      altura = caixa.height
      const densidade = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(largura * densidade)
      canvas.height = Math.round(altura * densidade)
      contexto.setTransform(densidade, 0, 0, densidade, 0, 0)
      desenhar()
    }
    const moverPonteiro = (evento: PointerEvent) => {
      if (parada) return
      const caixa = canvas.getBoundingClientRect()
      ponteiroRef.current = {
        x: (evento.clientX - caixa.left) / Math.max(1, caixa.width) - 0.5,
        y: (evento.clientY - caixa.top) / Math.max(1, caixa.height) - 0.5,
      }
    }
    const limparPonteiro = () => { ponteiroRef.current = { x: 0, y: 0 } }
    const redimensionamento = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null
    const intersecao = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entrada]) => {
      visivel = entrada.isIntersecting
      atualizarAnimacao()
    }, { threshold: 0.05 }) : null

    medir()
    redimensionamento?.observe(canvas)
    intersecao?.observe(canvas)
    window.addEventListener('resize', medir)
    document.addEventListener('visibilitychange', atualizarAnimacao)
    canvas.addEventListener('pointermove', moverPonteiro)
    canvas.addEventListener('pointerleave', limparPonteiro)
    atualizarAnimacao()

    return () => {
      encerrado = true
      cancelAnimationFrame(quadro)
      redimensionamento?.disconnect()
      intersecao?.disconnect()
      window.removeEventListener('resize', medir)
      document.removeEventListener('visibilitychange', atualizarAnimacao)
      canvas.removeEventListener('pointermove', moverPonteiro)
      canvas.removeEventListener('pointerleave', limparPonteiro)
    }
  }, [zoom, parada, setorId, enquadramento, efeitosReduzidos])

  return (
    <div className={`oa-galaxy ${compact ? 'oa-galaxy--compact' : ''} ${className}`}>
      <svg className="oa-galaxy-fallback text-primary" viewBox="0 0 900 500" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <g transform="translate(450 235) rotate(-13) scale(350 150)" fill="currentColor">
          {[0.4, 0.75, 1.1].map((raio) => <circle key={raio} r={raio} fill="none" stroke="currentColor" strokeWidth="0.002" opacity="0.2" />)}
          {PARTICULAS.filter((_, indice) => indice % 12 === 0).map((ponto, indice) => <circle key={indice} cx={formatarAtributoGalaxia(ponto.x)} cy={formatarAtributoGalaxia(ponto.y)} r={formatarAtributoGalaxia(ponto.tamanho * 0.003)} opacity={formatarAtributoGalaxia(ponto.brilho * 0.8)} />)}
          <circle r="0.045" opacity="0.9" />
        </g>
      </svg>
      <canvas ref={canvasRef} className="oa-galaxy-canvas" role="img" aria-label="Mapa galáctico procedural: quatro braços espirais luminosos e três setores monitorados. Use os controles para ampliar e selecionar um setor." />
      <div className="oa-galaxy-hud"><small>CARTOGRAFIA EM TEMPO REAL</small><strong>Via Láctea</strong><span className="oa-galaxy-legend">✦ ESPAÇO MAPEADO <b>99,8%</b></span></div>
      <div className="oa-galaxy-coordinate" aria-hidden="true"><span>RA 17h 45m 40s</span><span>DEC −29° 00′ 28″</span></div>
      <div className="oa-galaxy-status" aria-live="polite" aria-atomic="true"><small>SETOR {setor.id}</small><strong>{setor.nome}</strong><span>{setor.status}</span></div>
      <div className="oa-galaxy-bottom">
        <div className="oa-galaxy-sectors" role="group" aria-label="Selecionar setor galáctico">
          {SETORES.map((item) => <button key={item.id} type="button" className="oa-galaxy-sector" aria-label={`Selecionar setor ${item.id}`} aria-pressed={setorId === item.id} onClick={() => setSetorId(item.id)}><span aria-hidden="true">⌖</span> {item.id}</button>)}
        </div>
        <div className="oa-galaxy-controls" role="group" aria-label="Controles do mapa galáctico">
          <button type="button" className="oa-galaxy-control" aria-label="Diminuir zoom" title="Diminuir zoom" disabled={zoom <= 0.7} onClick={() => setZoom((valor) => Math.max(0.7, Number((valor - 0.15).toFixed(2))))}><IconeOa nome="menos" /></button>
          <output className="oa-galaxy-zoom" aria-label="Zoom atual">{Math.round(zoom * 100)}%</output>
          <button type="button" className="oa-galaxy-control" aria-label="Aumentar zoom" title="Aumentar zoom" disabled={zoom >= 1.75} onClick={() => setZoom((valor) => Math.min(1.75, Number((valor + 0.15).toFixed(2))))}><IconeOa nome="mais" /></button>
          <button type="button" className="oa-galaxy-control" aria-label={parada ? 'Retomar animação' : 'Pausar animação'} title={reduzirMovimento ? 'Movimento reduzido pelo sistema' : parada ? 'Retomar animação' : 'Pausar animação'} disabled={reduzirMovimento} onClick={() => setPausada((valor) => !valor)}><IconeOa nome={parada ? 'play' : 'pausa'} /></button>
          <button type="button" className="oa-galaxy-control" aria-label="Recentralizar mapa" title="Recentralizar mapa" onClick={() => { setZoom(1); setSetorId('2814'); ponteiroRef.current = { x: 0, y: 0 }; anguloRef.current = -0.38; setEnquadramento((valor) => valor + 1) }}><IconeOa nome="alvo" /></button>
        </div>
      </div>
    </div>
  )
}

export default GalaxiaProcedural
