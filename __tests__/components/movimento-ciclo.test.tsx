import { useRef } from 'react'
import { render, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { useMovimentoOa } from '@/components/oanet/useMovimentoOa'

const observador: { atual?: ObservadorTeste } = {}
class ObservadorTeste implements IntersectionObserver {
  root = null
  rootMargin = '0px'
  thresholds = [0]
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = () => []
  constructor(private callback: IntersectionObserverCallback) { observador.atual = this }
  emitir(target: Element, visivel: boolean) {
    const bounds = target.getBoundingClientRect()
    this.callback([{ target, isIntersecting: visivel, intersectionRatio: visivel ? 1 : 0, boundingClientRect: bounds, intersectionRect: bounds, rootBounds: null, time: 0 }], this)
  }
}

function Cena({ trocar = false }) {
  const ref = useRef<HTMLDivElement>(null)
  useMovimentoOa(ref)
  return <div ref={ref}><section className="oa-panel"><svg key={String(trocar)} data-oa-motion="teste" data-testid={trocar ? 'novo' : 'inicial'} /></section></div>
}

afterEach(() => vi.unstubAllGlobals())

test('pausa objetos invisíveis e libera somente os que entram na área visível', () => {
  vi.stubGlobal('IntersectionObserver', ObservadorTeste)
  const { getByTestId, unmount } = render(<Cena />)
  const objeto = getByTestId('inicial')
  expect(objeto.getAttribute('data-offscreen')).toBe('true')
  observador.atual!.emitir(objeto, true)
  expect(objeto.getAttribute('data-offscreen')).toBe('false')
  observador.atual!.emitir(objeto, false)
  expect(objeto.getAttribute('data-offscreen')).toBe('true')
  unmount()
  expect(observador.atual!.disconnect).toHaveBeenCalledOnce()
})

test('observa SVGs novos ao trocar o construto e deixa de observar o anterior', async () => {
  vi.stubGlobal('IntersectionObserver', ObservadorTeste)
  const { getByTestId, rerender, unmount } = render(<Cena />)
  const anterior = getByTestId('inicial')
  rerender(<Cena trocar />)
  const novo = getByTestId('novo')
  await waitFor(() => expect(observador.atual!.observe).toHaveBeenCalledWith(novo))
  expect(observador.atual!.unobserve).toHaveBeenCalledWith(anterior)
  expect(novo.getAttribute('data-offscreen')).toBe('true')
  unmount()
})
