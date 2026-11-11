import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/(site)/page'
import SobrePage from '@/app/(site)/sobre/page'
import NaoEncontrada from '@/app/not-found'

test('homepage tem título e leva às três áreas', () => {
  render(<HomePage />)
  expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
  const destinos = screen.getAllByRole('link').map((l) => l.getAttribute('href'))
  expect(destinos).toEqual(expect.arrayContaining(['/lanternas', '/sobre', '/painel']))
})

test('sobre tem título e o juramento', () => {
  render(<SobrePage />)
  expect(screen.getByRole('heading', { level: 1, name: 'Sobre a Tropa' })).toBeDefined()
  expect(screen.getByText(/No dia mais claro, na noite mais densa/)).toBeDefined()
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
