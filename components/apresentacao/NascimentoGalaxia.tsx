'use client'

import { useEffect, useRef } from 'react'
import './nascimento-galaxia.css'
import {
  DURACAO_NASCIMENTO,
  obterCenaGalaxia,
  pontoFilamento,
  quadroGalaxia,
  type CenaGalaxia,
  type PontoPlano,
  type QuadroGalaxia,
} from './nascimento-galaxia'

/*
 * Camadas pré-renderizadas: névoa dos braços, anéis de estrelas do disco e névoa do campo.
 * São desenhadas uma única vez, em unidades do disco, e depois só são posicionadas e giradas
 * com `transform` e `opacity` a cada quadro (o compositor faz o trabalho, sem repintar).
 */
const PX_POR_UNIDADE = 560
/** Lado de cada camada em unidades do disco (cobre o disco com folga). */
const LADO = 2.4
const LADO_PX = Math.round(PX_POR_UNIDADE * LADO)
const ESPIRAL_A = 0.127
/** Rotação diferencial dos anéis: 0,02/r rad/s em torno do giro global. */
const DIFERENCIAL = 0.02
/** Níveis de alfa usados para agrupar os pontos (cada nível é um preenchimento). */
const NIVEIS_ALFA = 8
/** Brilho máximo de um ponto (ver `brilho` no modelo). */
const ALFA_MAXIMO = 0.85

type Cores = { energia: string; dim: string; texto: string; linha: string; fundo: string }
type Projecao = { e: number; cx: number; cy: number; cI: number; sI: number; k: number }
type Camada = { elemento: HTMLCanvasElement; velocidade: number }
type Camadas = {
  bracoAberto: HTMLCanvasElement
  bracoFechado: HTMLCanvasElement
  aneis: Camada[]
  nevoa: HTMLCanvasElement
}
/** Passo de tempo em que as camadas são repintadas (20 vezes por segundo, em instantes fixos). */
const PASSO_CAMADAS = 0.1
/** Buffers reaproveitados em todos os quadros (sem alocação por quadro). */
type Buffers = {
  sx: Float64Array
  sy: Float64Array
  vis: Uint8Array
  niveis: Int32Array
  contagem: Int32Array
}
type Recursos = {
  largura: number
  altura: number
  halo: HTMLCanvasElement
  estrela: HTMLCanvasElement
  cores: Cores
  cena: CenaGalaxia
  buffers: Buffers
}

function criarBuffers(n: number): Buffers {
  return {
    sx: new Float64Array(n),
    sy: new Float64Array(n),
    vis: new Uint8Array(n),
    niveis: new Int32Array(NIVEIS_ALFA * n),
    contagem: new Int32Array(NIVEIS_ALFA),
  }
}

// Valores de reserva caso os tokens não existam na página.
const CORES_RESERVA: Cores = {
  energia: '#8ff5b5',
  dim: '#3f7d59',
  texto: '#eaf7ee',
  linha: '#2f6b4c',
  fundo: '#050a07',
}

/** Lê as cores dos tokens --oa-* (mesma paleta da identidade OANET). */
function lerCores(elemento: HTMLElement): Cores {
  const estilo = getComputedStyle(elemento)
  const cor = (token: string, reserva: string) => estilo.getPropertyValue(token).trim() || reserva
  return {
    energia: cor('--oa-energy', CORES_RESERVA.energia),
    dim: cor('--oa-energy-dim', CORES_RESERVA.dim),
    texto: cor('--oa-text', CORES_RESERVA.texto),
    linha: cor('--oa-line', CORES_RESERVA.linha),
    fundo: cor('--oa-ink', CORES_RESERVA.fundo),
  }
}

/** Halo radial de 64 px desenhado uma vez; os brilhos são carimbos desse sprite. */
function criarSprite(tinta: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas')
  sprite.width = 64
  sprite.height = 64
  const pincel = sprite.getContext('2d')
  if (pincel) {
    const gradiente = pincel.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradiente.addColorStop(0, tinta)
    gradiente.addColorStop(0.14, tinta)
    gradiente.addColorStop(1, 'transparent')
    pincel.fillStyle = gradiente
    pincel.fillRect(0, 0, 64, 64)
  }
  return sprite
}

/** Gerador determinístico (LCG), só para desenhar as camadas uma vez. */
function sorteador(semente: number) {
  let estado = semente >>> 0
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0
    return estado / 4294967296
  }
}

