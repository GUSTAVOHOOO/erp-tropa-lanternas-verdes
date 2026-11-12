import { gerarParticulasGalaxia } from '../oanet/galaxia'

/**
 * Nascimento de uma galáxia: modelo puro e determinístico.
 *
 * `quadroGalaxia(t)` diz onde está e quanto brilha cada partícula no instante
 * `t` (segundos). Não há sorteio durante a animação: todas as sementes são
 * fixas e tudo que é aleatório acontece uma vez, em `criarCenaGalaxia`.
 *
 * Oito estados encadeados (ver `ESTADOS_NASCIMENTO`). A galáxia final é a
 * mesma do mapa do site (`gerarParticulasGalaxia(4500, 2814)`), com a mesma
 * projeção: o último quadro coincide com o estado inicial de GalaxiaProcedural.
 *
 * Licenças artísticas, não física medida: cores, tempos, a velocidade de
 * rotação, a espiral (b = 0,3, ajustada ao enrolamento dos braços do site) e
 * o clarão das primeiras estrelas.
 */

/** Duração da montagem; depois dela a galáxia madura gira em loop calmo. */
export const DURACAO_NASCIMENTO = 22

export const ESTADOS_NASCIMENTO = [
  { nome: 'campo', inicio: 0 },
  { nome: 'teia', inicio: 2 },
  { nome: 'queda', inicio: 4.5 },
  { nome: 'colapso', inicio: 7 },
  { nome: 'estrelas', inicio: 10 },
  { nome: 'bracos', inicio: 12 },
  { nome: 'nucleo', inicio: 16 },
  { nome: 'madura', inicio: 18.5 },
] as const

/** Índice do estado (0 a 7) que está ativo em `t`. */
export function estadoNascimento(t: number): number {
  let indice = 0
  ESTADOS_NASCIMENTO.forEach((estado, i) => {
    if (t >= estado.inicio) indice = i
  })
  return indice
}

// Constantes do disco final, iguais às de GalaxiaProcedural.tsx.
const ROTACAO_INICIAL = -0.38
const VELOCIDADE_MADURA = 0.012
const INCLINACAO_FINAL = -0.23
const ACHATAMENTO_FINAL = 0.43
const ZOOM_INICIAL = 0.9

// Colapso: ω = min(ω_max, ω0·(r0/r)²), conservação de momento angular (pesquisa, seção 4).
const OMEGA_0 = 0.14
const OMEGA_MAX = 0.9
// Braços: duas pontas em espiral logarítmica, θ = ln(r/a)/b (fixas no disco).
const ESPIRAL_A = 0.127
const ESPIRAL_B = 0.3
/** Grãos do campo acesos desde t = 0. */
const CAMPO_VISIVEL = 900
/** Nós de formação estelar acesos ao longo dos braços. */
const FORMACOES = 28
/** Intervalo, em segundos, usado para medir a velocidade do rastro. */
const RASTRO_DT = 0.1

const SEMENTE_NUVEM = 9001
const SEMENTE_FINAL = 2814
const TOTAL = 4500

const GRUPO_FUNDO = 0
const GRUPO_TEIA = 1
const GRUPO_QUEDA = 2
const GRUPO_SATELITE = 3

/** Nós da teia cósmica no plano (o nó 0 é o centro, onde a galáxia nasce). */
const NOS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [-0.92, -0.3], [-0.55, 0.6], [0.15, 0.82], [0.88, 0.38], [0.95, -0.42], [0.25, -0.78], [-0.45, -0.7],
]
const PARES_FILAMENTO: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
  [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 1],
]

export type Filamento = { ax: number; ay: number; cx: number; cy: number; bx: number; by: number }
export type PontoPlano = { x: number; y: number }

export type FlashPopIII = { x: number; y: number; z: number; intensidade: number }
export type BolhaReionizacao = { x: number; y: number; z: number; raio: number; alfa: number }
/** Nó de formação estelar aceso sobre um braço. */
export type NoFormacao = { x: number; y: number; z: number; intensidade: number }
/** Onda de choque do primeiro acendimento (raio no plano do disco). */
export type OndaChoque = { raio: number; alfa: number }

