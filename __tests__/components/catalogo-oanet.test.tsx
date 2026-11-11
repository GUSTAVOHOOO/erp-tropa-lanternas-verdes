import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { obterCenario } from '../fixtures/contrato/cenarios'

const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()
const mockPathname = '/lanternas'

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>()
  return {
    ...actual,
    useRouter: () => ({ push: mockPush }),
    usePathname: () => mockPathname,
    useSearchParams: () => mockSearchParams,
  }
})

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

vi.mock('@/lib/lanternas', () => ({ listarLanternas: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))

import { listarLanternas } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import LanternasPage from '@/app/(site)/lanternas/page'
import { CartaoLanterna } from '@/app/(site)/lanternas/_components/CartaoLanterna'
import { FiltroLanternas } from '@/app/(site)/lanternas/_components/FiltroLanternas'
import type { LanternaLista } from '@/lib/schemas/lanterna'

const cenarioLista = obterCenario('listarLanternas.200')
const dadosListaFixture = cenarioLista.esperado.corpo!.dados as {
  itens: LanternaLista[]
  meta: { total: number; pagina: number; limite: number; paginas: number }
}

const setores = [
  { id: 2814, nome: 'Setor 2814', descricao: 'Terra e arredores' },
  { id: 674, nome: 'Setor 674', descricao: 'Bolovax Vik' },
  { id: 0, nome: 'Setor 0', descricao: 'Oa e Cidadela dos Guardiões' },
]

const hal = dadosListaFixture.itens[0]

async function renderizar(searchParams: Record<string, string | string[] | undefined> = {}) {
  return render(await LanternasPage({ searchParams: Promise.resolve(searchParams) }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPush.mockClear()
  mockSearchParams = new URLSearchParams()
  vi.mocked(listarSetores).mockResolvedValue(setores)
  vi.mocked(listarLanternas).mockResolvedValue(dadosListaFixture)
})

describe('Catálogo de Lanternas (/lanternas)', () => {
  test('URL inválida não quebra e usa padrões seguros', async () => {
    await renderizar({ setor: 'invalido', pagina: 'abc', ordenar: 'senhaHash', ordem: 'xyz' })
    expect(listarLanternas).toHaveBeenCalledWith({
      busca: undefined,
      status: undefined,
      setor: undefined,
      ordenar: undefined,
      ordem: undefined,
      pagina: undefined,
      limite: 12,
    })
  })

  test('filtro e busca na URL chegam a listarLanternas como números/strings do contrato', async () => {
    await renderizar({
      busca: 'Hal',
      status: 'em_missao',
      setor: '2814',
      ordenar: 'setor',
      ordem: 'desc',
      pagina: '2',
    })
    expect(listarLanternas).toHaveBeenCalledWith({
      busca: 'Hal',
      status: 'em_missao',
      setor: 2814,
      ordenar: 'setor',
      ordem: 'desc',
      pagina: 2,
      limite: 12,
    })
  })

  test('total do meta é exibido do servidor', async () => {
    vi.mocked(listarLanternas).mockResolvedValue({
      itens: [hal],
      meta: { total: 42, pagina: 1, limite: 12, paginas: 4 },
    })
    await renderizar()
    expect(screen.getByText(/42\s+lanternas/i)).toBeDefined()
  })

  test('lista vazia com filtro mostra estado vazio com ação Limpar filtros', async () => {
    vi.mocked(listarLanternas).mockResolvedValue({
      itens: [],
      meta: { total: 0, pagina: 1, limite: 12, paginas: 0 },
    })
    await renderizar({ status: 'afastado' })
    const vazio = screen.getByRole('status')
    expect(within(vazio).getByText('Nenhum lanterna encontrado')).toBeDefined()
    expect(within(vazio).getByRole('link', { name: 'Limpar filtros' }).getAttribute('href')).toBe('/lanternas')
  })

  test('lista vazia sem filtro mostra mensagem inicial de nenhum membro cadastrado', async () => {
    vi.mocked(listarLanternas).mockResolvedValue({
      itens: [],
      meta: { total: 0, pagina: 1, limite: 12, paginas: 0 },
    })
    await renderizar({})
    const vazio = screen.getByRole('status')
    expect(within(vazio).getByText('Ainda não há lanternas cadastrados')).toBeDefined()
    expect(within(vazio).queryByRole('link', { name: 'Limpar filtros' })).toBeNull()
  })

  test('página além do fim mostra vazio com Link para a página 1 mantendo filtros', async () => {
    vi.mocked(listarLanternas).mockResolvedValue({
      itens: [],
      meta: { total: 5, pagina: 4, limite: 12, paginas: 1 },
    })
    await renderizar({ setor: '2814', pagina: '4' })
    const linkPagina1 = screen.getByRole('link', { name: /página 1|primeira página/i })
    expect(linkPagina1.getAttribute('href')).toBe('/lanternas?setor=2814')
  })

  test('cada lanterna leva à ficha por Link dentro de uma moldura OANET', async () => {
    const { container } = await renderizar()
    expect(screen.getByRole('heading', { level: 1, name: 'Lanternas da Tropa' })).toBeDefined()
    const link = screen.getByRole('link', { name: new RegExp(hal.codinome) })
    expect(link.getAttribute('href')).toBe(`/lanternas/${hal.id}`)
    expect(link.closest('.oa-panel')).not.toBeNull()
    expect(container.querySelector('[data-slot="card"], [data-slot="badge"]')).toBeNull()
  })
})

describe('FiltroLanternas', () => {
  test('mudar status remove pagina e mantém os demais filtros', () => {
    mockSearchParams = new URLSearchParams('status=ativo&setor=2814&pagina=2')
    render(<FiltroLanternas setores={setores} />)
    fireEvent.change(screen.getByTestId('filtro-status'), { target: { value: 'em_missao' } })
    expect(mockPush).toHaveBeenCalledWith('/lanternas?status=em_missao&setor=2814')
  })

  test('busca vai como digitada sem normalização prévia e remove pagina', async () => {
    mockSearchParams = new URLSearchParams('setor=2814&pagina=3')
    render(<FiltroLanternas setores={setores} />)
    const inputBusca = screen.getByLabelText('Buscar por codinome')
    fireEvent.change(inputBusca, { target: { value: 'Hal  Jordan ' } })
    fireEvent.submit(inputBusca.closest('form')!)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/lanternas?setor=2814&busca=Hal++Jordan+')
    })
  })

  test('Setor 0 é selecionável e válido', () => {
    mockSearchParams = new URLSearchParams()
    render(<FiltroLanternas setores={setores} />)
    fireEvent.change(screen.getByTestId('filtro-setor'), { target: { value: '0' } })
    expect(mockPush).toHaveBeenCalledWith('/lanternas?setor=0')
  })

  test('botão Limpar aparece quando há filtro ativo e limpa os parâmetros', () => {
    mockSearchParams = new URLSearchParams('status=ativo')
    render(<FiltroLanternas setores={setores} />)
    const botaoLimpar = screen.getByRole('button', { name: 'Limpar' })
    fireEvent.click(botaoLimpar)
    expect(mockPush).toHaveBeenCalledWith('/lanternas')
  })
})

