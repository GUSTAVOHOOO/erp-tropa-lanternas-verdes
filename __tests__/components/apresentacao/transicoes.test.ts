import { describe, expect, test } from 'vitest'
import { MOLAS, duracaoMola } from '@/components/apresentacao/mola'
import { gerarEstrelasDobra } from '@/components/apresentacao/dobra'
import { SLIDES } from '@/components/apresentacao/slides'
import {
  CATALOGO,
  PICO_LUZ,
  desenharPesada,
  ehPesada,
  escolherTransicao,
  quadroAnel,
  quadroConstructo,
  type TipoTransicao,
} from '@/components/apresentacao/transicoes'

// Tipo de cada passo para a frente (i → i+1), como o controlador escolhe.
const passos: TipoTransicao[] = SLIDES.slice(0, -1).map((_, i) => escolherTransicao(SLIDES[i].id, SLIDES[i + 1].id, i, i + 1))
const passoComCapitulo = (i: number) => SLIDES[i].capitulo === true || SLIDES[i + 1].capitulo === true
const comuns = passos.filter((_, i) => !passoComCapitulo(i))

describe('escolherTransicao', () => {
  test('é determinística: mesma entrada, mesmo tipo', () => {
    const primeira = escolherTransicao(SLIDES[3].id, SLIDES[4].id, 3, 4)
    expect(escolherTransicao(SLIDES[3].id, SLIDES[4].id, 3, 4)).toBe(primeira)
    expect(passos.map((_, i) => escolherTransicao(SLIDES[i].id, SLIDES[i + 1].id, i, i + 1))).toEqual(passos)
  })

  test('nunca repete o mesmo tipo em trocas seguidas na ordem do deck', () => {
    for (let i = 1; i < passos.length; i++) expect(passos[i], `passos ${i - 1} e ${i}`).not.toBe(passos[i - 1])
  })

  test('pesadas só aparecem quando origem ou destino é capítulo', () => {
    passos.forEach((tipo, i) => {
      if (ehPesada(tipo)) expect(passoComCapitulo(i), `passo ${i}`).toBe(true)
    })
  })

  test('todo capítulo, capa e conclusão entram e saem por pesada', () => {
    passos.forEach((_, i) => {
      if (passoComCapitulo(i)) expect(ehPesada(passos[i]), `passo ${i}`).toBe(true)
    })
  })

  test('no máximo uma média a cada três trocas comuns', () => {
    const medias = comuns.filter((tipo) => CATALOGO[tipo].peso === 'media').length
    expect(medias).toBeLessThanOrEqual(Math.floor(comuns.length / 3))
    expect(medias).toBeGreaterThan(0)
  })

  test('as demais trocas comuns são leves', () => {
    for (const tipo of comuns) expect(['media', 'leve']).toContain(CATALOGO[tipo].peso)
    expect(comuns.filter((tipo) => CATALOGO[tipo].peso === 'leve').length).toBeGreaterThan(comuns.length / 2)
  })

  test('o deck usa todos os tipos do catálogo', () => {
    expect(new Set(passos).size).toBe(Object.keys(CATALOGO).length)
  })

  test('voltar (←) usa sempre versão leve', () => {
    for (let i = 1; i < SLIDES.length; i++) {
      const tipo = escolherTransicao(SLIDES[i].id, SLIDES[i - 1].id, i, i - 1)
      expect(CATALOGO[tipo].peso, `volta de ${i}`).toBe('leve')
    }
  })

  test('saltos (visão geral) são leves sem capítulo e podem ser pesados com capítulo', () => {
    expect(CATALOGO[escolherTransicao(SLIDES[2].id, SLIDES[5].id, 2, 5)].peso).toBe('leve')
    expect(ehPesada(escolherTransicao(SLIDES[2].id, SLIDES[10].id, 2, 10))).toBe(true)
  })
})

describe('catálogo', () => {
  test('transições leves ficam em até 500 ms: entrada + mola leve', () => {
    const molaLeve = duracaoMola(MOLAS.leve) * 1000
    for (const [tipo, config] of Object.entries(CATALOGO)) {
      if (config.peso === 'leve') expect(config.entrada + molaLeve, tipo).toBeLessThanOrEqual(500)
    }
  })

  test('só as pesadas usam canvas', () => {
    for (const [tipo, config] of Object.entries(CATALOGO)) {
      expect(config.canvas !== undefined, tipo).toBe(config.peso === 'pesada')
    }
  })
})

