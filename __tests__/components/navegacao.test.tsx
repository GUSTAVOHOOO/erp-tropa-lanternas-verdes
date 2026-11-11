import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LinkVoltar } from '@/components/LinkVoltar'
import { PaginaAviso } from '@/components/PaginaAviso'
import { Juramento } from '@/components/Juramento'

// UI-02.00: o MenuNavegacao foi removido; link ativo e aria-current são conferidos em casca-oanet.test.tsx.
test('LinkVoltar aponta para onde foi pedido', () => {
  render(<LinkVoltar href="/painel/ocorrencias">Voltar à lista</LinkVoltar>)
  const link = screen.getByRole('link', { name: 'Voltar à lista' })
  expect(link.getAttribute('href')).toBe('/painel/ocorrencias')
  expect(link.classList.contains('oa-text-action')).toBe(true)
  expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})

test('PaginaAviso tem um h1, explica e oferece uma saída', () => {
  const { container } = render(<PaginaAviso titulo="Setor desconhecido" descricao="Este endereço não existe." acao={{ href: '/', rotulo: 'Voltar ao início' }} />)
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1, name: 'Setor desconhecido' })).toBeDefined()
  expect(screen.getByText('Este endereço não existe.')).toBeDefined()
  const saida = screen.getByRole('link', { name: 'Voltar ao início' })
  expect(saida.getAttribute('href')).toBe('/')
  expect(saida.classList.contains('oa-button')).toBe(true)
  // o emblema é o vetor OANET (EmblemaOa), sempre decorativo
  const emblema = container.querySelector('svg[data-oa-motion="emblema"]')
  expect(emblema?.getAttribute('aria-hidden')).toBe('true')
})

test('Juramento cita o primeiro verso numa citação', () => {
  render(<Juramento />)
  expect(screen.getByText(/No dia mais claro, na noite mais densa/).closest('blockquote')).not.toBeNull()
})

test('Juramento preserva os quatro versos e a legenda', () => {
  const { container } = render(<Juramento />)
  const citacao = container.querySelector('blockquote')!
  for (const verso of ['No dia mais claro, na noite mais densa,', 'o mal sucumbirá diante da minha presença.', 'Todo aquele que venera o mal há de penar', 'quando o poder do Lanterna Verde enfrentar!']) {
    expect(citacao.textContent).toContain(verso)
  }
  expect(screen.getByText('Juramento da Tropa dos Lanternas Verdes')).toBeDefined()
})