export type QuadroGalaxia = {
  tempo: number
  estado: number
  /** Rotação do disco (rad). Aplicada a `posicoes`; os filamentos também. */
  rotacao: number
  inclinacao: number
  achatamento: number
  zoom: number
  /** Quanto o disco já acendeu (0 a 1); a poeira acompanha. */
  luz: number
  /** Posição x, y, z por partícula, em 3 × N, já girada. */
  posicoes: Float64Array
  /** Posição de x e y 0,1 s antes, em 2 × N, para desenhar os rastros. */
  anteriores: Float64Array
  /** Peso do rastro por partícula (0 = sem rastro). */
  rastro: Float64Array
  /** Brilho por partícula, de 0 a 0,85. */
  brilho: Float64Array
  /** Mistura para a cor de energia (0 = verde escuro, 1 = energia), por partícula. */
  mistura: Float64Array
  filamentosAlfa: number
  nosAlfa: number
  choque: { raio: number; alfa: number }
  barra: number
  nucleo: { brilho: number; raio: number }
  flashes: FlashPopIII[]
  bolhas: BolhaReionizacao[]
  formacao: NoFormacao[]
  onda: OndaChoque
  /** Clarão global das primeiras estrelas (0 a 1). */
  clarao: number
  /** Respiro suave antes da fase madura (0 a 1). */
  respiro: number
  /** Quanto os braços já se enrolaram (0 = abertos, 1 = enrolados). */
  enrolar: number
}

export type CenaGalaxia = {
  total: number
  filamentos: Filamento[]
  nos: ReadonlyArray<readonly [number, number]>
  grupo: Uint8Array
  /** Posição inicial no plano (campo, satélite ou ponto de partida da teia). */
  x0: Float64Array
  y0: Float64Array
  /** Ponto da teia onde o gás pousa no filamento. */
  qx: Float64Array
  qy: Float64Array
  /** Raio e ângulo no instante em que a queda começa (t = 4,5 s). */
  r45: Float64Array
  a45: Float64Array
  /** Raio do choque de acreção e ângulo de entrada do satélite. */
  rChoque: Float64Array
  anelAng: Float64Array
  /** Polar no instante 7 s, quando começa o colapso. */
  r7: Float64Array
  a7: Float64Array
  /** Espessura inicial da nuvem (z) e tempo em que cada partícula aparece. */
  espessura: Float64Array
  ativ: Float64Array
  kappa: Float64Array
  delta: Float64Array
  tw: Float64Array
  dw: Float64Array
  /** Índice, no mapa do site, da posição que cada partícula ocupa no fim. */
  indiceFinal: Int32Array
  /** Disco final (site) e propriedades visuais. */
  rF: Float64Array
  aF: Float64Array
  fz: Float64Array
  brilhoFinal: Float64Array
  tamanho: Float64Array
  poeira: Uint8Array
  estrela: Uint8Array
  bojo: Uint8Array
  halo: Uint8Array
  surto: Uint8Array
  fSurto: Float64Array
  phiSurto: Float64Array
  /** Partículas hospedeiras dos flashes, das bolhas e dos nós de formação. */
  flashes: { hospedeiro: number; tempo: number; intensidade: number }[]
  bolhas: { hospedeiro: number; tempo: number; raio: number }[]
  formacao: { hospedeiro: number; tempo: number; intensidade: number }[]
}

