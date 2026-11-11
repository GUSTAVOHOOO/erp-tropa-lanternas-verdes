import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Paginacao } from '@/components/Paginacao'

describe('Paginacao', () => {
  test('some quando paginas <= 1', () => {
    const { container: c1 } = render(<Paginacao pagina={1} paginas={1} caminho="/lanternas" parametros={{}} />)
    expect(c1.firstChild).toBeNull()

    const { container: c0 } = render(<Paginacao pagina={1} paginas={0} caminho="/lanternas" parametros={{}} />)
    expect(c0.firstChild).toBeNull()
  })

  test('renderiza navegação com aria-label e indicação de página com aria-current', () => {
    render(<Paginacao pagina={2} paginas={5} caminho="/lanternas" parametros={{ setor: '2814' }} />)
    const nav = screen.getByRole('navigation', { name: 'Paginação' })
    expect(nav).toBeDefined()
    const indicacao = within(nav).getByText(/Página 2 de 5/)
    expect(indicacao.getAttribute('aria-current')).toBe('page')
  })

  test('preserva parâmetros de busca nos links de anterior e próxima', () => {
    render(<Paginacao pagina={2} paginas={3} caminho="/lanternas" parametros={{ busca: 'hal', setor: '2814' }} />)
    const nav = screen.getByRole('navigation', { name: 'Paginação' })
    const proxima = within(nav).getByRole('link', { name: /Próxima/i })
    expect(proxima.getAttribute('href')).toBe('/lanternas?busca=hal&setor=2814&pagina=3')
  })

  test('link para a página 1 remove o parâmetro pagina', () => {
    render(<Paginacao pagina={2} paginas={3} caminho="/lanternas" parametros={{ busca: 'hal' }} />)
    const nav = screen.getByRole('navigation', { name: 'Paginação' })
    const anterior = within(nav).getByRole('link', { name: /Anterior/i })
    expect(anterior.getAttribute('href')).toBe('/lanternas?busca=hal')
  })

  test('pontas sem Link: primeira página não tem link Anterior e última não tem Próxima', () => {
    const { rerender } = render(<Paginacao pagina={1} paginas={3} caminho="/lanternas" parametros={{}} />)
    const navInicio = screen.getByRole('navigation', { name: 'Paginação' })
    expect(within(navInicio).queryByRole('link', { name: /Anterior/i })).toBeNull()
    expect(within(navInicio).getByRole('link', { name: /Próxima/i })).toBeDefined()

    rerender(<Paginacao pagina={3} paginas={3} caminho="/lanternas" parametros={{}} />)
    const navFim = screen.getByRole('navigation', { name: 'Paginação' })
    expect(within(navFim).getByRole('link', { name: /Anterior/i })).toBeDefined()
    expect(within(navFim).queryByRole('link', { name: /Próxima/i })).toBeNull()
  })

  test('suporta parâmetro customizado preservando os demais', () => {
    render(
      <Paginacao
        pagina={2}
        paginas={4}
        caminho="/painel/ocorrencias/123"
        parametros={{ comentarios: '3', eventos: '2' }}
        parametro="eventos"
      />,
    )
    const nav = screen.getByRole('navigation', { name: 'Paginação' })
    const anterior = within(nav).getByRole('link', { name: /Anterior/i })
    const proxima = within(nav).getByRole('link', { name: /Próxima/i })

    // Na página 1 do parâmetro 'eventos', o parâmetro 'eventos' é removido, mas 'comentarios' é preservado
    expect(anterior.getAttribute('href')).toBe('/painel/ocorrencias/123?comentarios=3')
    // Na próxima página (3), 'eventos=3' é setado e 'comentarios=3' é preservado
    expect(proxima.getAttribute('href')).toBe('/painel/ocorrencias/123?comentarios=3&eventos=3')
  })
})
