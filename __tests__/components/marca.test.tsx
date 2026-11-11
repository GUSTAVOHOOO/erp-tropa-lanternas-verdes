import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { EmblemaOa as Emblema } from '@/components/oanet/EmblemaOa'
import { IconeStatus } from '@/components/IconeStatus'

// UI-02.00: a Marca foi removida (a casca OANET mostra a marca); o Emblema sai com o último consumidor, na UI-02.12.
test('Emblema é decorativo para leitores de tela', () => {
  const { container } = render(<Emblema />)
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
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
