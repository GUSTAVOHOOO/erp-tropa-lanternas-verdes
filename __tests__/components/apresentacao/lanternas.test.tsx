import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { constructosLanternas } from '@/components/oanet/GaleriaConstructos'
import {
  CAPITULOS,
  CamadaLanternas,
  ChamadaTropa,
  ehCapitulo,
  escolherPadraoVoo,
  gerarSemente,
} from '@/components/apresentacao/lanternas'

describe('CamadaLanternas e padrões de voo', () => {
  beforeEach(() => {
    // Por padrão nos testes unitários, simula movimento habilitado.
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  test('a função de semente e seleção de padrão é 100% determinística', () => {
    const s1 = gerarSemente('capa', 1000)
    const s2 = gerarSemente('capa', 1000)
    expect(s1).toBe(s2)

    const p1 = escolherPadraoVoo('capa', 1000, null)
    const p2 = escolherPadraoVoo('capa', 1000, null)
    expect(p1?.id).toBe(p2?.id)
    expect(p1?.nome).toBe(p2?.nome)
  })

  test('padrões consecutivos nunca se repetem', () => {
    for (const capitulo of CAPITULOS) {
      const primeiro = escolherPadraoVoo(capitulo, 100, null)
      expect(primeiro).not.toBeNull()

      // Mesmo com a mesma chave ou chave diferente, passando o padrão anterior, ele não repete
      const segundo = escolherPadraoVoo(capitulo, 100, primeiro!.id)
      expect(segundo).not.toBeNull()
      expect(segundo!.id).not.toBe(primeiro!.id)

      const terceiro = escolherPadraoVoo(capitulo, 200, segundo!.id)
      expect(terceiro).not.toBeNull()
      expect(terceiro!.id).not.toBe(segundo!.id)
    }
  })

  test('capítulos sempre recebem formações vistosas de esquadrão', () => {
    for (const id of CAPITULOS) {
      expect(ehCapitulo(id)).toBe(true)
      const padrao = escolherPadraoVoo(id, 42, null)
      expect(padrao).not.toBeNull()
      expect(padrao!.vistoso).toBe(true)
      expect(padrao!.cometas.length).toBeGreaterThanOrEqual(2)
    }
  })

  test('slides técnicos comuns seguem moderação (discretos ou ausentes)', () => {
    const slideComum = 'visao-geral'
    expect(ehCapitulo(slideComum)).toBe(false)

    // Testa uma série de chaves sucessivas para verificar a moderação (~1 em cada 3)
    let nulos = 0
    let exibidos = 0
    for (let c = 0; c < 30; c++) {
      const padrao = escolherPadraoVoo(slideComum, c * 50, null)
      if (padrao === null) {
        nulos++
      } else {
        exibidos++
        expect(padrao.vistoso).toBe(false)
        expect(padrao.cometas.length).toBeLessThanOrEqual(2)
      }
    }
    expect(nulos).toBeGreaterThan(0)
    expect(exibidos).toBeGreaterThan(0)
  })

  test('CamadaLanternas não renderiza nada com movimento reduzido (prefers-reduced-motion)', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { container } = render(<CamadaLanternas slideId="capa" chave={1} />)
    expect(container.firstChild).toBeNull()
  })

  test('CamadaLanternas renderiza cometas acessíveis em tela inteira quando permitido', () => {
    const { container } = render(<CamadaLanternas slideId="capa" chave={1} />)
    const camada = container.querySelector('.dk-lanternas-camada')
    expect(camada).not.toBeNull()
    expect(camada?.getAttribute('aria-hidden')).toBe('true')

    const cometas = container.querySelectorAll('.dk-lanterna-cometa')
    expect(cometas.length).toBeGreaterThanOrEqual(2)
  })
})

describe('ChamadaTropa', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  test('renderiza os 25 Lanternas com nomes em lista acessível', () => {
    render(<ChamadaTropa />)

    const lista = screen.getByRole('list', { name: 'Os 25 Lanternas da Tropa' })
    expect(lista).toBeDefined()

    const itens = screen.getAllByRole('listitem')
    expect(itens).toHaveLength(25)
    expect(constructosLanternas).toHaveLength(25)

    for (const lanterna of constructosLanternas) {
      expect(screen.getByText(lanterna.nome)).toBeDefined()
    }
  })

  test('cada membro possui anel com insígnia SVG e ordem de ativação em onda', () => {
    const { container } = render(<ChamadaTropa />)

    const membros = container.querySelectorAll('.dk-tropa-membro')
    expect(membros).toHaveLength(25)

    membros.forEach((membro, indice) => {
      const estilo = membro.getAttribute('style')
      expect(estilo).toContain(`--dk-ordem: ${indice}`)

      const anel = membro.querySelector('.dk-tropa-anel')
      expect(anel).not.toBeNull()

      const svg = anel?.querySelector('svg.dk-tropa-svg')
      expect(svg).not.toBeNull()
    })
  })
})
