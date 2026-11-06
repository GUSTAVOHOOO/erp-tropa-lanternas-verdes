export type ParticulaGalaxia = {
  x: number
  y: number
  z: number
  tamanho: number
  brilho: number
  poeira: boolean
  fase: number
}

/** Evita diferenças de ponto flutuante entre servidor e navegador no SVG inicial. */
export function formatarAtributoGalaxia(valor: number): string {
  return (Math.round(valor * 1e6) / 1e6).toFixed(6)
}

/** Geometria normalizada e reproduzível: quatro braços, bojo central e poeira. */
export function gerarParticulasGalaxia(quantidade = 4200, semente = 2814): ParticulaGalaxia[] {
  const total = Number.isFinite(quantidade) ? Math.max(0, Math.min(4500, Math.floor(quantidade))) : 0
  let estado = semente | 0
  const aleatorio = () => {
    estado += 0x6d2b79f5
    let valor = estado
    valor = Math.imul(valor ^ (valor >>> 15), valor | 1)
    valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61)
    return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296
  }

  return Array.from({ length: total }, (_, indice) => {
    const central = indice % 5 === 0
    const raio = central ? Math.pow(aleatorio(), 1.9) * 0.3 : Math.pow(aleatorio(), 0.65)
    const dispersao = (aleatorio() + aleatorio() + aleatorio() - 1.5) * (central ? 2.2 : 0.36)
    const angulo = (indice % 4) * Math.PI / 2 + raio * 7.6 + dispersao
    return {
      x: Math.cos(angulo) * raio,
      y: Math.sin(angulo) * raio,
      z: (aleatorio() - 0.5) * 0.15 * (1 - raio * 0.7),
      tamanho: 0.35 + Math.pow(aleatorio(), 5) * 1.7,
      brilho: 0.18 + aleatorio() * 0.82,
      poeira: indice % 3 !== 0,
      fase: aleatorio() * Math.PI * 2,
    }
  })
}
