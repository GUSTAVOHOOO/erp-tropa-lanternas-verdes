import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HouseIcon } from 'lucide-react'
import { MenuNavegacao } from '@/components/MenuNavegacao'
import { LinkVoltar } from '@/components/LinkVoltar'
import { PaginaAviso } from '@/components/PaginaAviso'
import { Juramento } from '@/components/Juramento'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

test('MenuNavegacao mostra o ícone sem mudar o nome acessível do link', () => {
  render(<MenuNavegacao links={[{ href: '/', rotulo: 'Início', icone: <HouseIcon aria-hidden /> }]} />)
  const link = screen.getByRole('link', { name: 'Início' })
  expect(link.getAttribute('aria-current')).toBe('page')
  expect(link.querySelector('svg')).not.toBeNull()
})

test('LinkVoltar aponta para onde foi pedido', () => {
  render(<LinkVoltar href="/painel/ocorrencias">Voltar à lista</LinkVoltar>)
  expect(screen.getByRole('link', { name: 'Voltar à lista' }).getAttribute('href')).toBe('/painel/ocorrencias')
})

test('PaginaAviso tem um h1, explica e oferece uma saída', () => {
  render(<PaginaAviso titulo="Setor desconhecido" descricao="Este endereço não existe." acao={{ href: '/', rotulo: 'Voltar ao início' }} />)
  expect(screen.getByRole('heading', { level: 1, name: 'Setor desconhecido' })).toBeDefined()
  expect(screen.getByRole('link', { name: 'Voltar ao início' }).getAttribute('href')).toBe('/')
})

test('Juramento cita o primeiro verso numa citação', () => {
  render(<Juramento />)
  expect(screen.getByText(/No dia mais claro, na noite mais densa/).closest('blockquote')).not.toBeNull()
})
