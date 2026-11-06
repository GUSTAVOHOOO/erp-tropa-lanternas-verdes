import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { LaboratorioOa } from '@/components/oanet/LaboratorioOa'

// Canvas é verificado no navegador; estes casos cobrem a interação da vitrine.
vi.mock('@/components/oanet/GalaxiaProcedural', () => ({
  GalaxiaProcedural: () => <div aria-label="Mapa galáctico procedural" />,
}))

test('a navegação troca a tela sem depender da API e identifica a demonstração', () => {
  render(<LaboratorioOa />)
  expect(screen.getByRole('heading', { level: 1, name: 'Central de Comando' })).toBeDefined()
  expect(screen.getByText(/Ambiente de demonstração/)).toBeDefined()
  fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))
  expect(screen.getByRole('heading', { level: 1, name: 'Arsenal de interface' })).toBeDefined()
  expect(document.querySelectorAll('img, image').length).toBe(0)
})

test('o filtro de ocorrências combina busca e status e oferece estado vazio', () => {
  render(<LaboratorioOa />)
  fireEvent.click(screen.getByRole('button', { name: 'Ocorrências' }))
  fireEvent.change(screen.getByLabelText('Buscar ocorrência'), { target: { value: 'Coast' } })
  expect(screen.getByText('Distúrbio em Coast City')).toBeDefined()
  expect(screen.queryByText('Sinal desconhecido em Vega')).toBeNull()
  fireEvent.change(screen.getByLabelText('Filtrar por status'), { target: { value: 'Resolvida' } })
  expect(screen.getByText('Nenhuma ocorrência encontrada')).toBeDefined()
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  expect(screen.getByText('Sinal desconhecido em Vega')).toBeDefined()
})

test('o formulário demonstra envio local e mostra confirmação sem persistir dados', async () => {
  render(<LaboratorioOa />)
  fireEvent.click(screen.getByRole('button', { name: /Nova ocorrência/ }))
  fireEvent.change(screen.getByLabelText('Título da ocorrência'), { target: { value: 'Teste da central' } })
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Descrição local para revisar o desenho do formulário.' } })
  fireEvent.submit(screen.getByRole('form', { name: 'Registrar ocorrência de demonstração' }))
  expect(await screen.findByText(/Simulação concluída/)).toBeDefined()
})

test('a confirmação da galeria pode ser cancelada sem executar a ação', () => {
  render(<LaboratorioOa />)
  fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))
  fireEvent.click(screen.getByRole('button', { name: 'Testar confirmação' }))
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByText('Confirmar envio da patrulha?')).toBeDefined()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('menu recebe foco ao abrir, fecha com Escape e entrega foco ao conteúdo', () => {
  render(<LaboratorioOa />)
  fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Visão geral' }))
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir menu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Ocorrências' }))
  expect(document.activeElement).toBe(screen.getByRole('main'))
})

test('erro de formulário tem descrição associada sem alterar o nome do campo', async () => {
  render(<LaboratorioOa />)
  fireEvent.click(screen.getByRole('button', { name: 'Nova ocorrência' }))
  fireEvent.submit(screen.getByRole('form', { name: 'Registrar ocorrência de demonstração' }))
  const erro = await screen.findByText('Dê um título à ocorrência.')
  const campo = screen.getByRole('textbox', { name: 'Título da ocorrência' })
  expect(campo.getAttribute('aria-describedby')).toBe(erro.id)
  expect(erro.id).not.toBe('')
})
