import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import DesignSystemPage from '@/app/(site)/design-system/page'

test('vitrine tem um h1 e uma seção para cada parte do sistema', () => {
  render(<DesignSystemPage />)
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  const secoes = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
  expect(secoes).toEqual(['Cores', 'Gravidade', 'Tipografia', 'Emblema e ícones', 'Botões', 'Campos', 'Selos', 'Tabela e resumo', 'Alerta, vazio e carregando'])
})

test('vitrine mostra as quatro gravidades com texto', () => {
  render(<DesignSystemPage />)
  for (const rotulo of ['Baixa', 'Média', 'Alta', 'Crítica']) {
    expect(screen.getAllByText(rotulo).length).toBeGreaterThan(0)
  }
})