const limitar = (valor: number, min = 0, max = 1) => Math.min(max, Math.max(min, valor))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
/** Smoothstep s(u) = u²·(3 − 2u), com u em [0, 1]. */
export const suave = (u: number) => {
  const x = limitar(u)
  return x * x * (3 - 2 * x)
}
const faixa = (t: number, inicio: number, fim: number) => suave((t - inicio) / (fim - inicio))
/** Ângulo no intervalo [−π, π). */
const envolver = (angulo: number) => ((angulo + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI

/** Queda com um pequeno ressalto, que termina exatamente em 1 (choque de acreção). */
function caindo(u: number) {
  const x = limitar(u)
  return suave(x) + 0.04 * Math.exp(-4 * x) * Math.sin(3 * Math.PI * x)
}

/** Velocidade angular durante o colapso: ω = min(ω_max, ω0·(r0/r)²). */
export function velocidadeAngularColapso(r: number, r0: number): number {
  return Math.min(OMEGA_MAX, OMEGA_0 * (r0 / Math.max(r, 0.05)) ** 2)
}

/** Rotação global do disco: 0,012 rad/s, com o site na sua posição inicial em t = 22 s. */
export function rotacaoGlobal(t: number): number {
  return ROTACAO_INICIAL + VELOCIDADE_MADURA * (t - DURACAO_NASCIMENTO)
}

/** Gerador de números pseudoaleatórios (mulberry32), usado só para montar a cena. */
function criarSorteio(semente: number) {
  let estado = semente | 0
  return () => {
    estado += 0x6d2b79f5
    let valor = estado
    valor = Math.imul(valor ^ (valor >>> 15), valor | 1)
    valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61)
    return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296
  }
}

function criarFilamentos(): Filamento[] {
  return PARES_FILAMENTO.map(([a, b], indice) => {
    const [ax, ay] = NOS[a]
    const [bx, by] = NOS[b]
    const dx = bx - ax
    const dy = by - ay
    const comprimento = Math.hypot(dx, dy) || 1
    const curva = (indice % 2 === 0 ? 0.14 : -0.14)
    return {
      ax, ay,
      cx: (ax + bx) / 2 - (dy / comprimento) * curva,
      cy: (ay + by) / 2 + (dx / comprimento) * curva,
      bx, by,
    }
  })
}

/** Ponto de Bézier quadrática do filamento, em u de 0 a 1, gravado em `saida`. */
export function pontoFilamento(f: Filamento, u: number, saida: PontoPlano): PontoPlano {
  const k = 1 - u
  saida.x = k * k * f.ax + 2 * k * u * f.cx + u * u * f.bx
  saida.y = k * k * f.ay + 2 * k * u * f.cy + u * u * f.by
  return saida
}

/**
 * Posição no plano (sem rotação) antes do colapso, em t < 7 s.
 * O mesmo cálculo serve para a polar de 7 s, o que garante continuidade.
 */
function posicaoPlano(c: CenaGalaxia, i: number, t: number, saida: PontoPlano): PontoPlano {
  const grupo = c.grupo[i]
  if (grupo === GRUPO_SATELITE) {
    const k = faixa(t, 4.5, 7)
    const alvoX = c.rChoque[i] * Math.cos(c.anelAng[i])
    const alvoY = c.rChoque[i] * Math.sin(c.anelAng[i])
    saida.x = lerp(c.x0[i], alvoX, k)
    saida.y = lerp(c.y0[i], alvoY, k)
    return saida
  }
  if (grupo === GRUPO_TEIA && t <= 4.5) {
    const k = faixa(t, 2, 4.5)
    saida.x = lerp(c.x0[i], c.qx[i], k)
    saida.y = lerp(c.y0[i], c.qy[i], k)
    return saida
  }
  if ((grupo === GRUPO_TEIA || grupo === GRUPO_QUEDA) && t > 4.5) {
    const r = lerp(c.r45[i], c.rChoque[i], caindo((t - 4.5) / 2.5))
    saida.x = r * Math.cos(c.a45[i])
    saida.y = r * Math.sin(c.a45[i])
    return saida
  }
  saida.x = c.x0[i]
  saida.y = c.y0[i]
  return saida
}

/** Monta a cena uma vez: grupos, posições de partida e alvos. Sementes fixas. */
export function criarCenaGalaxia(): CenaGalaxia {
  const finais = gerarParticulasGalaxia(TOTAL, SEMENTE_FINAL)
  const n = finais.length
  const sortear = criarSorteio(SEMENTE_NUVEM)
  const filamentos = criarFilamentos()
  const ponto: PontoPlano = { x: 0, y: 0 }

  const c: CenaGalaxia = {
    total: n,
    filamentos,
    nos: NOS,
    grupo: new Uint8Array(n),
    x0: new Float64Array(n),
    y0: new Float64Array(n),
    qx: new Float64Array(n),
    qy: new Float64Array(n),
    r45: new Float64Array(n),
    a45: new Float64Array(n),
    rChoque: new Float64Array(n),
    anelAng: new Float64Array(n),
    r7: new Float64Array(n),
    a7: new Float64Array(n),
    espessura: new Float64Array(n),
    ativ: new Float64Array(n),
    kappa: new Float64Array(n),
    delta: new Float64Array(n),
    tw: new Float64Array(n),
    dw: new Float64Array(n),
    indiceFinal: new Int32Array(n),
    rF: new Float64Array(n),
    aF: new Float64Array(n),
    fz: new Float64Array(n),
    brilhoFinal: new Float64Array(n),
    tamanho: new Float64Array(n),
    poeira: new Uint8Array(n),
    estrela: new Uint8Array(n),
    bojo: new Uint8Array(n),
    halo: new Uint8Array(n),
    surto: new Uint8Array(n),
    fSurto: new Float64Array(n),
    phiSurto: new Float64Array(n),
    flashes: [],
    bolhas: [],
    formacao: [],
  }

  // Ordem embaralhada: as primeiras partículas viram satélite, teia, queda; o resto é o campo.
  const ordem = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(sortear() * (i + 1))
    ;[ordem[i], ordem[j]] = [ordem[j], ordem[i]]
  }

  // 1. Grupo, posição de partida e ritmo de acendimento.
  for (let k = 0; k < n; k++) {
    const i = ordem[k]
    if (k < 200) c.grupo[i] = GRUPO_SATELITE
    else if (k < 1000) c.grupo[i] = GRUPO_TEIA
    else if (k < 2000) c.grupo[i] = GRUPO_QUEDA
    else c.grupo[i] = GRUPO_FUNDO
    c.halo[i] = c.grupo[i] === GRUPO_TEIA || c.grupo[i] === GRUPO_QUEDA ? 1 : 0
    c.espessura[i] = (sortear() - 0.5) * 0.5

    if (c.grupo[i] === GRUPO_SATELITE) {
      // Satélite: entra pela direita, de fora do quadro.
      c.x0[i] = 1.55 + (sortear() - 0.5) * 0.22
      c.y0[i] = -0.55 + (sortear() - 0.5) * 0.2
      c.rChoque[i] = 0.6
      c.anelAng[i] = -0.4 + (sortear() - 0.5) * 0.5
      c.ativ[i] = 3.2 + sortear() * 0.5
    } else {
      c.x0[i] = (sortear() * 2 - 1) * 1.15
      c.y0[i] = (sortear() * 2 - 1) * 0.62
      // Os primeiros grãos do campo já estão acesos em t = 0.
      c.ativ[i] = c.grupo[i] === GRUPO_FUNDO
        ? (k < 2000 + CAMPO_VISIVEL ? 0 : 2.5 + sortear() * 2)
        : 2 + sortear() * 1.5
    }

    if (c.grupo[i] === GRUPO_TEIA) {
      // Pouso num filamento: escolhe um e um ponto ao longo dele.
      const filamento = filamentos[Math.floor(sortear() * filamentos.length)]
      const u = 0.1 + sortear() * 0.8
      pontoFilamento(filamento, u, ponto)
      c.qx[i] = ponto.x + (sortear() - 0.5) * 0.03
      c.qy[i] = ponto.y + (sortear() - 0.5) * 0.03
    }
  }

  // 2. Polar em 4,5 s (começo da queda) e raio do choque de acreção.
  for (let i = 0; i < n; i++) {
    const grupo = c.grupo[i]
    if (grupo === GRUPO_TEIA || grupo === GRUPO_QUEDA) {
      const p = grupo === GRUPO_TEIA
        ? { x: c.qx[i], y: c.qy[i] }
        : { x: c.x0[i], y: c.y0[i] }
      c.r45[i] = Math.hypot(p.x, p.y)
      c.a45[i] = Math.atan2(p.y, p.x)
      // Choque mais externo que o disco final: sem isso não há colapso visível.
      c.rChoque[i] = Math.min(c.r45[i], 0.7 + sortear() * 0.25)
    }
  }

  // 3. Polar de cada partícula em 7 s (começo do colapso), pela mesma função da animação.
  for (let i = 0; i < n; i++) {
    posicaoPlano(c, i, 7, ponto)
    c.r7[i] = Math.hypot(ponto.x, ponto.y)
    c.a7[i] = Math.atan2(ponto.y, ponto.x)
  }

  // 4. Pareamento por ordem de raio: a partícula mais interna do campo recebe a posição
  // mais interna do site. O conjunto final é o mesmo do mapa; só muda quem ocupa cada lugar,
  // e as partículas que começam longe não acabam indo para fora.
  const porRaioInicial = Array.from({ length: n }, (_, i) => i).sort((a, b) => c.r7[a] - c.r7[b])
  const raioSite = finais.map((f) => Math.hypot(f.x, f.y))
  const porRaioFinal = Array.from({ length: n }, (_, i) => i).sort((a, b) => raioSite[a] - raioSite[b])
  for (let k = 0; k < n; k++) {
    const i = porRaioInicial[k]
    const f = finais[porRaioFinal[k]]
    c.indiceFinal[i] = porRaioFinal[k]
    c.rF[i] = Math.hypot(f.x, f.y)
    c.aF[i] = Math.atan2(f.y, f.x)
    c.fz[i] = f.z
    c.brilhoFinal[i] = f.brilho
    c.tamanho[i] = f.tamanho
    c.poeira[i] = f.poeira ? 1 : 0
    c.estrela[i] = porRaioFinal[k] % 11 === 0 ? 1 : 0
    c.bojo[i] = c.rF[i] < 0.3 ? 1 : 0
  }

  // 5. Colapso: começo e duração de cada partícula. Mais rápido que antes: o disco se forma em ~8,5 s.
  // O bojo afunda depois, em 12 s.
  for (let i = 0; i < n; i++) {
    if (c.bojo[i]) {
      c.kappa[i] = 12 + sortear() * 0.8
      c.delta[i] = 4.5
      c.tw[i] = 14.5
      c.dw[i] = 3.5
    } else {
      c.kappa[i] = 7 + sortear() * 1.0
      c.delta[i] = 1.5 + sortear() * 0.7
      c.tw[i] = 9.5 + sortear() * 2.5
      c.dw[i] = 3
    }
    c.fSurto[i] = 0.25 + sortear() * 0.4
    c.phiSurto[i] = sortear()
  }

  // 6. Surtos de formação estelar: 800 partículas do disco, nos braços.
  let surtos = 0
  for (let k = 0; k < n && surtos < 800; k++) {
    const i = ordem[k]
    if (c.rF[i] > 0.25) {
      c.surto[i] = 1
      surtos++
    }
  }

  // 7. Nós de formação: partículas que caem no centro de um braço (pelo padrão final da espiral).
  let formados = 0
  for (let k = 0; k < n && formados < FORMACOES; k++) {
    const i = ordem[k]
    if (c.bojo[i] || c.rF[i] < 0.3 || c.rF[i] > 0.95) continue
    const psi = Math.log(c.rF[i] / ESPIRAL_A) / ESPIRAL_B
    const crista = ((1 + Math.cos(2 * (c.aF[i] - psi))) / 2) ** 6
    if (crista < 0.6) continue
    c.formacao.push({
      hospedeiro: i,
      tempo: 11.8 + (formados / FORMACOES) * 3.6 + sortear() * 0.25,
      intensidade: 0.7 + sortear() * 0.3,
    })
    formados++
  }

  // 8. Flashes Pop III (24) e bolhas de reionização (6), em partículas do disco.
  const hospedeiros: number[] = []
  for (let k = 0; k < n && hospedeiros.length < 30; k++) {
    const i = ordem[k]
    // Só partículas do disco (fora do bojo, que afunda depois de 12 s).
    if (c.rF[i] >= 0.3 && c.rF[i] <= 0.9 && c.grupo[i] === GRUPO_FUNDO) hospedeiros.push(i)
  }
  for (let k = 0; k < 24; k++) {
    c.flashes.push({
      hospedeiro: hospedeiros[k],
      tempo: 10.1 + (k / 24) * 1.7 + sortear() * 0.1,
      intensidade: 0.55 + sortear() * 0.35,
    })
  }
  for (let k = 0; k < 6; k++) {
    c.bolhas.push({
      hospedeiro: hospedeiros[24 + k],
      tempo: 10.4 + k * 0.25,
      raio: 0.16 + sortear() * 0.08,
    })
  }
  return c
}

