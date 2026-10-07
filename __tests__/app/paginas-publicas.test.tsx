import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/(site)/page'
import SobrePage from '@/app/(site)/sobre/page'

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
