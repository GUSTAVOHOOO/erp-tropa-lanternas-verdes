import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApresentacaoOa } from '@/components/apresentacao/ApresentacaoOa'
import { SLIDES } from '@/components/apresentacao/slides'

// Renderiza construtos SVG reais: rápido isolado, mais lento com a suíte em paralelo.
vi.setConfig({ testTimeout: 20_000 })

beforeEach(() => {
  // jsdom não tem matchMedia; "reduzir movimento" desliga transições e canvas no teste.
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  window.history.replaceState(null, '', '/apresentacao')
})

const slideAtual = () => document.querySelector('.dk-slide--ativo')!.getAttribute('aria-label')

test('começa pela capa e navega pelo teclado, guardando o slide no endereço', () => {
  render(<ApresentacaoOa />)
  expect(slideAtual()).toBe(`1 de ${SLIDES.length}: Central de Oa`)

  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(slideAtual()).toBe(`2 de ${SLIDES.length}: ${SLIDES[1].titulo}`)
  expect(window.location.hash).toBe('#2')

  fireEvent.keyDown(window, { key: 'End' })
  expect(slideAtual()).toBe(`${SLIDES.length} de ${SLIDES.length}: Conclusão`)

  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(slideAtual()).toContain(`${SLIDES.length} de`)

  fireEvent.keyDown(window, { key: 'Home' })
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(slideAtual()).toContain('1 de')
})

test('abre no slide indicado pelo hash', () => {
  window.history.replaceState(null, '', '/apresentacao#12')
  render(<ApresentacaoOa />)
  expect(slideAtual()).toBe(`12 de ${SLIDES.length}: ${SLIDES[11].titulo}`)
})

test('N mostra as notas do slide e O abre a visão geral para pular', () => {
  render(<ApresentacaoOa />)
  fireEvent.keyDown(window, { key: 'n' })
  expect(screen.getByRole('complementary', { name: 'Notas do apresentador' }).textContent).toContain(SLIDES[0].notas)

  fireEvent.keyDown(window, { key: 'o' })
  const visao = screen.getByRole('dialog', { name: 'Visão geral dos slides' })
  fireEvent.click(visao.querySelectorAll('button')[6])
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(slideAtual()).toBe(`6 de ${SLIDES.length}: ${SLIDES[5].titulo}`)
})

test('atalhos não roubam teclas digitadas em campos', () => {
  render(<><ApresentacaoOa /><input aria-label="campo" /></>)
  fireEvent.keyDown(screen.getByLabelText('campo'), { key: 'ArrowRight' })
  expect(slideAtual()).toContain('1 de')
})

test('todo slide tem título, notas e tempo previsto', () => {
  for (const slide of SLIDES) {
    expect(slide.titulo.length).toBeGreaterThan(3)
    expect(slide.notas.length).toBeGreaterThan(20)
    expect(slide.minutos).toBeGreaterThan(0)
  }
  const total = SLIDES.reduce((soma, slide) => soma + slide.minutos, 0)
  expect(total).toBeGreaterThanOrEqual(40)
  expect(total).toBeLessThanOrEqual(50)
})
