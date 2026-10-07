import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import db from '@/db.json'
import { CampoTexto } from '@/components/CampoTexto'
import { MenuNavegacao } from '@/components/MenuNavegacao'
import { EstadoVazio } from '@/components/EstadoVazio'
import { TelaDeErro } from '@/components/TelaDeErro'
import { MensagemErro } from '@/components/MensagemErro'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { ocorrenciaSchema } from '@/lib/schemas/ocorrencia'

vi.mock('next/navigation', () => ({ usePathname: () => '/lanternas' }))

const registroFalso: UseFormRegisterReturn = { name: 'titulo', onChange: async () => {}, onBlur: async () => {}, ref: () => {} }

describe('CampoTexto', () => {
  test('liga label, campo e mensagem de erro para leitores de tela', () => {
    render(<CampoTexto id="titulo" rotulo="Título" registro={registroFalso} erro="O título precisa ter pelo menos 5 caracteres." />)
    const campo = screen.getByLabelText('Título')
    expect(campo.getAttribute('aria-invalid')).toBe('true')
    expect(campo.getAttribute('aria-describedby')).toBe('titulo-erro')
    const alerta = screen.getByRole('alert')
    expect(alerta.id).toBe('titulo-erro')
    expect(alerta.textContent).toBe('O título precisa ter pelo menos 5 caracteres.')
  })

  test('sem erro não marca o campo nem mostra alerta', () => {
    render(<CampoTexto id="titulo" rotulo="Título" registro={registroFalso} />)
    expect(screen.getByLabelText('Título').getAttribute('aria-describedby')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  test('multilinha usa textarea', () => {
    render(<CampoTexto id="descricao" rotulo="Descrição" registro={registroFalso} multilinha />)
    expect(screen.getByLabelText('Descrição').tagName).toBe('TEXTAREA')
  })
})

describe('MenuNavegacao', () => {
  const links = [{ href: '/', rotulo: 'Início' }, { href: '/lanternas', rotulo: 'Lanternas' }]

  test('marca a página atual com aria-current', () => {
    render(<MenuNavegacao links={links} />)
    expect(screen.getByRole('link', { name: 'Lanternas' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Início' }).getAttribute('aria-current')).toBeNull()
  })

  test('botão abre e fecha o menu no celular', () => {
    render(<MenuNavegacao links={links} />)
    const botao = screen.getByRole('button', { name: 'Abrir menu' })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(botao)
    expect(screen.getByRole('button', { name: 'Fechar menu' }).getAttribute('aria-expanded')).toBe('true')
  })
})

test('EstadoVazio explica e oferece uma saída', () => {
  render(<EstadoVazio titulo="Nenhum lanterna neste setor" descricao="Escolha outro setor." acao={{ href: '/lanternas', rotulo: 'Ver todos' }} />)
  expect(screen.getByRole('status').textContent).toContain('Nenhum lanterna neste setor')
  expect(screen.getByRole('link', { name: 'Ver todos' }).getAttribute('href')).toBe('/lanternas')
})

test('TelaDeErro não mostra detalhe técnico e chama retry', () => {
  const retry = vi.fn()
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    render(<TelaDeErro error={new Error('TypeError: fetch failed')} retry={retry} />)
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível falar com a Central de Oa.')
    expect(screen.queryByText(/fetch failed/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(retry).toHaveBeenCalledOnce()
  } finally {
    consoleError.mockRestore()
  }
})

test('TabelaOcorrencias mostra nomes e "Sem responsável"', () => {
  const ocorrencias = db.ocorrencias.slice(0, 2).map((o) => ocorrenciaSchema.parse(o))
  render(<TabelaOcorrencias ocorrencias={ocorrencias} nomeSetor={{ '2814': 'Setor 2814' }} nomeLanterna={{ 'hal-jordan': 'Hal Jordan' }} />)
  expect(screen.getByRole('link', { name: 'Ataque de Parallax em Coast City' }).getAttribute('href')).toBe('/painel/ocorrencias/o1')
  expect(screen.getByText('Hal Jordan')).toBeDefined()
  expect(screen.getAllByText('Setor 2814')).toHaveLength(2)
  expect(screen.getByText('Sem responsável')).toBeDefined()
  expect(screen.getByText('Crítica')).toBeDefined()
})

test('MensagemErro é um alerta com texto e ícone decorativo', () => {
  const { container } = render(<MensagemErro id="email-erro">Informe um e-mail válido.</MensagemErro>)
  const alerta = screen.getByRole('alert')
  expect(alerta.id).toBe('email-erro')
  expect(alerta.textContent).toBe('Informe um e-mail válido.')
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})
