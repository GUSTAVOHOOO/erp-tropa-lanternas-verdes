import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/(site)/page'
import SobrePage from '@/app/(site)/sobre/page'
import NaoEncontrada from '@/app/not-found'

test('homepage tem título e leva às três áreas na composição OANET do portal', () => {
  const { container } = render(<HomePage />)
  expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
  expect(screen.getByText(/No dia mais claro, na noite mais densa/)).toBeDefined()

  const links = screen.getAllByRole('link')
  const destinos = links.map((l) => l.getAttribute('href'))
  expect(destinos).toEqual(expect.arrayContaining(['/lanternas', '/sobre', '/painel']))
  expect(links.some((l) => l.classList.contains('oa-button'))).toBe(true)

  expect(container.querySelector('.oa-portal-hero')).not.toBeNull()
  expect(container.querySelector('.oa-portal-city')).not.toBeNull()
  expect(container.querySelector('.oa-portal-bottom')).not.toBeNull()
  expect(container.querySelector('.oa-portal-battery')).not.toBeNull()
  expect(container.textContent).not.toMatch(/7\.200|98,7%/)
})

test('sobre tem título e o juramento', () => {
  render(<SobrePage />)
  expect(screen.getByRole('heading', { level: 1, name: 'Sobre a Tropa' })).toBeDefined()
  expect(screen.getByText(/No dia mais claro, na noite mais densa/)).toBeDefined()
})

// UI-02.02: Oa, Tropa e juramento em molduras OANET, sem perder leitura, landmarks nem a volta ao início.
test('sobre compõe as seções em molduras OANET e oferece volta ao início', () => {
  const { container } = render(<SobrePage />)
  expect(screen.getByRole('article')).toBeDefined()
  for (const titulo of ['O juramento', 'Oa e os Guardiões', 'Os setores']) {
    const secao = screen.getByRole('heading', { level: 2, name: titulo }).closest('.oa-panel')
    expect(secao).not.toBeNull()
  }
  expect(screen.getByText(/Oa fica no centro do universo/)).toBeDefined()
  expect(screen.getByText(/dividido em 3600 setores/)).toBeDefined()
  expect(screen.getByRole('link', { name: /Voltar ao início/ }).getAttribute('href')).toBe('/')
  expect(container.querySelector('.oa-hierarchy-city')?.getAttribute('aria-hidden')).toBe('true')
})

// O 404 global é renderizado fora da casca: sem o escopo OANET (.oa-lab) os tokens --oa-* não existem
// e o emblema da Tropa perde o verde.
test('404 global leva o escopo OANET para o emblema e a saída', () => {
  render(<NaoEncontrada />)
  const principal = screen.getByRole('main')
  expect(principal.classList.contains('oa-lab')).toBe(true)
  expect(principal.querySelector('svg[data-oa-motion="emblema"]')).not.toBeNull()
  expect(screen.getByRole('heading', { level: 1, name: 'Setor desconhecido' })).toBeDefined()
  expect(screen.getByRole('link', { name: 'Voltar ao início' }).getAttribute('href')).toBe('/')
})
