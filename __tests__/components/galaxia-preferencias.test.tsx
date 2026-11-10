import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { GalaxiaProcedural } from '@/components/oanet/GalaxiaProcedural'

test('o modo calmo impede retomar o movimento até que os efeitos sejam habilitados', () => {
  const contexto = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  try {
    const { rerender } = render(<GalaxiaProcedural efeitosReduzidos />)
    const retomar = screen.getByRole('button', { name: 'Retomar animação' })
    expect(retomar.hasAttribute('disabled')).toBe(true)
    fireEvent.click(retomar)
    expect(screen.queryByRole('button', { name: 'Pausar animação' })).toBeNull()
    rerender(<GalaxiaProcedural efeitosReduzidos={false} />)
    const pausar = screen.getByRole('button', { name: 'Pausar animação' })
    expect(pausar.hasAttribute('disabled')).toBe(false)
    fireEvent.click(pausar)
    expect(screen.getByRole('button', { name: 'Retomar animação' }).hasAttribute('disabled')).toBe(false)
  } finally {
    contexto.mockRestore()
    vi.unstubAllGlobals()
  }
})
