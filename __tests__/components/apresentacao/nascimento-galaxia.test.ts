import { describe, expect, test } from 'vitest'
import { gerarParticulasGalaxia } from '@/components/oanet/galaxia'
import {
  DURACAO_NASCIMENTO,
  ESTADOS_NASCIMENTO,
  estadoNascimento,
  obterCenaGalaxia,
  quadroGalaxia,
  rotacaoGlobal,
  velocidadeAngularColapso,
} from '@/components/apresentacao/nascimento-galaxia'

const cena = obterCenaGalaxia()

/** Raio no plano (invariante à rotação do disco). */
const raioDe = (quadro: ReturnType<typeof quadroGalaxia>, i: number) =>
  Math.hypot(quadro.posicoes[3 * i], quadro.posicoes[3 * i + 1])

const raioMedio = (quadro: ReturnType<typeof quadroGalaxia>) => {
  let soma = 0
  for (let i = 0; i < cena.total; i++) soma += raioDe(quadro, i)
  return soma / cena.total
}

describe('cena e contagem', () => {
  test('tem 4.500 partículas, a mesma galáxia final do site', () => {
    expect(cena.total).toBe(4500)
    const quadro = quadroGalaxia(DURACAO_NASCIMENTO)
    expect(quadro.posicoes.length).toBe(4500 * 3)
    expect(quadro.brilho.length).toBe(4500)
  })

  test('os grupos de partida somam o total', () => {
    const contagem = [0, 0, 0, 0]
    for (let i = 0; i < cena.total; i++) contagem[cena.grupo[i]]++
    expect(contagem[3]).toBe(200) // satélite
    expect(contagem[1]).toBe(800) // teia
    expect(contagem[2]).toBe(1000) // queda
    expect(contagem[0]).toBe(2500) // campo de fundo
  })

  test('o campo começa com ~900 grãos visíveis em t = 0', () => {
    const quadro = quadroGalaxia(0)
    let visiveis = 0
    for (let i = 0; i < cena.total; i++) if (quadro.brilho[i] > 0.02) visiveis++
    expect(visiveis).toBeGreaterThan(800)
    expect(visiveis).toBeLessThan(1000)
  })
})

describe('determinismo', () => {
  test('o mesmo t gera o mesmo quadro', () => {
    const a = quadroGalaxia(5)
    const b = quadroGalaxia(5)
    expect(Array.from(a.posicoes)).toEqual(Array.from(b.posicoes))
    expect(Array.from(a.brilho)).toEqual(Array.from(b.brilho))
    expect(Array.from(a.mistura)).toEqual(Array.from(b.mistura))
  })

  test('a cena é reproduzível com as mesmas sementes', () => {
    const quadro = quadroGalaxia(12)
    expect(Array.from(quadro.posicoes.slice(0, 300))).toEqual(
      Array.from(quadroGalaxia(12, obterCenaGalaxia()).posicoes.slice(0, 300)),
    )
  })

  test('nenhum brilho passa de 0,9 (sem saturar)', () => {
    for (let t = 0; t <= 24; t += 0.5) {
      const quadro = quadroGalaxia(t)
      for (let i = 0; i < cena.total; i++) expect(quadro.brilho[i]).toBeLessThanOrEqual(0.9)
    }
  })
})

