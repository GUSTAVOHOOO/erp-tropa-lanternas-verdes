import { render } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { CascaOa } from '@/components/oanet/CascaOa'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
// Renderiza os SVGs reais (centenas de nós): rápido isolado, mas passa de 5 s com a suíte completa em paralelo.
vi.setConfig({ testTimeout: 20_000 })

// A casca real desenha o céu, a cidade e dois emblemas: cada SVG precisa de IDs próprios (docs/UI.md, regra 3).
test('os vetores reais da casca têm IDs únicos e toda referência url(#…) existe', () => {
  const { container } = render(
    <CascaOa links={[]} rotuloNavegacao="Navegação" identidade={{ titulo: 'Visitante', detalhe: 'Portal público' }}>
      <p>conteúdo</p>
    </CascaOa>,
  )
  const ids = [...container.querySelectorAll('[id]')].map((elemento) => elemento.id)
  expect(ids.length).toBeGreaterThan(10)
  expect(new Set(ids).size).toBe(ids.length)

  const referencias = [...container.querySelectorAll('[fill^="url(#"], [filter^="url(#"], [stroke^="url(#"]')]
    .flatMap((elemento) => ['fill', 'filter', 'stroke'].map((attr) => elemento.getAttribute(attr)))
    .flatMap((valor) => (valor?.match(/^url\(#(.+)\)$/) ? [valor.slice(5, -1)] : []))
  expect(referencias.length).toBeGreaterThan(0)
  for (const alvo of referencias) expect(ids).toContain(alvo)
})
