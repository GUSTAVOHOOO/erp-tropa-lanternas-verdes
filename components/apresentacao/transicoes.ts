import { SLIDES } from './slides'
import { desenharDobra, type CoresDobra, type EstrelaDobra } from './dobra'

/*
 * Catálogo de transições entre slides, com pesos:
 * - pesadas (canvas): capítulos, capa e conclusão; alternam entre si;
 * - médias: o feixe e duas variações em CSS, no máximo 1 a cada 3 trocas comuns;
 * - leves (CSS, até 500 ms): o resto das trocas comuns.
 * Voltar (←) usa sempre uma versão leve. Movimento reduzido não tem transição.
 *
 * Tudo é função pura: mesma entrada, mesma saída. Os quadros canvas são `quadroX(t)`
 * (estado numérico) e `desenharX(ctx, t, …)` (pinta esse estado), como em dobra.ts.
 */

export type TipoTransicao =
  | 'dobra' | 'anel' | 'constructo'
  | 'feixe' | 'fatias' | 'grade'
  | 'suave' | 'foco' | 'deriva' | 'pulso'

export type Peso = 'pesada' | 'media' | 'leve'

/** `saida`: quando o slide anterior sai do DOM. `entrada`: atraso do slide novo (--dk-atraso-slide). `canvas`: duração do quadro. */
export const CATALOGO: Record<TipoTransicao, { peso: Peso; saida: number; entrada: number; canvas?: number }> = {
  dobra: { peso: 'pesada', saida: 900, entrada: 900, canvas: 1500 },
  anel: { peso: 'pesada', saida: 320, entrada: 540, canvas: 1400 },
  constructo: { peso: 'pesada', saida: 700, entrada: 600, canvas: 1300 },
  feixe: { peso: 'media', saida: 650, entrada: 260 },
  fatias: { peso: 'media', saida: 300, entrada: 300 },
  grade: { peso: 'media', saida: 300, entrada: 260 },
  suave: { peso: 'leve', saida: 200, entrada: 140 },
  foco: { peso: 'leve', saida: 200, entrada: 110 },
  deriva: { peso: 'leve', saida: 240, entrada: 90 },
  pulso: { peso: 'leve', saida: 160, entrada: 70 },
}

const PESADAS: TipoTransicao[] = ['dobra', 'anel', 'constructo']
const MEDIAS: TipoTransicao[] = ['feixe', 'fatias', 'grade']
const LEVES: TipoTransicao[] = ['suave', 'foco', 'deriva', 'pulso']

const limitar = (valor: number, min = 0, max = 1) => Math.min(max, Math.max(min, valor))
const faixa = (t: number, inicio: number, fim: number) => limitar((t - inicio) / (fim - inicio))
const saidaCubica = (x: number) => 1 - (1 - x) ** 3

/**
 * Plano dos passos para a frente (i → i+1). Passo com capítulo na ponta é pesado e
 * os pesados giram em ciclo. Entre os comuns, cada terceiro é média; o resto é leve.
 * Dois passos seguidos nunca repetem o tipo.
 */
function planejar(capitulos: boolean[]): TipoTransicao[] {
  const plano: TipoTransicao[] = []
  let pesadas = 0
  let comuns = 0
  let medias = 0
  let leves = 0
  for (let i = 0; i < capitulos.length - 1; i++) {
    if (capitulos[i] || capitulos[i + 1]) {
      plano.push(PESADAS[pesadas++ % PESADAS.length])
      continue
    }
    plano.push(comuns % 3 === 2 ? MEDIAS[medias++ % MEDIAS.length] : LEVES[leves++ % LEVES.length])
    comuns++
  }
  return plano
}

const PLANO = planejar(SLIDES.map((slide) => slide.capitulo === true))

const capitulo = (id: string) => SLIDES.find((slide) => slide.id === id)?.capitulo === true

/**
 * Tipo da troca de `indiceOrigem` para `indiceDestino`.
 * Voltar usa leve; avanço de um slide segue o plano; saltos (visão geral) são leves,
 * exceto quando origem ou destino é capítulo, que então pode usar pesada.
 */
