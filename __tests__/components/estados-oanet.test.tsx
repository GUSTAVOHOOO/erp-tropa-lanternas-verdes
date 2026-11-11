import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EsqueletoLista } from '@/components/EsqueletoLista'
import { TelaDeErro } from '@/components/TelaDeErro'
import { PaginaAviso } from '@/components/PaginaAviso'
import LoadingRaiz from '@/app/loading'
import ErrorRaiz from '@/app/error'
import GlobalError from '@/app/global-error'

describe('Estados visuais e boundaries OANET (UI-02.11)', () => {
  test('EsqueletoLista exibe atributos de acessibilidade aria-busy e aria-label', () => {
    const { container } = render(<EsqueletoLista linhas={4} />)
    const carregando = screen.getByLabelText('Carregando')
    expect(carregando.getAttribute('aria-busy')).toBe('true')
    // 1 título + 1 cabeçalho + 4 linhas = 6 skeletons
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(6)
  })

  test('TelaDeErro exibe alerta, mensagem humana e botão de repetição ligado ao retry', () => {
    const retry = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<TelaDeErro error={new Error('Falha de rede simulada')} retry={retry} />)

    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText('Não foi possível falar com a Central de Oa.')).toBeDefined()
    expect(screen.getByText(/Verifique sua conexão/)).toBeDefined()

    const botao = screen.getByRole('button', { name: 'Tentar de novo' })
    fireEvent.click(botao)
    expect(retry).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
  })

  test('LoadingRaiz renderiza esqueleto dentro de container oa-screen', () => {
    const { container } = render(<LoadingRaiz />)
    expect(container.querySelector('.oa-screen')).not.toBeNull()
    expect(screen.getByLabelText('Carregando')).toBeDefined()
  })

  test('ErrorRaiz encapsula TelaDeErro repassando o callback de reset', () => {
    const reset = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorRaiz error={new Error('Erro de rota')} reset={reset} />)

    const botao = screen.getByRole('button', { name: 'Tentar de novo' })
    fireEvent.click(botao)
    expect(reset).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
  })

  test('GlobalError possui estrutura html/body autônoma e ação de reiniciar', () => {
    const reset = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<GlobalError error={new Error('Falha global')} reset={reset} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Falha crítica no sistema' })).toBeDefined()
    const botao = screen.getByRole('button', { name: 'Reiniciar sistema' })
    fireEvent.click(botao)
    expect(reset).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
  })

  test('PaginaAviso exibe aviso formatado com link OANET funcional', () => {
    render(
      <PaginaAviso
        titulo="Acesso não autorizado"
        descricao="Recurso protegido pelo Conselho de Guardiões."
        acao={{ href: '/login', rotulo: 'Autenticar' }}
      />
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Acesso não autorizado' })).toBeDefined()
    const link = screen.getByRole('link', { name: 'Autenticar' })
    expect(link.getAttribute('href')).toBe('/login')
    expect(link.classList.contains('oa-button')).toBe(true)
  })
})
