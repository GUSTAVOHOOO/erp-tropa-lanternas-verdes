import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/(site)/cadastro/actions', () => ({
  cadastrar: vi.fn(),
}))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))

import { cadastrar } from '@/app/(site)/cadastro/actions'
import { listarSetores } from '@/lib/setores'
import { FormCadastro } from '@/app/(site)/cadastro/_components/FormCadastro'
import CadastroPage from '@/app/(site)/cadastro/page'

const setoresExemplo = [
  { id: 2814, nome: 'Terra', descricao: 'Setor espacial 2814, Terra' },
  { id: 674, nome: 'Korugar', descricao: 'Setor espacial 674' },
]

describe('FormCadastro', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('renderiza os campos com rótulos associados', () => {
    render(<FormCadastro setores={setoresExemplo} />)
    expect(screen.getByLabelText('Nome')).toBeDefined()
    expect(screen.getByLabelText('E-mail')).toBeDefined()
    expect(screen.getByLabelText('Senha')).toBeDefined()
    expect(screen.getByLabelText('Setor')).toBeDefined()
  })

  it('exibe erros de campo com aria-invalid e aria-describedby ao submeter vazio', async () => {
    render(<FormCadastro setores={setoresExemplo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    const erroNome = await screen.findByText('O nome deve ter pelo menos 2 caracteres.')
    const erroEmail = await screen.findByText('Informe um e-mail válido, como hal@oa.tropa.')
    const erroSenha = await screen.findByText('A senha precisa de pelo menos 8 caracteres.')
    const erroSetor = await screen.findByText('Escolha o seu setor.')

    const campoNome = screen.getByLabelText('Nome')
    const campoEmail = screen.getByLabelText('E-mail')
    const campoSenha = screen.getByLabelText('Senha')
    const campoSetor = screen.getByLabelText('Setor')

    expect(campoNome.getAttribute('aria-invalid')).toBe('true')
    expect(campoNome.getAttribute('aria-describedby')).toBe(erroNome.id)

    expect(campoEmail.getAttribute('aria-invalid')).toBe('true')
    expect(campoEmail.getAttribute('aria-describedby')).toBe(erroEmail.id)

    expect(campoSenha.getAttribute('aria-invalid')).toBe('true')
    expect(campoSenha.getAttribute('aria-describedby')).toBe(erroSenha.id)

    expect(campoSetor.getAttribute('aria-invalid')).toBe('true')
    expect(campoSetor.getAttribute('aria-describedby')).toBe(erroSetor.id)

    expect(cadastrar).not.toHaveBeenCalled()
  })

  it('desabilita o botão e exibe "Criando conta..." durante o envio', async () => {
    let resolver: (valor: { ok: boolean }) => void
    const promise = new Promise<{ ok: boolean }>((res) => {
      resolver = res
    })
    vi.mocked(cadastrar).mockReturnValue(promise)

    render(<FormCadastro setores={setoresExemplo} />)

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Kyle Rayner' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'kyle@oa.tropa' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senhaSegura123!' } })

    const select = screen.getByLabelText('Setor')
    fireEvent.click(select)
    const opcao = await screen.findByRole('option', { name: /Setor 2814 · Terra/ })
    fireEvent.pointerDown(opcao)
    fireEvent.pointerUp(opcao)
    fireEvent.click(opcao)

    const botao = screen.getByRole('button', { name: 'Criar conta' })
    fireEvent.click(botao)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Criando conta...' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'Criando conta...' }).hasAttribute('disabled')).toBe(true)
    })

    resolver!({ ok: true })
  })

  it('aplica mensagem de erro do servidor e erro root', async () => {
    vi.mocked(cadastrar).mockResolvedValueOnce({
      ok: false,
      errors: { email: ['Este e-mail já está cadastrado.'] },
      erro: 'Não foi possível concluir a operação. Tente novamente.',
    })

    render(<FormCadastro setores={setoresExemplo} />)

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Hal Jordan' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'hal@oa.tropa' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senhaSegura123!' } })

    const select = screen.getByLabelText('Setor')
    fireEvent.click(select)
    const opcao = await screen.findByRole('option', { name: /Setor 2814 · Terra/ })
    fireEvent.pointerDown(opcao)
    fireEvent.pointerUp(opcao)
    fireEvent.click(opcao)
    await waitFor(() => expect(select.textContent).toContain('Terra'))

    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Este e-mail já está cadastrado.')).toBeDefined()
    expect(screen.getByText('Não foi possível concluir a operação. Tente novamente.')).toBeDefined()
  })

  it('permite alternar a visibilidade da senha com o botão Mostrar senha', () => {
    render(<FormCadastro setores={setoresExemplo} />)
    const campoSenha = screen.getByLabelText('Senha')
    const botaoOlho = screen.getByRole('button', { name: 'Mostrar senha' })

    expect(campoSenha.getAttribute('type')).toBe('password')
    expect(botaoOlho.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(botaoOlho)
    expect(campoSenha.getAttribute('type')).toBe('text')
    expect(botaoOlho.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(botaoOlho)
    expect(campoSenha.getAttribute('type')).toBe('password')
    expect(botaoOlho.getAttribute('aria-pressed')).toBe('false')
  })
})

describe('CadastroPage', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('com setores renderiza a página de acesso e o formulário de cadastro', async () => {
vi.mocked(listarSetores).mockResolvedValueOnce(setoresExemplo)
    const { container } = render(await CadastroPage())

    expect(screen.getByRole('heading', { level: 1, name: 'Criar conta na Central' })).toBeDefined()
    expect(
      screen.getByText('Novas contas entram como Lanterna; um Guardião vincula a sua ficha.'),
    ).toBeDefined()
    expect(container.querySelector('.oa-access-panel')).not.toBeNull()
    expect(container.querySelector('.oa-access-battery')?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Já tenho conta' }).getAttribute('href')).toBe('/login')
  })

  it('com falha na API exibe estado de erro com link "Tentar de novo" e sem formulário', async () => {
vi.mocked(listarSetores).mockRejectedValueOnce(new Error('API offline'))
    render(await CadastroPage())

    expect(screen.getByText('Não foi possível carregar os setores')).toBeDefined()
    expect(screen.getByRole('link', { name: 'Tentar de novo' }).getAttribute('href')).toBe('/cadastro')
    expect(screen.queryByRole('button', { name: 'Criar conta' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Já tenho conta' }).getAttribute('href')).toBe('/login')
  })

  it('com lista vazia exibe EstadoVazio e sem formulário', async () => {
vi.mocked(listarSetores).mockResolvedValueOnce([])
    render(await CadastroPage())

    expect(screen.getByText('Nenhum setor disponível para cadastro')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Criar conta' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Já tenho conta' }).getAttribute('href')).toBe('/login')
  })
})
