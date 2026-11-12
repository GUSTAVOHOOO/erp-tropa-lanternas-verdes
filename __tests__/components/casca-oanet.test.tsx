import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { CascaOa, linkAtivo, type LinkCascaOa } from '@/components/oanet/CascaOa'
import { IconeOa } from '@/components/oanet/IconeOa'
import { linksDoPainel, linksDoSite } from '@/components/oanet/navegacao'

const caminho = '/painel/ocorrencias/7'
vi.mock('next/navigation', () => ({ usePathname: () => caminho }))
// Vetores decorativos (aria-hidden, centenas de nós) deixam o getByRole lento a ponto de estourar o
// tempo na suíte completa. Aqui se testa o comportamento da casca; os SVGs reais ficam em casca-vetores.test.tsx.
vi.mock('@/components/oanet/FundoCosmico', () => ({ FundoCosmico: () => null }))
vi.mock('@/components/oanet/EmblemaOa', () => ({ EmblemaOa: () => null }))
vi.mock('@/components/oanet/ConstructosOa', () => ({ CidadeOa: () => null }))

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

// Casos herdados do MenuNavegacao removido na UI-02.00: página atual e ícone fora do nome acessível.
test('o link da página atual tem aria-current e o ícone não muda o nome acessível', () => {
  montar()
  const atual = screen.getByRole('link', { name: 'Ocorrências' })
  expect(atual.getAttribute('aria-current')).toBe('page')
  expect(atual.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  expect(screen.getByRole('link', { name: 'Resumo' }).getAttribute('aria-current')).toBeNull()
  expect(screen.getByRole('link', { name: 'Registrar ocorrência' }).getAttribute('aria-current')).toBeNull()
})

test('menu móvel abre, fecha com Escape e devolve o foco', () => {
  montar()
  const menu = screen.getByRole('button', { name: 'Abrir menu' })
  fireEvent.click(menu)
  expect(menu.getAttribute('aria-expanded')).toBe('true')
  expect(document.activeElement).toBe(screen.getByRole('link', { name: /Resumo/ })) // foco entra na navegação
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(screen.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(menu) // e volta ao controle que abriu o menu
})

test('escolher um link fecha o menu móvel', () => {
  montar()
  fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
  fireEvent.click(screen.getByRole('link', { name: /Resumo/ }))
  expect(screen.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded')).toBe('false')
})

test('o pulo para o conteúdo aponta para o main focável', () => {
  montar()
  const pulo = screen.getByRole('link', { name: 'Ir para o conteúdo' })
  const alvo = document.querySelector(pulo.getAttribute('href') ?? '')
  expect(alvo?.tagName).toBe('MAIN')
  expect(alvo?.getAttribute('tabindex')).toBe('-1')
})

test('sem slot de saída, a casca não mostra botão Sair', () => {
  render(
    <CascaOa links={links} rotuloNavegacao="Navegação teste" identidade={{ titulo: 'Visitante', detalhe: 'Portal público' }}>
      <p>conteúdo</p>
    </CascaOa>,
  )
  expect(screen.getByText('Visitante')).toBeDefined()
  expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull()
})

test('modo calmo alterna na casca real', () => {
  const { container } = montar()
  const controle = screen.getByRole('button', { name: 'Reduzir efeitos luminosos' })
  const dica = screen.getByRole('tooltip')
  expect(controle.getAttribute('aria-describedby')).toBe(dica.id)
  expect(dica.textContent).toBe('Modo calmo: reduz brilho e animações')
  fireEvent.click(controle)
  expect(container.querySelector('.oa-lab--quiet')).not.toBeNull()
  expect(controle.getAttribute('aria-pressed')).toBe('true')
  expect(dica.textContent).toBe('Modo calmo ligado: brilho e animações reduzidos')
})

test('o globo explica a rede OANET sem interação', () => {
  montar()
  expect(screen.getByRole('img', { name: /Rede OANET/ })).toBeDefined()
})

test('o ícone de brilho renderiza SVG decorativo', () => {
  const { container } = render(<IconeOa nome="brilho" />)
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})

test('links por papel: linksDoSite(false) contém Cadastrar e linksDoSite(true) não', () => {
  const visitante = linksDoSite(false)
  const logado = linksDoSite(true)

  expect(visitante.some((l) => l.href === '/cadastro' && l.nome === 'Cadastrar')).toBe(true)
  expect(logado.some((l) => l.href === '/cadastro')).toBe(false)
})

test('links por papel do painel: linksDoPainel("lanterna") tem Minha fila e guardiao não tem; códigos sequenciais', () => {
  const lanterna = linksDoPainel('lanterna')
  const guardiao = linksDoPainel('guardiao')

  expect(lanterna.some((l) => l.href === '/painel/minha-fila' && l.nome === 'Minha fila')).toBe(true)
  expect(guardiao.some((l) => l.href === '/painel/minha-fila')).toBe(false)

  // O Lanterna tem Minha fila logo depois de Resumo (posição 1)
  expect(lanterna[1].href).toBe('/painel/minha-fila')
  expect(lanterna[1].icone).toBe('alvo')

  // Códigos sequenciais 01..N
  expect(lanterna.map((l) => l.codigo)).toEqual(['01', '02', '03', '04'])
  expect(guardiao.map((l) => l.codigo)).toEqual(['01', '02', '03', '04', '05', '06'])
})

test('links por papel do painel: só o Guardião vê a gestão', () => {
  const gestao = ['/painel/lanternas', '/painel/setores', '/painel/usuarios']
  expect(linksDoPainel('guardiao').map((l) => l.href)).toEqual(expect.arrayContaining(gestao))
  expect(linksDoPainel('lanterna').some((l) => gestao.includes(l.href))).toBe(false)
})
