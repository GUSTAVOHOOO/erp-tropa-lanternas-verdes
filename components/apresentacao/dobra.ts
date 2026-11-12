/**
 * Dobra espacial: a transição entre capítulos.
 *
 * Tudo é função do progresso `t` (0 → 1). `quadroDobra(t)` diz o estado de
 * cada camada e `desenharDobra` pinta esse estado. Pedir o mesmo `t` duas
 * vezes desenha o mesmo quadro, como num renderizador por `seek(t)`.
 */
export type EstrelaDobra = { angulo: number; raio: number; velocidade: number; brilho: number }
export type CoresDobra = { energia: string; texto: string; fundo: string }
export type QuadroDobra = {
  /** Opacidade do véu escuro que cobre a troca de slide. */
  veu: number
  /** Quanto as estrelas já avançaram em direção à câmera. */
  avanco: number
  /** Comprimento relativo dos rastros. */
  rastro: number
  /** Raio do anel de energia, em fração da diagonal. */
  anel: number
  anelOpacidade: number
  /** Clarão no centro, no instante do salto. */
  clarao: number
}

const limitar = (valor: number, min = 0, max = 1) => Math.min(max, Math.max(min, valor))
const faixa = (t: number, inicio: number, fim: number) => limitar((t - inicio) / (fim - inicio))
const entradaCubica = (x: number) => x * x * x
const saidaCubica = (x: number) => 1 - (1 - x) ** 3

/** Estrelas fixas por semente: o mesmo campo em toda transição. */
export function gerarEstrelasDobra(quantidade = 460, semente = 2814): EstrelaDobra[] {
  let estado = semente >>> 0
  const sortear = () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0
    return estado / 4294967296
  }
  return Array.from({ length: quantidade }, () => ({
    angulo: sortear() * Math.PI * 2,
    raio: 0.02 + sortear() ** 1.6 * 0.5,
    velocidade: 0.6 + sortear() * 0.9,
    brilho: 0.35 + sortear() * 0.65,
  }))
}

/** Estado numérico de cada camada no progresso `t`. */
export function quadroDobra(t: number): QuadroDobra {
  const p = limitar(t)
  const salto = faixa(p, 0.08, 0.62)
  const anel = faixa(p, 0.5, 1)
  return {
    veu: faixa(p, 0, 0.18) * (1 - faixa(p, 0.72, 1)),
    avanco: entradaCubica(salto),
    rastro: 0.04 + entradaCubica(salto) * 0.5,
    anel: saidaCubica(anel),
    anelOpacidade: anel > 0 ? 1 - anel : 0,
    clarao: Math.max(0, 1 - Math.abs(p - 0.56) / 0.12),
  }
}

/** Pinta o quadro `t` no canvas inteiro. */
export function desenharDobra(
  contexto: CanvasRenderingContext2D,
  t: number,
  largura: number,
  altura: number,
  estrelas: EstrelaDobra[],
  cores: CoresDobra,
) {
  const quadro = quadroDobra(t)
  const cx = largura / 2
  const cy = altura / 2
  const diagonal = Math.hypot(largura, altura)
  contexto.clearRect(0, 0, largura, altura)
  if (quadro.veu <= 0 && quadro.anelOpacidade <= 0) return

  contexto.globalAlpha = quadro.veu * 0.92
  contexto.fillStyle = cores.fundo
  contexto.fillRect(0, 0, largura, altura)

  contexto.globalCompositeOperation = 'lighter'
  contexto.lineCap = 'round'
  for (const estrela of estrelas) {
    const distancia = estrela.raio * (1 + quadro.avanco * 9 * estrela.velocidade) * diagonal
    const inicio = distancia * (1 - quadro.rastro * estrela.velocidade)
    const cos = Math.cos(estrela.angulo)
    const sen = Math.sin(estrela.angulo)
    contexto.globalAlpha = quadro.veu * estrela.brilho
    contexto.strokeStyle = estrela.brilho > 0.85 ? cores.texto : cores.energia
    contexto.lineWidth = 0.6 + quadro.avanco * 2.2 * estrela.brilho
    contexto.beginPath()
    contexto.moveTo(cx + cos * inicio, cy + sen * inicio)
    contexto.lineTo(cx + cos * distancia, cy + sen * distancia)
    contexto.stroke()
  }

  if (quadro.clarao > 0) {
    const raio = diagonal * (0.08 + quadro.clarao * 0.22)
    const luz = contexto.createRadialGradient(cx, cy, 0, cx, cy, raio)
    luz.addColorStop(0, cores.texto)
    luz.addColorStop(0.25, cores.energia)
    luz.addColorStop(1, 'transparent')
    contexto.globalAlpha = quadro.clarao * 0.85
    contexto.fillStyle = luz
    contexto.fillRect(0, 0, largura, altura)
  }

  if (quadro.anelOpacidade > 0) {
    const raio = quadro.anel * diagonal * 0.62
    contexto.globalAlpha = quadro.anelOpacidade
    contexto.strokeStyle = cores.energia
    for (const [espessura, opacidade] of [[26, 0.12], [9, 0.35], [2.5, 1]] as const) {
      contexto.globalAlpha = quadro.anelOpacidade * opacidade
      contexto.lineWidth = espessura
      contexto.beginPath()
      contexto.arc(cx, cy, raio, 0, Math.PI * 2)
      contexto.stroke()
    }
  }

  contexto.globalCompositeOperation = 'source-over'
  contexto.globalAlpha = 1
}