describe('sequência', () => {
  test('os estados vão de 0 a 7 na ordem certa', () => {
    expect(estadoNascimento(0)).toBe(0)
    expect(estadoNascimento(4.6)).toBe(2)
    expect(estadoNascimento(9)).toBe(3)
    expect(estadoNascimento(18.5)).toBe(7)
    expect(estadoNascimento(40)).toBe(7)
    expect(ESTADOS_NASCIMENTO.length).toBe(8)
  })

  test('o raio médio diminui durante o colapso', () => {
    const r7 = raioMedio(quadroGalaxia(7))
    const r85 = raioMedio(quadroGalaxia(8.5))
    const r10 = raioMedio(quadroGalaxia(10))
    expect(r85).toBeLessThan(r7)
    expect(r10).toBeLessThan(r85)
  })

  test('a velocidade angular é maior perto do centro', () => {
    expect(velocidadeAngularColapso(0.2, 0.6)).toBeGreaterThan(velocidadeAngularColapso(0.9, 0.6))
    expect(velocidadeAngularColapso(0.3, 0.6)).toBeGreaterThan(velocidadeAngularColapso(0.6, 0.6))
  })

  test('a rotação do disco avança 0,012 rad/s depois do fim da montagem', () => {
    expect(rotacaoGlobal(DURACAO_NASCIMENTO) + 0.38).toBeCloseTo(0, 9)
    expect(rotacaoGlobal(DURACAO_NASCIMENTO + 10) - rotacaoGlobal(DURACAO_NASCIMENTO)).toBeCloseTo(0.12, 9)
  })

  test('os braços ficam mais contrastados em 14 s do que em 9 s', () => {
    const desvio = (t: number) => {
      const q = quadroGalaxia(t)
      let soma = 0
      let soma2 = 0
      let cont = 0
      for (let i = 0; i < cena.total; i++) {
        if (cena.bojo[i]) continue
        soma += q.brilho[i]
        soma2 += q.brilho[i] ** 2
        cont++
      }
      const media = soma / cont
      return Math.sqrt(soma2 / cont - media * media)
    }
    expect(desvio(14)).toBeGreaterThan(desvio(9))
  })

  test('há 28 nós de formação estelar e o clarão e a onda só existem depois de 10 s', () => {
    expect(cena.formacao.length).toBe(28)
    expect(quadroGalaxia(9).onda.alfa).toBe(0)
    expect(quadroGalaxia(10.3).onda.alfa).toBeGreaterThan(0.1)
    expect(quadroGalaxia(10.3).clarao).toBeGreaterThan(0.1)
    expect(quadroGalaxia(14).formacao.length).toBeGreaterThan(0)
  })

  test('os flashes Pop III acendem e se apagam', () => {
    expect(quadroGalaxia(11).flashes.length).toBeGreaterThan(0)
    // O último flash (t ≤ 11,8 s) já apagou a partir de 14 s.
    expect(quadroGalaxia(14).flashes.length).toBe(0)
  })
})

describe('fase final estável', () => {
  test('depois de 18,5 s o raio de cada partícula não muda', () => {
    const a = quadroGalaxia(18.5)
    const b = quadroGalaxia(21)
    for (let i = 0; i < cena.total; i += 37) {
      expect(Math.abs(raioDe(a, i) - raioDe(b, i))).toBeLessThan(1e-6)
    }
  })

  test('depois de 18,5 s o disco gira como corpo rígido (diferenças angulares fixas)', () => {
    const angulo = (quadro: ReturnType<typeof quadroGalaxia>, i: number) =>
      Math.atan2(quadro.posicoes[3 * i + 1], quadro.posicoes[3 * i])
    const a = quadroGalaxia(19)
    const b = quadroGalaxia(22)
    const dA = angulo(a, 10) - angulo(a, 2000)
    const dB = angulo(b, 10) - angulo(b, 2000)
    expect(Math.abs(Math.atan2(Math.sin(dA - dB), Math.cos(dA - dB)))).toBeLessThan(1e-6)
  })

  test('em t = 22 s o quadro coincide com o mapa do site (projeção de GalaxiaProcedural)', () => {
    const quadro = quadroGalaxia(DURACAO_NASCIMENTO)
    const finais = gerarParticulasGalaxia(4500, 2814)
    const rotacao = -0.38
    for (let i = 0; i < cena.total; i += 97) {
      // Cada partícula ocupa a posição do site indicada em `indiceFinal`.
      const { x, y, z } = finais[cena.indiceFinal[i]]
      const esperadoX = x * Math.cos(rotacao) - y * Math.sin(rotacao)
      const esperadoY = x * Math.sin(rotacao) + y * Math.cos(rotacao)
      expect(quadro.posicoes[3 * i]).toBeCloseTo(esperadoX, 6)
      expect(quadro.posicoes[3 * i + 1]).toBeCloseTo(esperadoY, 6)
      // z ainda tem um resíduo de exp(−12,5) × espessura, menor que 1e-5.
      expect(quadro.posicoes[3 * i + 2]).toBeCloseTo(z, 5)
    }
    expect(quadro.inclinacao).toBeCloseTo(-0.23, 9)
    expect(quadro.achatamento).toBeCloseTo(0.43, 9)
    expect(quadro.zoom).toBeCloseTo(1, 9)
  })
})

describe('movimento suave', () => {
  test('nenhuma partícula dá salto entre quadros a 60 fps', () => {
    const passo = 1 / 60
    let anterior = quadroGalaxia(0)
    let maior = 0
    for (let t = passo; t <= DURACAO_NASCIMENTO; t += passo) {
      const atual = quadroGalaxia(t)
      for (let i = 0; i < cena.total; i++) {
        const dx = atual.posicoes[3 * i] - anterior.posicoes[3 * i]
        const dy = atual.posicoes[3 * i + 1] - anterior.posicoes[3 * i + 1]
        maior = Math.max(maior, Math.hypot(dx, dy))
      }
      anterior = atual
    }
    expect(maior).toBeLessThan(0.05)
  })
})