/** Fundo pré-renderizado: vinheta e campo de estrelas fixo (sem sorteio por quadro). */
function pintarFundo(fundo: HTMLCanvasElement, largura: number, altura: number, dpr: number, cores: Cores) {
  const ctx = fundo.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = cores.fundo
  ctx.fillRect(0, 0, largura, altura)

  const centroX = largura * 0.5
  const centroY = altura * 0.47
  const vinheta = ctx.createRadialGradient(centroX, centroY, 0, centroX, centroY, Math.hypot(largura, altura) * 0.6)
  vinheta.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vinheta.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
  ctx.fillStyle = vinheta
  ctx.fillRect(0, 0, largura, altura)

  const sortear = sorteador(77)
  ctx.fillStyle = cores.texto
  for (let i = 0; i < 180; i++) {
    ctx.globalAlpha = 0.12 + sortear() * 0.4
    const tamanho = 0.4 + sortear() * 0.9
    ctx.fillRect(sortear() * largura, sortear() * altura, tamanho, tamanho)
  }
  ctx.globalAlpha = 1
}

/** Canvas de camada com a transformação de unidades do disco já aplicada. */
function criarCamada(): { elemento: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
  const elemento = document.createElement('canvas')
  elemento.width = LADO_PX
  elemento.height = LADO_PX
  elemento.className = 'dk-galaxia-camada'
  const ctx = elemento.getContext('2d')
  ctx?.setTransform(PX_POR_UNIDADE, 0, 0, PX_POR_UNIDADE, LADO_PX / 2, LADO_PX / 2)
  return { elemento, ctx }
}