let cenaPadrao: CenaGalaxia | undefined

/** Cena da sequência, montada uma única vez. */
export function obterCenaGalaxia(): CenaGalaxia {
  cenaPadrao ??= criarCenaGalaxia()
  return cenaPadrao
}

type Particula = { x: number; y: number; z: number; alpha: number; r: number }
const PONTO_TMP: PontoPlano = { x: 0, y: 0 }

/**
 * Posição de uma partícula em `t`, já girada por `theta`. `alpha` e `r` são
 * o ângulo e o raio no disco (sem rotação), usados para os braços.
 */
function particula(c: CenaGalaxia, i: number, t: number, theta: number, saida: Particula): Particula {
  if (t < 7) {
    posicaoPlano(c, i, t, PONTO_TMP)
    const cos = Math.cos(theta)
    const sen = Math.sin(theta)
    saida.x = PONTO_TMP.x * cos - PONTO_TMP.y * sen
    saida.y = PONTO_TMP.x * sen + PONTO_TMP.y * cos
    saida.z = c.espessura[i] * faixa(t, 4.5, 7)
    saida.alpha = 0
    saida.r = 0
    return saida
  }
  // Colapso: o raio vai da nuvem ao disco; z achata com τ = 1,2 s.
  const k = faixa(t, c.kappa[i], c.kappa[i] + c.delta[i])
  const r = lerp(c.r7[i], c.rF[i], k)
  // Ângulo: cada partícula mantém seu giro (rotação diferencial, o interior gira mais)
  // e a posição final do site entra aos poucos, conforme `w` sobe.
  const w = faixa(t, c.tw[i], c.tw[i] + c.dw[i])
  const giro = velocidadeAngularColapso(r, c.r7[i]) * Math.min(t - 7, 5)
  const alpha = c.aF[i] + (1 - w) * (envolver(c.a7[i] - c.aF[i]) + giro)
  const angulo = alpha + theta
  saida.x = r * Math.cos(angulo)
  saida.y = r * Math.sin(angulo)
  saida.z = c.fz[i] + (c.espessura[i] - c.fz[i]) * Math.exp(-(t - 7) / 1.2)
  saida.alpha = alpha
  saida.r = r
  return saida
}

