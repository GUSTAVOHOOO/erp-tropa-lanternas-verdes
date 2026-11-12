import { render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import {
  Cartoes, Codigo, Contador, Lista, Painel, TabelaProva, TabelaRegras, Titulo,
} from '@/components/apresentacao/blocos'

beforeEach(() => {
  // jsdom não tem matchMedia; "reduzir movimento" desliga a contagem por quadros no teste.
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
})

const frase = 'Central de Oa'

test('Titulo tem a classe da variante e mantém a frase inteira no nome acessível', () => {
  const variantes = ['letra', 'mascara', 'palavras', 'terminal'] as const
  for (const variante of variantes) {
    const { unmount } = render(<Titulo texto={frase} variante={variante} />)
    const titulo = screen.getByRole('heading', { name: frase })
    expect(titulo.className).toContain(`dk-titulo--${variante}`)
    unmount()
  }
})

test('Titulo sem variante usa letra a letra, e as letras ficam fora da leitura de tela', () => {
  render(<Titulo texto="Ab cd" />)
  const titulo = screen.getByRole('heading', { name: 'Ab cd' })
  expect(titulo.className).toContain('dk-titulo--letra')
  expect(titulo.querySelectorAll('.dk-letra')).toHaveLength(4)
  expect(titulo.querySelectorAll('.dk-palavra[aria-hidden="true"]')).toHaveLength(2)
})

test('Painel: a varredura usa a luz sólida; as outras variantes têm a própria classe', () => {
  const { container, unmount } = render(<Painel titulo="A" variante="varredura"><p>x</p></Painel>)
  expect(container.firstElementChild!.className).toContain('dk-constroi')
  unmount()

  for (const variante of ['holograma', 'desdobrar', 'foco'] as const) {
    const { container: c, unmount: desmontar } = render(<Painel titulo="A" variante={variante}><p>x</p></Painel>)
    const raiz = c.firstElementChild!
    expect(raiz.className).toContain(`dk-painel--${variante}`)
    expect(raiz.className).not.toContain('dk-constroi')
    desmontar()
  }
})

test('Lista, TabelaRegras, Cartoes e TabelaProva aplicam a variante escolhida', () => {
  const { container, unmount } = render(<Lista variante="digitar" itens={['um', 'dois']} />)
  expect(container.querySelector('ul')!.className).toContain('dk-lista--digitar')
  expect(container.querySelectorAll('li')).toHaveLength(2)
  unmount()

  const tabela = render(<TabelaRegras variante="celulas" linhas={[{ requisito: 'R', prova: 'P' }]} />)
  expect(tabela.container.querySelector('table')!.className).toContain('dk-tabela--celulas')
  tabela.unmount()

  const cartoes = render(<Cartoes variante="montar" itens={[{ icone: 'escudo', titulo: 'T', texto: 'x' }]} />)
  expect(cartoes.container.firstElementChild!.className).toContain('dk-cartoes--montar')
  cartoes.unmount()

  const prova = render(<TabelaProva variante="deriva" linhas={[['cenário', 'resultado']]} />)
  expect(prova.container.querySelector('ul')!.className).toContain('dk-prova--deriva')
  prova.unmount()
})

test('Codigo: digitar mantém o gesto de digitação; as outras variantes trocam a classe da linha', () => {
  const { container, unmount } = render(<Codigo arquivo="a.ts" linhas={['const a = 1']} />)
  const figura = container.querySelector('figure')!
  expect(figura.className).toContain('dk-codigo--digitar')
  expect(figura.className).toContain('dk-constroi')
  expect(container.querySelector('code')!.className).toContain('dk-cascata--rapida')
  unmount()

  const revelar = render(<Codigo variante="revelar" arquivo="a.ts" linhas={['const a = 1']} />)
  expect(revelar.container.querySelector('code')!.className).toContain('dk-cascata--revelar')
  expect(revelar.container.querySelector('figure')!.className).not.toContain('dk-constroi')
  revelar.unmount()
})

test('Contador odômetro: os dígitos giram por CSS e o valor final fica no texto lido por leitores de tela', () => {
  const { container } = render(<Contador valor={310} rotulo="cenários" variante="odometro" />)
  expect(container.querySelector('.dk-contador')!.className).toContain('dk-contador--odometro')
  expect(container.querySelectorAll('.dk-odo-coluna')).toHaveLength(3)
  expect(container.querySelector('.dk-odo-d3')).not.toBeNull()
  expect(container.querySelector('.dk-sr')!.textContent).toBe('310')
})

test('Contador holograma e mola mantêm o valor final no texto lido por leitores de tela', () => {
  const { container, unmount } = render(<Contador valor={42} rotulo="decisões" variante="holograma" />)
  expect(container.querySelector('.dk-contador')!.className).toContain('dk-contador--holograma')
  expect(container.querySelector('.dk-sr')!.textContent).toBe('42')
  unmount()

  const mola = render(<Contador valor={7} rotulo="itens" />)
  expect(mola.container.querySelector('.dk-contador')!.className).toContain('dk-contador--mola')
  expect(mola.container.querySelector('.dk-sr')!.textContent).toBe('7')
})
