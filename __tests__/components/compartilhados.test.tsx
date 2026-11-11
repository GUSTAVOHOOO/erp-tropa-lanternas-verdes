import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import db from '@/db.json'
import { CampoSelect } from '@/components/CampoSelect'
import { CampoTexto } from '@/components/CampoTexto'
import { EstadoVazio } from '@/components/EstadoVazio'
import { TelaDeErro } from '@/components/TelaDeErro'
import { MensagemErro } from '@/components/MensagemErro'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { ocorrenciaSchema } from '@/lib/schemas/ocorrencia'

// UI-02.00: além da semântica, cada caso confere a classe OANET que prova o destino do componente (docs/UI.md).
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

  test('usa o campo OANET, também no modo multilinha', () => {
    const { unmount } = render(<CampoTexto id="titulo" rotulo="Título" registro={registroFalso} />)
    const campo = screen.getByLabelText('Título')
    expect(campo.classList.contains('oa-input')).toBe(true)
    expect(campo.closest('.oa-field')).not.toBeNull()
    unmount()
    render(<CampoTexto id="descricao" rotulo="Descrição" registro={registroFalso} multilinha />)
    const area = screen.getByLabelText('Descrição')
    expect(area.classList.contains('oa-input')).toBe(true)
    expect(area.classList.contains('oa-textarea')).toBe(true)
  })
})

describe('CampoSelect', () => {
  const itens = { baixa: 'Baixa', alta: 'Alta' }

  test('liga label e gatilho e mostra o rótulo do valor escolhido', () => {
    render(<CampoSelect id="gravidade" rotulo="Gravidade" itens={itens} valor="alta" aoMudar={() => {}} />)
    const gatilho = document.getElementById('gravidade')!
    expect(screen.getByText('Gravidade').getAttribute('for')).toBe('gravidade')
    expect(gatilho.textContent).toContain('Alta')
    expect(gatilho.getAttribute('aria-invalid')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  test('sem valor mostra o placeholder', () => {
    render(<CampoSelect id="gravidade" rotulo="Gravidade" itens={itens} valor={null} aoMudar={() => {}} />)
    expect(document.getElementById('gravidade')!.textContent).toContain('Escolha uma opção')
  })

  test('erro fica associado ao gatilho', () => {
    render(<CampoSelect id="gravidade" rotulo="Gravidade" itens={itens} valor={null} aoMudar={() => {}} erro="Escolha a gravidade." />)
    const gatilho = document.getElementById('gravidade')!
    expect(gatilho.getAttribute('aria-invalid')).toBe('true')
    expect(gatilho.getAttribute('aria-describedby')).toBe('gravidade-erro')
    expect(screen.getByRole('alert').id).toBe('gravidade-erro')
  })

  test('usa o seletor OANET dentro de um campo OANET', () => {
    render(<CampoSelect id="gravidade" rotulo="Gravidade" itens={itens} valor="baixa" aoMudar={() => {}} />)
    const gatilho = document.getElementById('gravidade')!
    expect(gatilho.classList.contains('oa-select')).toBe(true)
    expect(gatilho.closest('.oa-field')).not.toBeNull()
  })
})

test('EstadoVazio explica e oferece uma saída', () => {
  render(<EstadoVazio titulo="Nenhum lanterna neste setor" descricao="Escolha outro setor." acao={{ href: '/lanternas', rotulo: 'Ver todos' }} />)
  const estado = screen.getByRole('status')
  expect(estado.textContent).toContain('Nenhum lanterna neste setor')
  expect(estado.textContent).toContain('Escolha outro setor.')
  expect(estado.classList.contains('oa-empty')).toBe(true)
  const saida = screen.getByRole('link', { name: 'Ver todos' })
  expect(saida.getAttribute('href')).toBe('/lanternas')
  expect(saida.classList.contains('oa-button')).toBe(true)
})

test('EstadoVazio sem ação não mostra link', () => {
  render(<EstadoVazio titulo="Nada por aqui" descricao="Volte mais tarde." />)
  expect(screen.queryByRole('link')).toBeNull()
})

test('TelaDeErro não mostra detalhe técnico e chama retry', () => {
  const retry = vi.fn()
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    render(<TelaDeErro error={new Error('TypeError: fetch failed')} retry={retry} />)
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível falar com a Central de Oa.')
    expect(screen.queryByText(/fetch failed/)).toBeNull()
    const botao = screen.getByRole('button', { name: 'Tentar de novo' })
    expect(botao.classList.contains('oa-button')).toBe(true)
    fireEvent.click(botao)
    expect(retry).toHaveBeenCalledOnce()
  } finally {
    consoleError.mockRestore()
  }
})

test('TabelaOcorrencias mostra nomes e "Sem responsável"', () => {
  const ocorrencias = db.ocorrencias.slice(0, 2).map((o) => ocorrenciaSchema.parse(o))
  const { container } = render(<TabelaOcorrencias ocorrencias={ocorrencias} nomeSetor={{ '2814': 'Setor 2814' }} nomeLanterna={{ 'hal-jordan': 'Hal Jordan' }} />)
  expect(screen.getByRole('link', { name: 'Ataque de Parallax em Coast City' }).getAttribute('href')).toBe('/painel/ocorrencias/o1')
  expect(screen.getByText('Hal Jordan')).toBeDefined()
  expect(screen.getAllByText('Setor 2814')).toHaveLength(2)
  expect(screen.getByText('Sem responsável')).toBeDefined()
  expect(screen.getByText('Crítica')).toBeDefined()
  expect(screen.getByRole('table').classList.contains('oa-table')).toBe(true)
  expect(container.querySelectorAll('.oa-badge')).toHaveLength(4) // gravidade e status de cada linha viram selos
})

test('MensagemErro é um alerta com texto e ícone decorativo', () => {
  const { container } = render(<MensagemErro id="email-erro">Informe um e-mail válido.</MensagemErro>)
  const alerta = screen.getByRole('alert')
  expect(alerta.id).toBe('email-erro')
  expect(alerta.textContent).toBe('Informe um e-mail válido.')
  expect(alerta.classList.contains('oa-tone-danger')).toBe(true)
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})