export function escolherTransicao(origemId: string, destinoId: string, indiceOrigem: number, indiceDestino: number): TipoTransicao {
  if (indiceDestino < indiceOrigem) return LEVES[indiceDestino % LEVES.length]
  if (indiceDestino === indiceOrigem + 1 && indiceOrigem >= 0 && indiceOrigem < PLANO.length) return PLANO[indiceOrigem]
  if (capitulo(origemId) || capitulo(destinoId)) return PESADAS[indiceDestino % PESADAS.length]
  return LEVES[indiceDestino % LEVES.length]
}

export function ehPesada(tipo: TipoTransicao) {
  return CATALOGO[tipo].peso === 'pesada'
}

/* ---------- anel: o anel do Lanterna carrega e se abre como íris ---------- */

export type QuadroAnel = {
  /** Opacidade do véu de tinta que cobre o slide que sai. */
  veu: number
  /** Raio do buraco da íris, em fração da diagonal (0 = fechada). */
  buraco: number
  /** Raio do anel de energia, em fração da diagonal. */
  anelRaio: number
  anelOpacidade: number
  /** Opacidade dos arcos que giram enquanto o anel carrega. */
  arcoOpacidade: number
  /** Ângulo de giro dos arcos, em radianos. */
  giro: number
}

/** Raio do anel enquanto carrega, em fração da diagonal. */
const RAIO_CARGA = 0.05

export function quadroAnel(t: number): QuadroAnel {
  const p = limitar(t)
  const carga = faixa(p, 0.16, 0.4)
  const abertura = saidaCubica(faixa(p, 0.36, 1))
  const buraco = abertura * 0.52
  return {
    veu: saidaCubica(faixa(p, 0, 0.18)) * (1 - faixa(p, 0.9, 1)),
    buraco,
    anelRaio: RAIO_CARGA * (1 - abertura) + buraco,
    anelOpacidade: faixa(p, 0, 0.1) * (1 - faixa(p, 0.92, 1)),
    arcoOpacidade: faixa(p, 0.14, 0.22) * (1 - faixa(p, 0.36, 0.5)),
    giro: p * Math.PI * 6 * (0.4 + 0.6 * carga),
  }
}

/* ---------- constructo: grade que se traça e vira luz sólida ---------- */

export type QuadroConstructo = {
  /** Quanto as linhas da grade já cresceram a partir do centro (0 → 1). */
  traco: number
  /** Opacidade das linhas da grade. */
  grade: number
  /** Cobertura da luz sólida (0 → 1). */
  preenchimento: number
  /** Altura de recuo do topo, de cima para baixo (0 → 1): revela o slide novo. */
  recuo: number
  /** Altura de subida da luz, de baixo para cima (0 → 1). */
  subida: number
}

/** Pico de opacidade da luz sólida: forte o bastante para marcar a troca, sem estourar a tela. */
export const PICO_LUZ = 0.42

export function quadroConstructo(t: number): QuadroConstructo {
  const p = limitar(t)
  return {
    traco: faixa(p, 0, 0.3),
    grade: faixa(p, 0, 0.1) * (1 - faixa(p, 0.4, 0.7)),
    preenchimento: PICO_LUZ * saidaCubica(faixa(p, 0.06, 0.2)) * (1 - faixa(p, 0.42, 0.7)),
    subida: faixa(p, 0.06, 0.26),
    recuo: saidaCubica(faixa(p, 0.26, 0.9)),
  }
}

const COLUNAS = 16
const LINHAS = 9

/* ---------- pintura ---------- */