/** Estado completo de todas as partículas em `t` segundos. Mesmo `t`, mesmo resultado. */
export function quadroGalaxia(t: number, cena: CenaGalaxia = obterCenaGalaxia()): QuadroGalaxia {
  const tempo = Number.isFinite(t) ? Math.max(0, t) : 0
  const n = cena.total
  const posicoes = new Float64Array(n * 3)
  const anteriores = new Float64Array(n * 2)
  const rastro = new Float64Array(n)
  const brilho = new Float64Array(n)
  const mistura = new Float64Array(n)
  const theta = rotacaoGlobal(tempo)
  const thetaAnterior = rotacaoGlobal(tempo - RASTRO_DT)
  const luz = faixa(tempo, 5.5, 8.5)
  const gas = Math.max(0, 1 - Math.abs(tempo - 5.8) / 1.6)
  // Braços: aparecem entre 11 e 13 s; depois ficam com metade do contraste, para a fase madura.
  const bracos = faixa(tempo, 11.2, 12.8) * (1 - 0.45 * faixa(tempo, 15.5, 18))
  const bojo = faixa(tempo, 16, 18)
  // Clarão das primeiras estrelas (10 s) e respiro antes da fase madura (19 s).
  const clarao = tempo >= 10 ? Math.exp(-(tempo - 10) / 0.4) : 0
  const respiro = faixa(tempo, 18.5, 19.3) * (1 - faixa(tempo, 19.3, 20.8))
  // Enrolamento dos braços: 0 = braços abertos, 1 = braços já enrolados (a renderização troca as camadas).
  const enrolar = faixa(tempo, 12, 19)
  // Janelas em que há rastro: a queda (4,5–5 s) e o colapso (7 s), que some quando os braços assentam.
  const janelaRastro = Math.max(
    faixa(tempo, 4.6, 5.2) * (1 - faixa(tempo, 6.6, 7.2)),
    faixa(tempo, 6.8, 7.4) * (1 - faixa(tempo, 9.5, 11)),
  )

  // Nós de formação: brilham no hospedeiro e pulsam devagar.
  const formacao: NoFormacao[] = []
  const extra = new Float64Array(n)
  const formacoesNoTempo: { hospedeiro: number; intensidade: number }[] = []
  for (const no of cena.formacao) {
    const dt = tempo - no.tempo
    if (dt < 0) continue
    const intensidade = no.intensidade * suave(dt / 0.5) * (0.75 + 0.25 * Math.sin((2 * Math.PI * dt) / 2.2))
    if (intensidade < 0.01) continue
    formacoesNoTempo.push({ hospedeiro: no.hospedeiro, intensidade })
    extra[no.hospedeiro] += 0.35 * intensidade
  }

  const atual: Particula = { x: 0, y: 0, z: 0, alpha: 0, r: 0 }
  const anterior: Particula = { x: 0, y: 0, z: 0, alpha: 0, r: 0 }

  for (let i = 0; i < n; i++) {
    // Cada partícula acende em ~0,9 s, terminando em `ativ`; o campo começa aceso em t = 0.
    const ativo = suave(1 + (tempo - cena.ativ[i]) / 0.9)
    particula(cena, i, tempo, theta, atual)
    posicoes[3 * i] = atual.x
    posicoes[3 * i + 1] = atual.y
    posicoes[3 * i + 2] = atual.z

    // Rastro: velocidade no plano entre 0,1 s atrás e agora. Partícula rápida ganha um traço.
    if (janelaRastro > 0) {
      particula(cena, i, tempo - RASTRO_DT, thetaAnterior, anterior)
      anteriores[2 * i] = anterior.x
      anteriores[2 * i + 1] = anterior.y
      const velocidade = Math.hypot(atual.x - anterior.x, atual.y - anterior.y) / RASTRO_DT
      rastro[i] = limitar((velocidade - 0.08) / 0.3) * janelaRastro
    } else {
      anteriores[2 * i] = atual.x
      anteriores[2 * i + 1] = atual.y
    }

    // Campo: grãos com ondas de densidade suaves (sem tremor, pois a função é do tempo).
    const onda = Math.pow(0.5 + 0.5 * Math.sin(3.2 * cena.x0[i] + 2.4 * cena.y0[i] + 0.25 * tempo), 1.6)
    const campo = 0.5 * (0.35 + 0.65 * onda) * ativo
    const cheio = cena.brilhoFinal[i] * 0.88 * ativo
    let b = campo + (cheio - campo) * luz
    let m = Math.max(luz, 0.9 * ativo)
    if (cena.halo[i]) {
      // Gás aquecido pelo choque: brilha enquanto cai e depois assenta no disco.
      b += 0.3 * gas * ativo
      m = Math.max(m, 0.8 * gas)
    }
    if (cena.bojo[i]) {
      // Bojo mais contido: sem ele o centro estoura o brilho.
      b *= 1 - 0.3 * bojo
      m = Math.max(m, bojo)
    }
    if (bracos > 0 && tempo >= 7) {
      // Braços: onde a espiral passa a partícula acende e o resto do disco escurece.
      const psi = Math.log(Math.max(atual.r, 0.05) / ESPIRAL_A) / ESPIRAL_B
      const crista = ((1 + Math.cos(2 * (atual.alpha - psi))) / 2) ** 6
      b *= 1 + bracos * (2.4 * crista - 0.55)
      if (cena.surto[i]) {
        const pulso = (1 + Math.sin(2 * Math.PI * (cena.fSurto[i] * tempo + cena.phiSurto[i]))) / 2
        b += 0.35 * bracos * pulso ** 8
      }
    }
    b += extra[i]
    b *= 1 + 0.45 * clarao
    b *= 1 + 0.06 * respiro
    brilho[i] = limitar(b, 0, 0.85)
    mistura[i] = limitar(m, 0, 1)
  }

  // Flashes Pop III: subida de 0,08 s e queda de 0,45 s.
  const flashes: FlashPopIII[] = []
  for (const flash of cena.flashes) {
    const dt = tempo - flash.tempo
    if (dt < 0) continue
    const intensidade = flash.intensidade * (1 - Math.exp(-dt / 0.08)) * Math.exp(-dt / 0.45)
    if (intensidade < 0.01) continue
    const h = flash.hospedeiro
    flashes.push({ x: posicoes[3 * h], y: posicoes[3 * h + 1], z: posicoes[3 * h + 2], intensidade })
  }

  // Bolhas de reionização: crescem a partir do hospedeiro e se apagam.
  const bolhas: BolhaReionizacao[] = []
  for (const bolha of cena.bolhas) {
    const dt = tempo - bolha.tempo
    if (dt < 0) continue
    const h = bolha.hospedeiro
    bolhas.push({
      x: posicoes[3 * h],
      y: posicoes[3 * h + 1],
      z: posicoes[3 * h + 2],
      raio: bolha.raio * (1 - Math.exp(-dt / 0.9)),
      alfa: 0.5 * Math.exp(-dt / 1.6),
    })
  }

  for (const f of formacoesNoTempo) {
    const h = f.hospedeiro
    formacao.push({ x: posicoes[3 * h], y: posicoes[3 * h + 1], z: posicoes[3 * h + 2], intensidade: f.intensidade })
  }

  // Onda de choque do primeiro acendimento: um anel rápido que se apaga.
  const dtOnda = tempo - 10
  const onda: OndaChoque = dtOnda >= 0
    ? { raio: 0.05 + 1.2 * (1 - Math.exp(-dtOnda / 0.5)), alfa: 0.6 * Math.exp(-dtOnda / 0.45) }
    : { raio: 0, alfa: 0 }

  return {
    tempo,
    estado: estadoNascimento(tempo),
    rotacao: theta,
    inclinacao: INCLINACAO_FINAL * faixa(tempo, 6.5, 11),
    achatamento: 1 - (1 - ACHATAMENTO_FINAL) * faixa(tempo, 6.5, 11),
    zoom: lerp(ZOOM_INICIAL, 1, limitar(tempo / DURACAO_NASCIMENTO)) * (1 + 0.015 * respiro),
    luz,
    posicoes,
    anteriores,
    rastro,
    brilho,
    mistura,
    filamentosAlfa: 0.6 * faixa(tempo, 2, 4.5) * (1 - 0.72 * faixa(tempo, 4.5, 6.5)) * (1 - faixa(tempo, 6.5, 7.5)),
    nosAlfa: faixa(tempo, 2.2, 4.5) * (1 - faixa(tempo, 5.5, 7.2)),
    choque: {
      raio: lerp(0.6, 0.52, faixa(tempo, 4.5, 7)),
      alfa: 0.55 * Math.max(0, 1 - Math.abs(tempo - 6) / 1.4),
    },
    barra: 0.9 * faixa(tempo, 15.5, 17.5),
    nucleo: {
      brilho: faixa(tempo, 13, 16.5) * (0.85 + 0.15 * Math.sin((2 * Math.PI * tempo) / 2.6)),
      raio: 0.06 + 0.04 * faixa(tempo, 13, 16.5),
    },
    flashes,
    bolhas,
    formacao,
    onda,
    clarao,
    respiro,
    enrolar,
  }
}
