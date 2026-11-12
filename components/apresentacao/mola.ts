/**
 * Molas em forma fechada para as animações da apresentação.
 *
 * A posição de uma mola amortecida é calculada direto pelo tempo, sem simular
 * quadro a quadro: o mesmo `t` sempre devolve o mesmo valor. A curva vira uma
 * função `linear()` do CSS, então o navegador anima sem JavaScript por quadro.
 */
export type Mola = { rigidez: number; amortecimento: number; massa?: number }

const TOLERANCIA = 0.001

/** Posição normalizada (0 → 1) da mola no instante `t`, em segundos. */
export function posicaoMola(t: number, { rigidez, amortecimento, massa = 1 }: Mola): number {
  if (t <= 0) return 0
  const w0 = Math.sqrt(rigidez / massa)
  const zeta = amortecimento / (2 * Math.sqrt(rigidez * massa))
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    const envelope = Math.exp(-zeta * w0 * t)
    return 1 - envelope * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t))
  }
  if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t)
  const raiz = Math.sqrt(zeta * zeta - 1)
  const r1 = -w0 * (zeta - raiz)
  const r2 = -w0 * (zeta + raiz)
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
}

/** Tempo, em segundos, a partir do qual a mola fica dentro da tolerância até o fim. */
export function duracaoMola(mola: Mola, limite = 5): number {
  const passo = 1 / 240
  let ultimoFora = 0
  for (let t = 0; t <= limite; t += passo) {
    if (Math.abs(1 - posicaoMola(t, mola)) > TOLERANCIA) ultimoFora = t
  }
  return Math.min(limite, ultimoFora + passo)
}

/** Curva `linear()` do CSS com precisão fixa: igual no servidor e no navegador. */
export function curvaMola(mola: Mola, amostras = 40): string {
  const duracao = duracaoMola(mola)
  const pontos: string[] = []
  for (let i = 0; i <= amostras; i++) {
    const valor = i === amostras ? 1 : posicaoMola((duracao * i) / amostras, mola)
    pontos.push(valor.toFixed(4))
  }
  return `linear(${pontos.join(', ')})`
}

export const MOLAS = {
  /** Chegada firme, quase sem sobra: textos e painéis. */
  firme: { rigidez: 210, amortecimento: 26 },
  /** Sobra visível: números, selos e construtos. */
  elastica: { rigidez: 170, amortecimento: 13 },
  /** Lenta e pesada: capítulos e a capa. */
  pesada: { rigidez: 60, amortecimento: 14 },
  /** Criticamente amortecida: contadores sobem sem passar do valor. */
  contagem: { rigidez: 36, amortecimento: 12 },
} satisfies Record<string, Mola>

/** Variáveis CSS com curva e duração de cada mola, calculadas uma vez. */
export const variaveisMolas: Record<string, string> = Object.fromEntries(
  Object.entries(MOLAS).flatMap(([nome, mola]) => [
    [`--dk-mola-${nome}`, curvaMola(mola)],
    [`--dk-mola-${nome}-ms`, `${Math.round(duracaoMola(mola) * 1000)}ms`],
  ]),
)
