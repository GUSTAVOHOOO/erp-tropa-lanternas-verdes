import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { CidadeOa } from '@/components/oanet/ConstructosOa'

// Renderiza o SVG real (centenas de nós): rápido isolado, mas passa de 5 s com a suíte completa em paralelo.
vi.setConfig({ testTimeout: 20_000 })

const semIndice = (classe: string) => classe.replace(/-\d+$/, '')
const classesDoDesenho = (container: HTMLElement) =>
  new Set(
    [...container.querySelectorAll('[class*="oa-vec-cidade-"]')]
      .flatMap((elemento) => (elemento.getAttribute('class') ?? '').split(/\s+/))
      .filter((classe) => classe.startsWith('oa-vec-cidade-'))
      .map(semIndice),
  )

test('CidadeOa mantém o contrato: decorativa, viewBox fixo e classe repassada', () => {
  const { container } = render(<CidadeOa className="oa-sidebar-city" />)
  const svg = container.querySelector('svg')!
  expect(svg.getAttribute('viewBox')).toBe('0 0 1440 720')
  expect(svg.getAttribute('data-oa-motion')).toBe('cidade')
  expect(svg.getAttribute('aria-hidden')).toBe('true')
  expect(svg.classList.contains('oa-sidebar-city')).toBe(true)
})

test('CidadeOa tem a aura circular atrás da torre e os rastros de voo no céu', () => {
  const { container } = render(<CidadeOa />)
  const aura = container.querySelector('circle.oa-vec-cidade-aura')
  expect(aura).not.toBeNull()
  expect(aura!.getAttribute('fill')).toMatch(/^url\(#.+\)$/)
  const rastros = container.querySelectorAll('.oa-vec-cidade-rastro')
  expect(rastros.length).toBeGreaterThanOrEqual(4)
  // parado (movimento reduzido), cada rastro continua desenhado no meio do percurso
  for (const rastro of rastros) expect(rastro.getAttribute('stroke-dashoffset')).toBe('-40')
})

test('toda classe animada da cidade tem regra no CSS de movimento, e nenhuma regra sobra', () => {
  const { container } = render(<CidadeOa />)
  const noDesenho = classesDoDesenho(container)
  const css = readFileSync(join(process.cwd(), 'components/oanet/movimento-vetores.css'), 'utf8')
  const noCss = new Set((css.match(/\.oa-vec-cidade-[a-z0-9-]+/g) ?? []).map((seletor) => semIndice(seletor.slice(1))))
  // "sinal" só agrupa os fluxos da torre central; quem anima são os filhos.
  noDesenho.delete('oa-vec-cidade-sinal')
  expect([...noDesenho].sort()).toEqual([...noCss].sort())
})
