import { expect, test } from 'vitest'
import Link from 'next/link'
import { render, screen } from '@testing-library/react'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { BarraStatus } from '@/components/BarraStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { GRAVIDADES, rotuloGravidade } from '@/lib/schemas/ocorrencia'

test('BadgeGravidade sempre mostra o texto, nunca só a cor (CSS-12)', () => {
  for (const gravidade of GRAVIDADES) {
    const { unmount } = render(<BadgeGravidade gravidade={gravidade} />)
    expect(screen.getByText(rotuloGravidade[gravidade])).toBeDefined()
    unmount()
  }
})

test('BadgeStatus mostra o rótulo e o ícone é decorativo', () => {
  const { container } = render(<BadgeStatus status="em_andamento" />)
  expect(screen.getByText('Em andamento')).toBeDefined()
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})

test('BarraStatus acende um segmento por ocorrência e a legenda filtra', () => {
  const ocorrencias = [
    { id: 'a', status: 'aberta' as const },
    { id: 'b', status: 'aberta' as const },
    { id: 'c', status: 'resolvida' as const },
  ]
  const { container } = render(<BarraStatus ocorrencias={ocorrencias} />)
  expect(container.querySelectorAll('[data-status]')).toHaveLength(3)
  expect(screen.getByRole('link', { name: /2\s*abertas/ }).getAttribute('href')).toBe('/painel/ocorrencias?status=aberta')
  expect(screen.getByRole('link', { name: /0\s*em andamento/ }).getAttribute('href')).toBe('/painel/ocorrencias?status=em_andamento')
  expect(screen.getByRole('link', { name: /1\s*resolvidas/ }).getAttribute('href')).toBe('/painel/ocorrencias?status=resolvida')
})

test('BarraStatus sem ocorrências não desenha a barra e mostra zeros', () => {
  const { container } = render(<BarraStatus ocorrencias={[]} />)
  expect(container.querySelectorAll('[data-status]')).toHaveLength(0)
  expect(screen.getByRole('link', { name: /0\s*abertas/ })).toBeDefined()
})

test('CabecalhoPagina tem um único h1, descrição e ação', () => {
  render(
    <CabecalhoPagina titulo="Ocorrências" descricao="Todas as ocorrências da Tropa.">
      <Link href="/painel/ocorrencias/nova">Registrar ocorrência</Link>
    </CabecalhoPagina>,
  )
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1, name: 'Ocorrências' })).toBeDefined()
  expect(screen.getByText('Todas as ocorrências da Tropa.')).toBeDefined()
  expect(screen.getByRole('link', { name: 'Registrar ocorrência' })).toBeDefined()
})
