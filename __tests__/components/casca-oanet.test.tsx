import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { CascaOa, linkAtivo, type LinkCascaOa } from '@/components/oanet/CascaOa'

const caminho = '/painel/ocorrencias/7'
vi.mock('next/navigation', () => ({ usePathname: () => caminho }))

const links: LinkCascaOa[] = [
  { href: '/painel', nome: 'Resumo', icone: 'painel', codigo: '01' },
  { href: '/painel/ocorrencias', nome: 'Ocorrências', icone: 'ocorrencias', codigo: '02' },
  { href: '/painel/ocorrencias/nova', nome: 'Registrar ocorrência', icone: 'mais', codigo: '03' },
]

test('linkAtivo escolhe o link mais específico', () => {
  expect(linkAtivo(links, '/painel')).toBe('/painel')
  expect(linkAtivo(links, '/painel/ocorrencias/7')).toBe('/painel/ocorrencias')
  expect(linkAtivo(links, '/painel/ocorrencias/nova')).toBe('/painel/ocorrencias/nova')
  expect(linkAtivo(links, '/outra')).toBeNull()
  expect(linkAtivo([{ ...links[0], href: '/' }], '/lanternas')).toBeNull()
})

function montar() {
  return render(
    <CascaOa links={links} rotuloNavegacao="Navegação teste" identidade={{ titulo: 'Hal Jordan', detalhe: 'Lanterna · Setor 2814' }}
      rodapeNavegacao={<button>Sair</button>}>
      <p>conteúdo da rota</p>
    </CascaOa>,
  )
}

test('a casca mostra identidade, links por URL, conteúdo e o slot de saída', () => {
  montar()
  expect(screen.getByText('Hal Jordan')).toBeDefined()
  expect(screen.getByText('Lanterna · Setor 2814')).toBeDefined()
  expect(screen.getByText('conteúdo da rota')).toBeDefined()
  expect(screen.getByRole('button', { name: 'Sair' })).toBeDefined()
  const atual = screen.getByRole('link', { name: /Ocorrências/ })
  expect(atual.getAttribute('href')).toBe('/painel/ocorrencias')
  expect(atual.getAttribute('aria-current')).toBe('page')
  expect(screen.getByRole('link', { name: /Resumo/ }).getAttribute('aria-current')).toBeNull()
  expect(screen.getByRole('navigation', { name: 'Navegação teste' })).toBeDefined()
})

test('menu móvel abre, fecha com Escape e devolve o foco', () => {
  montar()
  const menu = screen.getByRole('button', { name: 'Abrir menu' })
  fireEvent.click(menu)
  expect(menu.getAttribute('aria-expanded')).toBe('true')
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(screen.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded')).toBe('false')
})

test('modo calmo alterna na casca real', () => {
  const { container } = montar()
  const controle = screen.getByRole('button', { name: 'Reduzir efeitos luminosos' })
  fireEvent.click(controle)
  expect(container.querySelector('.oa-lab--quiet')).not.toBeNull()
  expect(controle.getAttribute('aria-pressed')).toBe('true')
})
