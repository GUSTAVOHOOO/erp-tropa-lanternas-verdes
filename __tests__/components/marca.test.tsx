import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Emblema } from '@/components/Emblema'
import { Marca } from '@/components/Marca'
import { IconeStatus } from '@/components/IconeStatus'

test('Emblema é decorativo para leitores de tela', () => {
  const { container } = render(<Emblema />)
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})

test('Marca leva ao endereço pedido com o nome da Central', () => {
  render(<Marca href="/" />)
  expect(screen.getByRole('link', { name: 'Central de Oa' }).getAttribute('href')).toBe('/')
})

describe('IconeStatus', () => {
  test('aberta é um círculo vazio', () => {
    const { container } = render(<IconeStatus status="aberta" />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('[fill="currentColor"]')).toBeNull()
  })

  test('em andamento e resolvida têm parte preenchida', () => {
    for (const status of ['em_andamento', 'resolvida'] as const) {
      const { container, unmount } = render(<IconeStatus status={status} />)
      expect(container.querySelector('[fill="currentColor"]')).not.toBeNull()
      unmount()
    }
  })
})
