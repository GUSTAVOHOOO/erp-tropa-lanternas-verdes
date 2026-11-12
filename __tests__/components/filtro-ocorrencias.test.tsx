import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const navegador = vi.hoisted(() => ({ push: vi.fn(), query: 'status=aberta&setor=2814&pagina=2' }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/painel/ocorrencias',
  useRouter: () => ({ push: navegador.push }),
  useSearchParams: () => new URLSearchParams(navegador.query),
}))

vi.mock('@/components/CampoSelect', () => ({
  CampoSelect: ({ id, rotulo, itens, valor, aoMudar }: {
    id: string
    rotulo: string
    itens: Record<string, string>
    valor: string | null | undefined
    aoMudar: (v: string | null) => void
  }) => (
    <div data-testid={`campo-select-${id}`}>
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} data-testid={id} value={valor ?? ''} onChange={(e) => aoMudar(e.target.value || null)}>
        {Object.entries(itens).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  ),
}))

import { FiltroOcorrencias } from '@/app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias'
import type { LanternaLista } from '@/lib/schemas/lanterna'

const lanternasMock: LanternaLista[] = [
  { id: 'hal-jordan', codinome: 'Hal Jordan', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra', setorId: 2814, status: 'ativo', anoIngresso: null },
  { id: 'john-stewart', codinome: 'John Stewart', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra', setorId: 2814, status: 'ativo', anoIngresso: null },
]

beforeEach(() => {
  navegador.push.mockClear()
  navegador.query = 'status=aberta&setor=2814&pagina=2'
})

test('mudar status remove pagina da URL', () => {
  render(<FiltroOcorrencias setores={[]} lanternas={lanternasMock} />)
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'resolvida' } })

  expect(navegador.push).toHaveBeenCalledWith('/painel/ocorrencias?status=resolvida&setor=2814')
  expect(navegador.push.mock.calls[0][0]).not.toContain('pagina=2')
})

test('filtra por responsável e remove pagina', () => {
  render(<FiltroOcorrencias setores={[]} lanternas={lanternasMock} />)
  fireEvent.change(screen.getByLabelText('Responsável'), { target: { value: 'hal-jordan' } })

  expect(navegador.push).toHaveBeenCalledWith('/painel/ocorrencias?status=aberta&setor=2814&responsavel=hal-jordan')
  expect(navegador.push.mock.calls[0][0]).not.toContain('pagina=2')
})

test('filtra por somente vencidas', () => {
  render(<FiltroOcorrencias setores={[]} lanternas={lanternasMock} />)
  const checkboxVencida = screen.getByRole('checkbox', { name: /somente vencidas/i })
  fireEvent.click(checkboxVencida)

  expect(navegador.push).toHaveBeenCalledWith('/painel/ocorrencias?status=aberta&setor=2814&vencida=true')
  expect(navegador.push.mock.calls[0][0]).not.toContain('pagina=2')
})

test('busca por título envia o texto como digitado e remove pagina', async () => {
  render(<FiltroOcorrencias setores={[]} lanternas={lanternasMock} />)
  const inputBusca = screen.getByLabelText(/buscar por título/i)
  fireEvent.change(inputBusca, { target: { value: '  Ataque  ' } })
  const form = inputBusca.closest('form')!
  fireEvent.submit(form)

  await waitFor(() => {
    expect(navegador.push).toHaveBeenCalledWith('/painel/ocorrencias?status=aberta&setor=2814&busca=++Ataque++')
    expect(navegador.push.mock.calls[0][0]).not.toContain('pagina=2')
  })
})

test('setor só aparece quando setores forem fornecidos (Guardião)', () => {
  const { unmount } = render(<FiltroOcorrencias setores={[]} lanternas={lanternasMock} />)
  expect(screen.queryByLabelText('Setor')).toBeNull()
  unmount()

  render(
    <FiltroOcorrencias
      setores={[{ id: 2814, nome: 'Setor 2814', descricao: 'Setor espacial 2814' }]}
      lanternas={lanternasMock}
    />,
  )
  expect(screen.getByLabelText('Setor')).toBeDefined()
})