/** Névoa e faixa escura de dois braços em espiral logarítmica (b define o enrolamento). */
function desenharBracos(ctx: CanvasRenderingContext2D, cores: Cores, b: number, sorte: () => number) {
  ctx.globalCompositeOperation = 'lighter'
  for (let passada = 0; passada < 2; passada++) {
    // Passada larga e fraca (névoa nebular) e passada nítida (o corpo do braço).
    const escala = passada === 0 ? 2.1 : 1
    const fraco = passada === 0 ? 0.35 : 1
    for (let k = 0; k < 2; k++) {
      for (let r = 0.1; r <= 1.02; r += 0.009) {
        const angulo = Math.log(r / ESPIRAL_A) / b + k * Math.PI
        const x = Math.cos(angulo) * r + (sorte() - 0.5) * 0.03
        const y = Math.sin(angulo) * r + (sorte() - 0.5) * 0.03
        const raio = (0.05 + 0.05 * r) * escala
        const gradiente = ctx.createRadialGradient(x, y, 0, x, y, raio)
        gradiente.addColorStop(0, cores.energia)
        gradiente.addColorStop(1, 'transparent')
        ctx.globalAlpha = (0.14 + 0.1 * sorte()) * fraco
        ctx.fillStyle = gradiente
        ctx.fillRect(x - raio, y - raio, raio * 2, raio * 2)
      }
    }
  }
  ctx.globalAlpha = 1
  // Faixa escura na borda interna de cada braço: apaga a névoa ao longo de uma linha deslocada.
  ctx.globalCompositeOperation = 'destination-out'
  ctx.strokeStyle = '#000'
  ctx.lineCap = 'round'
  ctx.lineWidth = 0.05
  for (let k = 0; k < 2; k++) {
    ctx.beginPath()
    for (let r = 0.2; r <= 1.05; r += 0.01) {
      const angulo = Math.log(r / ESPIRAL_A) / b + k * Math.PI - 0.16
      const x = Math.cos(angulo) * r
      const y = Math.sin(angulo) * r
      if (r < 0.21) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.globalAlpha = 0.85
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

/** Estrelas de fundo de uma faixa de raios; a última camada leva também o halo difuso do disco. */
function desenharAneis(ctx: CanvasRenderingContext2D, cores: Cores, [inicio, fim]: [number, number], quantidade: number, sorte: () => number, halo: boolean) {
  ctx.globalCompositeOperation = 'lighter'
  if (halo) {
    const gradiente = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.2)
    gradiente.addColorStop(0, cores.energia)
    gradiente.addColorStop(1, 'transparent')
    ctx.globalAlpha = 0.1
    ctx.fillStyle = gradiente
    ctx.fillRect(-LADO / 2, -LADO / 2, LADO, LADO)
  }
  for (let i = 0; i < quantidade; i++) {
    const r = Math.sqrt(inicio * inicio + sorte() * (fim * fim - inicio * inicio))
    const angulo = sorte() * Math.PI * 2
    const x = Math.cos(angulo) * r
    const y = Math.sin(angulo) * r
    // Meia-largura em unidades do disco: no palco (≈1000 px por unidade) dá pontos de 2 a 5 px.
    const tamanho = 0.0011 + sorte() * 0.0014
    ctx.globalAlpha = 0.25 + 0.65 * sorte()
    ctx.fillStyle = sorte() < 0.2 ? cores.texto : cores.energia
    ctx.fillRect(x - tamanho, y - tamanho, tamanho * 2, tamanho * 2)
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

/** Névoa do campo primordial: manchas suaves no plano; três camadas pulsam em fases diferentes. */
function desenharNevoa(ctx: CanvasRenderingContext2D, cores: Cores, sorte: () => number) {
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 26; i++) {
    const x = (sorte() * 2 - 1) * 0.9
    const y = (sorte() * 2 - 1) * 0.5
    const raio = 0.08 + 0.12 * sorte()
    const gradiente = ctx.createRadialGradient(x, y, 0, x, y, raio)
    gradiente.addColorStop(0, cores.energia)
    gradiente.addColorStop(1, 'transparent')
    ctx.globalAlpha = 0.14 + 0.16 * sorte()
    ctx.fillStyle = gradiente
    ctx.fillRect(x - raio, y - raio, raio * 2, raio * 2)
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

/** Monta as camadas uma única vez, com sementes fixas: 3 anéis de estrelas, 1 névoa e 2 braços. */
function montarCamadas(cores: Cores): Camadas | null {
  const abertoCamada = criarCamada()
  const fechadoCamada = criarCamada()
  const nevoaCamada = criarCamada()
  const faixas: [number, number][] = [[0.08, 0.4], [0.4, 0.75], [0.75, 1.18]]
  const anelCamadas = faixas.map(() => criarCamada())
  if (!abertoCamada.ctx || !fechadoCamada.ctx || !nevoaCamada.ctx || anelCamadas.some((c) => !c.ctx)) return null
  desenharBracos(abertoCamada.ctx, cores, 0.42, sorteador(31))
  desenharBracos(fechadoCamada.ctx, cores, 0.3, sorteador(47))
  faixas.forEach(([inicio, fim], j) => {
    const ctx = anelCamadas[j].ctx
    if (ctx) desenharAneis(ctx, cores, [inicio, fim], 600, sorteador(60 + j), j === faixas.length - 1)
  })
  const sorteNevoa = sorteador(100)
  for (let k = 0; k < 3; k++) desenharNevoa(nevoaCamada.ctx, cores, sorteNevoa)
  return {
    bracoAberto: abertoCamada.elemento,
    bracoFechado: fechadoCamada.elemento,
    aneis: anelCamadas.map((c, j) => ({ elemento: c.elemento, velocidade: DIFERENCIAL / ((faixas[j][0] + faixas[j][1]) / 2) })),
    nevoa: nevoaCamada.elemento,
  }
}

/** Projeção igual à de GalaxiaProcedural: inclinação, achatamento e zoom vêm do quadro. */
function criarProjecao(quadro: QuadroGalaxia, largura: number, altura: number): Projecao {
  return {
    e: Math.min(largura * 0.44, altura * 0.86) * quadro.zoom,
    cx: largura * 0.5,
    cy: altura * 0.47,
    cI: Math.cos(quadro.inclinacao),
    sI: Math.sin(quadro.inclinacao),
    k: quadro.achatamento,
  }
}

function projetar(p: Projecao, x: number, y: number, z: number, saida: PontoPlano): PontoPlano {
  const vertical = y * p.k - z
  saida.x = p.cx + p.e * (x * p.cI - vertical * p.sI)
  saida.y = p.cy + p.e * (x * p.sI + vertical * p.cI)
  return saida
}

/**
 * Desenha uma camada pré-renderizada no canvas: a projeção do disco (inclinação e achatamento)
 * e a rotação da camada entram numa única transformação; a camada já está em unidades do disco.
 */
function desenharCamada(ctx: CanvasRenderingContext2D, p: Projecao, camada: HTMLCanvasElement, angulo: number, alfa: number) {
  if (alfa < 0.005) return
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = Math.min(1, alfa)
  ctx.transform(p.e * p.cI, p.e * p.sI, -p.e * p.k * p.sI, p.e * p.k * p.cI, p.cx, p.cy)
  ctx.rotate(angulo)
  ctx.drawImage(camada, -LADO / 2, -LADO / 2, LADO, LADO)
  ctx.restore()
}

/** Rampa suave entre `inicio` e `fim` (0 a 1). */
function rampa(t: number, inicio: number, fim: number) {
  const x = Math.min(1, Math.max(0, (t - inicio) / (fim - inicio)))
  return x * x * (3 - 2 * x)
}

/**
 * Desenha as camadas no fundo estático: braços (com a troca para o estado enrolado), anéis que
 * giram cada um na sua velocidade (rotação diferencial) e a névoa do campo, que pulsa.
 */
function desenharCamadas(ctx: CanvasRenderingContext2D, camadas: Camadas, quadro: QuadroGalaxia, largura: number, altura: number) {
  const p = criarProjecao(quadro, largura, altura)
  const t = quadro.tempo
  const luz = quadro.luz
  // Névoa do campo: pulsa devagar e some quando o disco acende.
  const pulso = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 4.2)
  desenharCamada(ctx, p, camadas.nevoa, quadro.rotacao, (1 - luz) * 0.7 * pulso)
  // Anéis: cada um gira na sua velocidade, em torno do giro global.
  for (const anel of camadas.aneis) {
    desenharCamada(ctx, p, anel.elemento, quadro.rotacao + anel.velocidade * (t - DURACAO_NASCIMENTO), 0.3 + 0.5 * luz)
  }
  // Braços: aparecem entre 6,5 e 9,5 s, perdem um quarto da força depois de 19 s; trocam aberto por enrolado.
  const bracos = rampa(t, 6.5, 9.5) * (1 - 0.25 * rampa(t, 19, 21))
  const enrolar = quadro.enrolar
  desenharCamada(ctx, p, camadas.bracoAberto, quadro.rotacao, bracos * (1 - enrolar) * 0.9)
  desenharCamada(ctx, p, camadas.bracoFechado, quadro.rotacao, bracos * enrolar * 0.9)
}

/** Pinta só o que é dinâmico no canvas: filamentos, partículas, rastros, nós, flashes e núcleo. */
function desenharQuadro(ctx: CanvasRenderingContext2D, quadro: QuadroGalaxia, r: Recursos) {
  const { largura, altura, cena, cores } = r
  const p = criarProjecao(quadro, largura, altura)
  const fator = p.e / 760
  const ponto: PontoPlano = { x: 0, y: 0 }
  const outro: PontoPlano = { x: 0, y: 0 }
  const centro: PontoPlano = { x: 0, y: 0 }
  const eixoA: PontoPlano = { x: 0, y: 0 }
  const eixoB: PontoPlano = { x: 0, y: 0 }
  const cos = Math.cos(quadro.rotacao)
  const sen = Math.sin(quadro.rotacao)

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.clearRect(0, 0, largura, altura)

  // Teia de filamentos, antes do colapso.
  if (quadro.filamentosAlfa > 0.005) {
    ctx.strokeStyle = cores.linha
    ctx.lineWidth = Math.max(1, fator)
    ctx.globalAlpha = quadro.filamentosAlfa
    for (const filamento of cena.filamentos) {
      ctx.beginPath()
      for (let s = 0; s <= 28; s++) {
        pontoFilamento(filamento, s / 28, ponto)
        projetar(p, ponto.x * cos - ponto.y * sen, ponto.x * sen + ponto.y * cos, 0, ponto)
        if (s === 0) ctx.moveTo(ponto.x, ponto.y)
        else ctx.lineTo(ponto.x, ponto.y)
      }
      ctx.stroke()
    }
  }

  ctx.globalCompositeOperation = 'lighter'
  if (quadro.nosAlfa > 0.005) {
    for (let indice = 0; indice < cena.nos.length; indice++) {
      const [x, y] = cena.nos[indice]
      projetar(p, x * cos - y * sen, x * sen + y * cos, 0, ponto)
      const tamanho = (indice === 0 ? 0.3 : 0.16) * p.e
      ctx.globalAlpha = quadro.nosAlfa * (indice === 0 ? 0.35 : 0.8)
      ctx.drawImage(r.halo, ponto.x - tamanho / 2, ponto.y - tamanho / 2, tamanho, tamanho)
    }
  }

  // Choque de acreção: anel que cai sobre o centro.
  if (quadro.choque.alfa > 0.005) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = cores.energia
    ctx.lineWidth = Math.max(1, 2 * fator)
    ctx.globalAlpha = quadro.choque.alfa
    ctx.beginPath()
    for (let s = 0; s <= 64; s++) {
      const angulo = (s / 64) * Math.PI * 2
      projetar(p, Math.cos(angulo) * quadro.choque.raio, Math.sin(angulo) * quadro.choque.raio, 0, ponto)
      if (s === 0) ctx.moveTo(ponto.x, ponto.y)
      else ctx.lineTo(ponto.x, ponto.y)
    }
    ctx.stroke()
    ctx.globalCompositeOperation = 'lighter'
  }

  const pos = quadro.posicoes
  const brilho = quadro.brilho
  const mistura = quadro.mistura
  const total = cena.total
  const { sx, sy, vis, niveis, contagem } = r.buffers
  // Partículas dinâmicas: menos pontos depois de 12 s (o resto é o fundo das camadas); os brilhantes sempre aparecem.
  const passo = quadro.tempo < 12 ? 2 : 3
  // Projeção feita uma única vez por partícula visível; os passes seguintes reaproveitam.
  for (let i = 0; i < total; i++) {
    const visivelAgora = i % passo === 0 || brilho[i] > 0.6
    vis[i] = visivelAgora ? 1 : 0
    if (!visivelAgora) continue
    projetar(p, pos[3 * i], pos[3 * i + 1], pos[3 * i + 2], ponto)
    sx[i] = ponto.x
    sy[i] = ponto.y
  }

  // Poeira só nas partículas mais brilhantes: um só preenchimento para o lote (sem um drawImage por partícula).
  ctx.beginPath()
  for (let i = 0; i < total; i++) {
    if (!cena.poeira[i] || brilho[i] < 0.25 || i % 5 !== 0) continue
    projetar(p, pos[3 * i], pos[3 * i + 1], pos[3 * i + 2], ponto)
    const raio = Math.max(1.5, (2 + cena.tamanho[i] * 2.5) * fator * quadro.zoom)
    ctx.moveTo(ponto.x + raio, ponto.y)
    ctx.arc(ponto.x, ponto.y, raio, 0, Math.PI * 2)
  }
  ctx.fillStyle = cores.energia
  ctx.globalAlpha = 0.07 + 0.09 * quadro.luz
  ctx.fill()

  // Rastros da queda e do colapso: um só caminho, uma só pintura.
  let temRastro = false
  ctx.beginPath()
  for (let i = 0; i < total; i++) {
    if (quadro.rastro[i] < 0.05 || !vis[i]) continue
    temRastro = true
    projetar(p, quadro.anteriores[2 * i], quadro.anteriores[2 * i + 1], pos[3 * i + 2], outro)
    ctx.moveTo(outro.x, outro.y)
    ctx.lineTo(sx[i], sy[i])
  }
  if (temRastro) {
    ctx.strokeStyle = cores.energia
    ctx.lineWidth = Math.max(1, 1.1 * fator)
    ctx.globalAlpha = 0.2
    ctx.stroke()
  }

  // Pontos de luz em duas passadas (energia e verde escuro), agrupados em níveis de alfa.
  // Os níveis usam buffers reaproveitados: nenhum array novo por quadro.
  contagem.fill(0)
  for (let i = 0; i < total; i++) {
    if (!vis[i] || cena.estrela[i]) continue
    const alfaE = brilho[i] * mistura[i]
    if (alfaE >= 0.01) {
      const nivel = Math.min(NIVEIS_ALFA - 1, Math.floor((alfaE / ALFA_MAXIMO) * NIVEIS_ALFA))
      niveis[nivel * total + contagem[nivel]++] = i
    }
  }
  // Teto em px CSS: no palco cheio (e com zoom) o ponto crescia e virava "confete" quadrado.
  const tamanhoPonto = (i: number) => Math.min(2.2, Math.max(1, cena.tamanho[i] * fator * 1.2))
  ctx.fillStyle = cores.energia
  for (let nivel = 0; nivel < NIVEIS_ALFA; nivel++) {
    if (contagem[nivel] === 0) continue
    ctx.globalAlpha = ((nivel + 0.5) / NIVEIS_ALFA) * ALFA_MAXIMO
    ctx.beginPath()
    for (let k = 0; k < contagem[nivel]; k++) {
      const i = niveis[nivel * total + k]
      const tam = tamanhoPonto(i)
      ctx.rect(sx[i], sy[i], tam, tam)
    }
    ctx.fill()
  }
  contagem.fill(0)
  for (let i = 0; i < total; i++) {
    if (!vis[i] || cena.estrela[i]) continue
    const alfaD = brilho[i] * (1 - mistura[i])
    if (alfaD >= 0.01) {
      const nivel = Math.min(NIVEIS_ALFA - 1, Math.floor((alfaD / ALFA_MAXIMO) * NIVEIS_ALFA))
      niveis[nivel * total + contagem[nivel]++] = i
    }
  }
  ctx.fillStyle = cores.dim
  for (let nivel = 0; nivel < NIVEIS_ALFA; nivel++) {
    if (contagem[nivel] === 0) continue
    ctx.globalAlpha = ((nivel + 0.5) / NIVEIS_ALFA) * ALFA_MAXIMO
    ctx.beginPath()
    for (let k = 0; k < contagem[nivel]; k++) {
      const i = niveis[nivel * total + k]
      const tam = tamanhoPonto(i)
      ctx.rect(sx[i], sy[i], tam, tam)
    }
    ctx.fill()
  }

  // Estrelas brancas: só acendem junto com o disco, e só as que estão na amostra.
  // O brilho de cada uma vira um halo em lote (um preenchimento) e um ponto nítido.
  ctx.fillStyle = cores.texto
  ctx.beginPath()
  let temEstrela = false
  for (let i = 0; i < total; i++) {
    if (!cena.estrela[i] || brilho[i] < 0.02 || !vis[i]) continue
    temEstrela = true
    const tam = tamanhoPonto(i) * 1.3
    ctx.rect(sx[i], sy[i], tam, tam)
  }
  if (temEstrela) {
    ctx.globalAlpha = 0.85
    ctx.fill()
  }
  ctx.fillStyle = cores.energia
  ctx.beginPath()
  for (let i = 0; i < total; i++) {
    if (!cena.estrela[i] || brilho[i] < 0.5 || !vis[i]) continue
    const raio = (3 + cena.tamanho[i] * 4) * fator
    ctx.moveTo(sx[i] + raio, sy[i])
    ctx.arc(sx[i], sy[i], raio, 0, Math.PI * 2)
  }
  ctx.globalAlpha = 0.22
  ctx.fill()

  // Nós de formação estelar: manchas que acendem sobre os braços.
  for (const no of quadro.formacao) {
    projetar(p, no.x, no.y, no.z, ponto)
    const grande = (0.02 + 0.03 * no.intensidade) * p.e
    ctx.globalAlpha = Math.min(0.8, no.intensidade * 0.7)
    ctx.drawImage(r.halo, ponto.x - grande, ponto.y - grande, grande * 2, grande * 2)
    const pequena = (0.006 + 0.008 * no.intensidade) * p.e
    ctx.globalAlpha = Math.min(0.9, no.intensidade)
    ctx.drawImage(r.estrela, ponto.x - pequena, ponto.y - pequena, pequena * 2, pequena * 2)
  }

  // Barra curta do bojo: halo elíptico suave, com o eixo projetado no plano do disco.
  if (quadro.barra > 0.01) {
    const angulo = 0.35 + quadro.rotacao
    const cosA = Math.cos(angulo)
    const senA = Math.sin(angulo)
    projetar(p, 0, 0, 0, centro)
    projetar(p, 0.25 * cosA, 0.25 * senA, 0, eixoA)
    projetar(p, -0.07 * senA, 0.07 * cosA, 0, eixoB)
    ctx.save()
    ctx.globalAlpha = quadro.barra * 0.22
    ctx.transform(eixoA.x - centro.x, eixoA.y - centro.y, eixoB.x - centro.x, eixoB.y - centro.y, centro.x, centro.y)
    ctx.drawImage(r.halo, -1.5, -1.5, 3, 3)
    ctx.restore()
  }

  // Onda de choque do primeiro acendimento: anel brilhante e rápido, com halo.
  if (quadro.onda.alfa > 0.01 && quadro.onda.raio > 0.01) {
    ctx.beginPath()
    for (let k = 0; k <= 72; k++) {
      const angulo = (k / 72) * Math.PI * 2
      projetar(p, Math.cos(angulo) * quadro.onda.raio, Math.sin(angulo) * quadro.onda.raio, 0, ponto)
      if (k === 0) ctx.moveTo(ponto.x, ponto.y)
      else ctx.lineTo(ponto.x, ponto.y)
    }
    ctx.strokeStyle = cores.energia
    ctx.globalAlpha = quadro.onda.alfa * 0.35
    ctx.lineWidth = Math.max(2, 4 * fator)
    ctx.stroke()
    ctx.globalAlpha = quadro.onda.alfa
    ctx.lineWidth = Math.max(1, 1.4 * fator)
    ctx.stroke()
  }

  // Clarão das primeiras estrelas: um brilho curto no centro.
  if (quadro.clarao > 0.01) {
    projetar(p, 0, 0, 0, ponto)
    const raio = 0.2 * p.e
    ctx.globalAlpha = Math.min(0.4, quadro.clarao * 0.4)
    ctx.drawImage(r.halo, ponto.x - raio, ponto.y - raio, raio * 2, raio * 2)
  }

  // Bolhas de reionização: anéis que crescem a partir de cada flash.
  ctx.strokeStyle = cores.energia
  for (const bolha of quadro.bolhas) {
    if (bolha.alfa < 0.01 || bolha.raio < 0.005) continue
    ctx.beginPath()
    for (let k = 0; k <= 40; k++) {
      const angulo = (k / 40) * Math.PI * 2
      projetar(p, bolha.x + Math.cos(angulo) * bolha.raio, bolha.y + Math.sin(angulo) * bolha.raio, bolha.z, ponto)
      if (k === 0) ctx.moveTo(ponto.x, ponto.y)
      else ctx.lineTo(ponto.x, ponto.y)
    }
    ctx.globalAlpha = bolha.alfa * 0.3
    ctx.lineWidth = Math.max(1.5, 3 * fator)
    ctx.stroke()
    ctx.globalAlpha = bolha.alfa * 0.6
    ctx.lineWidth = Math.max(1, 1 * fator)
    ctx.stroke()
  }

  // Núcleo emissivo: halo suave e um miolo pequeno que não estoura.
  if (quadro.nucleo.brilho > 0.01) {
    projetar(p, 0, 0, 0, ponto)
    const raio = quadro.nucleo.raio * p.e
    ctx.globalAlpha = Math.min(0.35, quadro.nucleo.brilho * 0.4)
    ctx.drawImage(r.halo, ponto.x - raio * 2.2, ponto.y - raio * 2.2, raio * 4.4, raio * 4.4)
    ctx.globalAlpha = Math.min(0.6, quadro.nucleo.brilho * 0.7)
    ctx.drawImage(r.estrela, ponto.x - raio * 0.6, ponto.y - raio * 0.6, raio * 1.2, raio * 1.2)
  }

  // Flashes Pop III: subida rápida, queda curta.
  for (const flash of quadro.flashes) {
    projetar(p, flash.x, flash.y, flash.z, ponto)
    const tamanho = (0.006 + 0.014 * flash.intensidade) * p.e
    ctx.globalAlpha = Math.min(0.7, flash.intensidade * 0.8)
    ctx.drawImage(r.halo, ponto.x - tamanho * 2.25, ponto.y - tamanho * 2.25, tamanho * 4.5, tamanho * 4.5)
    ctx.globalAlpha = Math.min(0.9, flash.intensidade)
    ctx.drawImage(r.estrela, ponto.x - tamanho * 0.45, ponto.y - tamanho * 0.45, tamanho * 0.9, tamanho * 0.9)
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

/**
 * Nascimento de uma galáxia: canvas que preenche o contêiner e encena a montagem em ~22 s.
 * `inicio="madura"` começa já com a galáxia formada. Movimento reduzido mostra só o quadro final.
 */
export function NascimentoGalaxia({ className = '', inicio = 'montagem' }: { className?: string; inicio?: 'montagem' | 'madura' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fundoRef = useRef<HTMLCanvasElement>(null)
  const camadasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const fundoCanvas = fundoRef.current
    const camadasCanvas = camadasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !fundoCanvas || !camadasCanvas || !ctx) return

    const cena = obterCenaGalaxia()
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cores = lerCores(canvas)
    const halo = criarSprite(cores.energia)
    const estrela = criarSprite(cores.texto)
    const buffers = criarBuffers(cena.total)
    const camadas = montarCamadas(cores)

    let reduzido = media.matches
    let tempo = inicio === 'madura' ? DURACAO_NASCIMENTO : 0
    let largura = 0
    let altura = 0
    let quadroId = 0
    let timerId = 0
    let ultimo = 0
    let visivel = true
    let encerrado = false
    let pronto = false
    let dpr = 1
    let instanteCamadaPintada = -1

    const medir = () => {
      const caixa = canvas.getBoundingClientRect()
      largura = caixa.width
      altura = caixa.height
      if (largura < 2 || altura < 2) return false
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(largura * dpr)
      canvas.height = Math.round(altura * dpr)
      fundoCanvas.width = Math.round(largura * dpr)
      fundoCanvas.height = Math.round(altura * dpr)
      pintarFundo(fundoCanvas, largura, altura, dpr, cores)
      camadasCanvas.width = Math.round(largura * dpr)
      camadasCanvas.height = Math.round(altura * dpr)
      camadasCanvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      instanteCamadaPintada = -1
      pronto = true
      return true
    }

    const renderizar = (instante: number) => {
      if (!pronto || largura < 2) return
      if (camadas && camadasCanvas) {
        // As camadas têm canvas próprio e são repintadas em instantes fixos (10 por segundo):
        // a cada quadro só as partículas e os brilhos dinâmicos são desenhados.
        const instanteCamada = Math.floor(instante / PASSO_CAMADAS) * PASSO_CAMADAS
        if (instanteCamada !== instanteCamadaPintada) {
          instanteCamadaPintada = instanteCamada
          const camCtx = camadasCanvas.getContext('2d')
          if (camCtx) {
            camCtx.clearRect(0, 0, largura, altura)
            desenharCamadas(camCtx, camadas, quadroGalaxia(instanteCamada, cena), largura, altura)
          }
        }
      }
      const quadro = quadroGalaxia(instante, cena)
      desenharQuadro(ctx, quadro, { largura, altura, halo, estrela, cores, cena, buffers })
    }

    const parar = () => {
      cancelAnimationFrame(quadroId)
      window.clearTimeout(timerId)
      quadroId = 0
      timerId = 0
    }

    const podeAnimar = () => !encerrado && !reduzido && visivel && !document.hidden

    function agendar() {
      // Depois da montagem a rotação é lenta: 20 quadros por segundo bastam e poupam CPU.
      if (tempo < DURACAO_NASCIMENTO) quadroId = requestAnimationFrame(passo)
      else timerId = window.setTimeout(() => passo(performance.now()), 50)
    }

    function passo(agora: number) {
      quadroId = 0
      timerId = 0
      if (!podeAnimar()) return
      const dt = ultimo ? Math.min(0.1, (agora - ultimo) / 1000) : 0
      ultimo = agora
      tempo += dt
      renderizar(tempo)
      agendar()
    }

    function atualizar() {
      parar()
      ultimo = 0
      if (reduzido) {
        renderizar(DURACAO_NASCIMENTO)
        return
      }
      renderizar(tempo)
      if (podeAnimar()) agendar()
    }

    const ajustar = () => {
      if (medir()) atualizar()
    }
    const aoMudarMovimento = () => {
      reduzido = media.matches
      atualizar()
    }
    const aoMudarVisibilidade = () => atualizar()

    const redimensionamento = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(ajustar) : null
    const intersecao = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entrada]) => {
        visivel = entrada.isIntersecting
        atualizar()
      }, { threshold: 0.01 })
      : null

    ajustar()
    redimensionamento?.observe(canvas)
    intersecao?.observe(canvas)
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    media.addEventListener('change', aoMudarMovimento)

    return () => {
      encerrado = true
      parar()
      redimensionamento?.disconnect()
      intersecao?.disconnect()
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
      media.removeEventListener('change', aoMudarMovimento)
    }
  }, [inicio])

  return (
    <div className={`dk-galaxia ${className}`.trim()} aria-hidden="true">
      <canvas ref={fundoRef} className="dk-galaxia-fundo" />
      <canvas ref={camadasRef} className="dk-galaxia-fundo" />
      <canvas ref={canvasRef} className="dk-galaxia-canvas" />
    </div>
  )
}