describe('CartaoLanterna', () => {
  test('mostra codinome, origem, setor por texto, selo de status e ano de ingresso', () => {
    render(<CartaoLanterna lanterna={hal} nomeSetor="Setor 2814" />)
    expect(screen.getByText('Hal Jordan')).toBeDefined()
    expect(screen.getByText('Humano · Terra')).toBeDefined()
    expect(screen.getByText('Setor 2814')).toBeDefined()
    expect(screen.getByText('Em missão').closest('.oa-badge')).not.toBeNull()
    expect(screen.getByText(/2001/)).toBeDefined()
  })

  test('origem não registrada quando espécie e planeta são nulos', () => {
    const semOrigem: LanternaLista = {
      ...hal,
      id: 'sem-origem',
      codinome: 'Recruta Desconhecido',
      especie: null,
      planetaNatal: null,
      anoIngresso: null,
    }
    render(<CartaoLanterna lanterna={semOrigem} nomeSetor="Setor 2814" />)
    expect(screen.getByText('Origem não registrada')).toBeDefined()
  })

  test('setor nulo mostra Sem setor', () => {
    const semSetor: LanternaLista = {
      ...hal,
      id: 'sem-setor',
      setorId: null,
    }
    render(<CartaoLanterna lanterna={semSetor} nomeSetor={null} />)
    expect(screen.getByText('Sem setor')).toBeDefined()
  })

  test('conteúdo longo pode quebrar dentro do cartão', () => {
    const nomeLongo = 'Kilowog-de-Bolovax-Vik-Instrutor-Chefe-da-Tropa-dos-Lanternas-Verdes'
    render(<CartaoLanterna lanterna={{ ...hal, codinome: nomeLongo }} nomeSetor="Setor 674" />)
    const link = screen.getByRole('link', { name: new RegExp(nomeLongo) })
    expect(link.className).toContain('min-w-0')
    expect(screen.getByText(nomeLongo).className).toContain('break-words')
  })
})
