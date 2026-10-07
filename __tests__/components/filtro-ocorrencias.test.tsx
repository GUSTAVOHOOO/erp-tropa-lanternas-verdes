import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const navegador = vi.hoisted(() => ({ push: vi.fn(), query: 'status=aberta&setor=2814' }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/painel/ocorrencias',
  useRouter: () => ({ push: navegador.push }),
  useSearchParams: () => new URLSearchParams(navegador.query),
}))
vi.mock('@/components/CampoSelect', () => ({
  CampoSelect: ({ id, rotulo, valor, aoMudar }: { id: string; rotulo: string; valor: string; aoMudar: (valor: string) => void }) => (
    <button type="button" data-testid={id} onClick={() => aoMudar(valor === 'todos' ? 'alta' : 'todos')}>{rotulo}</button>
  ),
}))

import { FiltroOcorrencias } from '@/app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias'

beforeEach(() => {
  navegador.push.mockClear()
  navegador.query = 'status=aberta&setor=2814'
})

test('adiciona gravidade à URL e preserva status e setor', () => {
  render(<FiltroOcorrencias setores={[]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Gravidade' }))
  expect(navegador.push).toHaveBeenCalledWith('/painel/ocorrencias?status=aberta&setor=2814&gravidade=alta')
})

test('limpa gravidade da URL e preserva status e setor', () => {
  navegador.query = 'status=aberta&setor=2814&gravidade=alta'
  render(<FiltroOcorrencias setores={[]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Gravidade' }))
  expect(navegador.push).toHaveBeenCalledWith('/painel/ocorrencias?status=aberta&setor=2814')
})