function desenharAnel(contexto: CanvasRenderingContext2D, t: number, largura: number, altura: number, cores: CoresDobra) {
  const quadro = quadroAnel(t)
  const cx = largura / 2
  const cy = altura / 2
  const diagonal = Math.hypot(largura, altura)
  contexto.clearRect(0, 0, largura, altura)
  if (quadro.veu <= 0 && quadro.anelOpacidade <= 0) return

  // Véu de tinta com um buraco que se abre no centro.
  contexto.globalAlpha = quadro.veu
  contexto.fillStyle = cores.fundo
  contexto.fillRect(0, 0, largura, altura)
  if (quadro.buraco > 0) {
    contexto.globalCompositeOperation = 'destination-out'
    contexto.globalAlpha = 1
    contexto.beginPath()
    contexto.arc(cx, cy, quadro.buraco * diagonal, 0, Math.PI * 2)
    contexto.fill()
    contexto.globalCompositeOperation = 'source-over'
  }

  // Anel: três traços concêntricos, como no anel da dobra.
  contexto.strokeStyle = cores.energia
  for (const [espessura, opacidade] of [[26, 0.12], [9, 0.35], [2.5, 1]] as const) {
    contexto.globalAlpha = quadro.anelOpacidade * opacidade
    contexto.lineWidth = espessura
    contexto.beginPath()
    contexto.arc(cx, cy, quadro.anelRaio * diagonal, 0, Math.PI * 2)
    contexto.stroke()
  }

  // Arcos de carga: três setores que giram enquanto o anel enche.
  contexto.lineCap = 'round'
  contexto.lineWidth = 6
  contexto.strokeStyle = cores.texto
  contexto.globalAlpha = quadro.arcoOpacidade
  for (let k = 0; k < 3; k++) {
    const inicio = quadro.giro + (k * Math.PI * 2) / 3
    contexto.beginPath()
    contexto.arc(cx, cy, RAIO_CARGA * diagonal, inicio, inicio + Math.PI * 0.45)
    contexto.stroke()
  }
  contexto.globalAlpha = 1
}

function desenharConstructo(contexto: CanvasRenderingContext2D, t: number, largura: number, altura: number, cores: CoresDobra) {
  const quadro = quadroConstructo(t)
  const cx = largura / 2
  const cy = altura / 2
  contexto.clearRect(0, 0, largura, altura)
  if (quadro.grade <= 0 && quadro.preenchimento <= 0) return

  // Grade: linhas que crescem do centro para as bordas.
  contexto.strokeStyle = cores.energia
  contexto.lineWidth = 1.5
  contexto.globalAlpha = quadro.grade * 0.7
  for (let i = 0; i <= COLUNAS; i++) {
    const x = (largura * i) / COLUNAS
    if (Math.abs(x - cx) / (largura / 2) > quadro.traco) continue
    contexto.beginPath()
    contexto.moveTo(x, 0)
    contexto.lineTo(x, altura)
    contexto.stroke()
  }
  for (let j = 0; j <= LINHAS; j++) {
    const y = (altura * j) / LINHAS
    if (Math.abs(y - cy) / (altura / 2) > quadro.traco) continue
    contexto.beginPath()
    contexto.moveTo(0, y)
    contexto.lineTo(largura, y)
    contexto.stroke()
  }

  // Luz sólida que cobre a tela e recua de cima para baixo.
  if (quadro.preenchimento > 0) {
    // A luz sobe por baixo e recua pelo topo: nunca cobre a tela inteira por muito tempo.
    const topo = altura * Math.max(quadro.recuo, 1 - quadro.subida)
    const luz = contexto.createLinearGradient(0, topo, 0, altura)
    luz.addColorStop(0, cores.energia)
    luz.addColorStop(1, cores.energia)
    contexto.globalAlpha = quadro.preenchimento
    contexto.fillStyle = luz
    contexto.fillRect(0, topo, largura, altura - topo)
    // Borda de luz na frente que recua: a única parte clara da luz.
    contexto.globalAlpha = Math.min(1, quadro.preenchimento * 1.5)
    contexto.fillStyle = cores.texto
    contexto.fillRect(0, Math.max(0, topo - 3), largura, 3)
  }
  contexto.globalAlpha = 1
}

/** Pinta o quadro `t` de uma transição pesada. Os tipos leves e médios não usam canvas. */
export function desenharPesada(
  contexto: CanvasRenderingContext2D,
  tipo: TipoTransicao,
  t: number,
  largura: number,
  altura: number,
  estrelas: EstrelaDobra[],
  cores: CoresDobra,
) {
  if (tipo === 'dobra') desenharDobra(contexto, t, largura, altura, estrelas, cores)
  else if (tipo === 'anel') desenharAnel(contexto, t, largura, altura, cores)
  else if (tipo === 'constructo') desenharConstructo(contexto, t, largura, altura, cores)
}