describe('quadro do anel', () => {
  test('começa e termina sem véu nem anel', () => {
    expect(quadroAnel(0)).toMatchObject({ veu: 0, anelOpacidade: 0 })
    expect(quadroAnel(1)).toMatchObject({ veu: 0, anelOpacidade: 0 })
  })

  test('o véu cobre a tela antes de a íris abrir', () => {
    expect(quadroAnel(0.3).veu).toBe(1)
    expect(quadroAnel(0.3).buraco).toBe(0)
  })

  test('o buraco cresce sem recuar e cobre a tela no fim', () => {
    const buracos = [0.5, 0.6, 0.7, 0.8, 0.9, 1].map((t) => quadroAnel(t).buraco)
    expect(buracos).toEqual([...buracos].sort((a, b) => a - b))
    expect(quadroAnel(1).buraco).toBeGreaterThanOrEqual(0.5)
  })
})

describe('quadro do constructo', () => {
  test('traça a grade, acende a luz sólida no pico e recua', () => {
    expect(quadroConstructo(0)).toEqual({ traco: 0, grade: 0, preenchimento: 0, recuo: 0, subida: 0 })
    expect(quadroConstructo(0.3).preenchimento).toBeCloseTo(PICO_LUZ)
    expect(quadroConstructo(1)).toMatchObject({ preenchimento: 0, recuo: 1, grade: 0 })
  })

  test('a luz nunca passa do pico de opacidade', () => {
    const luzes = Array.from({ length: 101 }, (_, i) => quadroConstructo(i / 100).preenchimento)
    expect(Math.max(...luzes)).toBeLessThanOrEqual(PICO_LUZ + 1e-9)
  })

  test('o topo fica livre para o slide novo antes de a luz sumir', () => {
    expect(quadroConstructo(0.46).recuo).toBeGreaterThan(0.4)
    expect(quadroConstructo(0.46).preenchimento).toBeLessThan(PICO_LUZ)
  })

  test('o traço cresce a partir do centro', () => {
    const tracos = [0.05, 0.15, 0.25, 0.35].map((t) => quadroConstructo(t).traco)
    expect(tracos).toEqual([...tracos].sort((a, b) => a - b))
  })
})

describe('pintura canvas determinística', () => {
  // Contexto falso: registra as chamadas de desenho, sem navegador.
  function contextoFalso() {
    const chamadas: string[] = []
    const estado: Record<string, unknown> = {}
    const ctx = new Proxy(estado, {
      get(alvo, nome: string) {
        if (nome in alvo) return alvo[nome]
        return (...argumentos: unknown[]) => {
          chamadas.push(`${nome}(${argumentos.map(String).join(',')})`)
          return { addColorStop: () => undefined }
        }
      },
      set(alvo, nome: string, valor) {
        alvo[nome] = valor
        return true
      },
    })
    return { ctx: ctx as unknown as CanvasRenderingContext2D, chamadas }
  }
  const cores = { energia: '#3cff8a', texto: '#f0fff4', fundo: '#020805' }

  test('mesmo t, mesmas chamadas de desenho (anel e constructo)', () => {
    for (const tipo of ['anel', 'constructo', 'dobra'] as const) {
      const estrelas = gerarEstrelasDobra(80, 5)
      const a = contextoFalso()
      const b = contextoFalso()
      desenharPesada(a.ctx, tipo, 0.42, 1920, 1080, estrelas, cores)
      desenharPesada(b.ctx, tipo, 0.42, 1920, 1080, estrelas, cores)
      expect(a.chamadas, tipo).toEqual(b.chamadas)
    }
  })

  test('no fim do anel só limpa o canvas', () => {
    const { ctx, chamadas } = contextoFalso()
    desenharPesada(ctx, 'anel', 1, 1920, 1080, [], cores)
    expect(chamadas).toEqual(['clearRect(0,0,1920,1080)'])
  })

  test('no meio do constructo há luz sólida desenhada', () => {
    const { ctx, chamadas } = contextoFalso()
    desenharPesada(ctx, 'constructo', 0.5, 1920, 1080, [], cores)
    expect(chamadas.some((linha) => linha.startsWith('fillRect'))).toBe(true)
  })
})
