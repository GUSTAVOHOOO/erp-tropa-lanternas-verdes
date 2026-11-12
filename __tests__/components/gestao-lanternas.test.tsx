import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/(painel)/painel/lanternas/actions', () => ({
  criarLanternaAcao: vi.fn(),
  editarLanternaAcao: vi.fn(),
  alterarStatusLanternaAcao: vi.fn(),
}))

vi.mock('@/lib/dal', () => ({
  exigirPapel: vi.fn(),
}))

vi.mock('@/lib/lanternas', () => ({
  listarLanternas: vi.fn(),
  buscarLanterna: vi.fn(),
  listarTodosLanternas: vi.fn(),
}))

vi.mock('@/lib/setores', () => ({
  listarSetores: vi.fn(),
}))

vi.mock('@/components/CampoSelect', () => ({
  CampoSelect: ({
    id,
    rotulo,
    itens,
    valor,
    aoMudar,
    erro,
  }: {
    id: string
    rotulo: string
    itens: Record<string, string>
    valor: string | null | undefined
    aoMudar: (v: string | null) => void
    erro?: string
  }) => (
    <div data-testid={`campo-select-${id}`}>
      <label htmlFor={id}>{rotulo}</label>
      <select
        id={id}
        data-testid={id}
        value={valor ?? ''}
        onChange={(e) => aoMudar(e.target.value)}
      >
        {Object.entries(itens).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {erro && <span role="alert">{erro}</span>}
    </div>
  ),
}))

import {
  alterarStatusLanternaAcao,
  criarLanternaAcao,
  editarLanternaAcao,
} from '@/app/(painel)/painel/lanternas/actions'
import { FormLanterna } from '@/app/(painel)/painel/lanternas/_components/FormLanterna'
import { StatusLanterna } from '@/app/(painel)/painel/lanternas/_components/StatusLanterna'
import PainelLanternasPage from '@/app/(painel)/painel/lanternas/page'
import { buscarLanterna, listarLanternas, listarTodosLanternas } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import type { LanternaFicha, LanternaLista } from '@/lib/schemas/lanterna'
import type { Setor } from '@/lib/schemas/setor'

const setoresMock: Setor[] = [
  { id: 2814, nome: 'Terra e vizinhança', descricao: 'Setor espacial da Terra' },
  { id: 0, nome: 'Oa', descricao: 'Centro do universo e cidadela dos Guardiões' },
]

const lanternasMock: LanternaLista[] = [
  {
    id: 'hal-jordan',
    codinome: 'Hal Jordan',
    identidadeCivil: 'Harold Jordan',
    especie: 'Humano',
    planetaNatal: 'Terra',
    setorId: 2814,
    status: 'ativo',
    anoIngresso: 1959,
  },
  {
    id: 'sinestro',
    codinome: 'Sinestro',
    identidadeCivil: 'Thaal Sinestro',
    especie: 'Korugariano',
    planetaNatal: 'Korugar',
    setorId: 1417,
    status: 'afastado',
    anoIngresso: 1961,
  },
  {
    id: 'kilowog',
    codinome: 'Kilowog',
    identidadeCivil: null,
    especie: 'Bolovaxiano',
    planetaNatal: 'Bolovax Vik',
    setorId: 674,
    status: 'em_missao',
    anoIngresso: 1986,
  },
]

const fichaHalMock: LanternaFicha = {
  id: 'hal-jordan',
  codinome: 'Hal Jordan',
  identidadeCivil: 'Harold Jordan',
  especie: 'Humano',
  planetaNatal: 'Terra',
  setorId: 2814,
  status: 'ativo',
  anoIngresso: 1959,
  primeiraAparicao: 'Showcase #22',
  habilidades: ['Voo', 'Construtos de energia'],
  mentorId: 'sinestro',
  citacao: 'No dia mais claro',
  biografia: 'Piloto de testes da Força Aérea.',
  fontes: {},
  estatisticas: { resolvidas: 12, emAndamento: 1, tempoMedioResolucaoHoras: 3.5, cargaAtual: 1 },
  mentor: null,
  aprendizes: [],
}

describe('Componentes de gestão de Lanternas (FE-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('StatusLanterna', () => {
    it('para ativo exibe botão Afastar habilitado que chama a action', async () => {
      vi.mocked(alterarStatusLanternaAcao).mockResolvedValueOnce({ ok: true })

      render(<StatusLanterna slug="hal-jordan" status="ativo" />)
      const botao = screen.getByRole('button', { name: 'Afastar' })
      expect(botao).toBeDefined()
      expect(botao.hasAttribute('disabled')).toBe(false)

      fireEvent.click(botao)
      await waitFor(() => {
        expect(alterarStatusLanternaAcao).toHaveBeenCalledWith('hal-jordan', 'afastado')
      })
    })

    it('para afastado exibe botão Reativar habilitado que chama a action', async () => {
      vi.mocked(alterarStatusLanternaAcao).mockResolvedValueOnce({ ok: true })

      render(<StatusLanterna slug="sinestro" status="afastado" />)
      const botao = screen.getByRole('button', { name: 'Reativar' })
      expect(botao).toBeDefined()
      expect(botao.hasAttribute('disabled')).toBe(false)

      fireEvent.click(botao)
      await waitFor(() => {
        expect(alterarStatusLanternaAcao).toHaveBeenCalledWith('sinestro', 'ativo')
      })
    })

    it('para em_missao exibe botão desabilitado com o texto explicativo', () => {
      render(<StatusLanterna slug="kilowog" status="em_missao" />)
      const botao = screen.getByRole('button', {
        name: 'Em missão: o status muda quando a missão terminar',
      })
      expect(botao).toBeDefined()
      expect(botao.hasAttribute('disabled')).toBe(true)

      fireEvent.click(botao)
      expect(alterarStatusLanternaAcao).not.toHaveBeenCalled()
    })

    it('exibe mensagem de erro quando a action de status falha', async () => {
      vi.mocked(alterarStatusLanternaAcao).mockResolvedValueOnce({
        ok: false,
        erro: 'O Lanterna está em missão; o status só muda quando a missão terminar.',
      })

      render(<StatusLanterna slug="hal-jordan" status="ativo" />)
      fireEvent.click(screen.getByRole('button', { name: 'Afastar' }))

      expect(
        await screen.findByText('O Lanterna está em missão; o status só muda quando a missão terminar.'),
      ).toBeDefined()
    })
  })

  describe('FormLanterna (criação vs edição)', () => {
    it('no modo criação exibe campo id (slug) e submete para criarLanternaAcao', async () => {
      vi.mocked(criarLanternaAcao).mockResolvedValueOnce({ ok: true })

      render(
        <FormLanterna
          modo="criacao"
          setores={setoresMock}
          lanternas={lanternasMock}
        />,
      )

      expect(screen.getByLabelText('Identificador (slug)')).toBeDefined()
      expect(screen.getByRole('button', { name: 'Cadastrar Lanterna' })).toBeDefined()

      fireEvent.change(screen.getByLabelText('Identificador (slug)'), {
        target: { value: 'novo-recruta' },
      })
      fireEvent.change(screen.getByLabelText('Codinome'), {
        target: { value: 'Novo Recruta' },
      })
      fireEvent.change(screen.getByLabelText('Espécie'), {
        target: { value: 'Humano' },
      })
      fireEvent.change(screen.getByLabelText('Planeta natal'), {
        target: { value: 'Terra' },
      })

      fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Lanterna' }))

      await waitFor(() => {
        expect(criarLanternaAcao).toHaveBeenCalled()
      })
    })

    it('no modo edição não exibe campo id e exclui a própria ficha da lista de mentores', () => {
      render(
        <FormLanterna
          modo="edicao"
          ficha={fichaHalMock}
          setores={setoresMock}
          lanternas={lanternasMock}
        />,
      )

      expect(screen.queryByLabelText('Identificador (slug)')).toBeNull()
      expect(screen.getByDisplayValue('Hal Jordan')).toBeDefined()
      expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDefined()

      const mentorSelect = screen.getByTestId('mentorId')
      const options = Array.from(mentorSelect.querySelectorAll('option')).map((o) => o.value)
      expect(options).not.toContain('hal-jordan')
      expect(options).toContain('sinestro')
      expect(options).toContain('kilowog')
      expect(options).toContain('')
    })

    it('no modo edição avisa "Nada foi alterado." se o formulário for enviado sem mudanças', async () => {
      render(
        <FormLanterna
          modo="edicao"
          ficha={fichaHalMock}
          setores={setoresMock}
          lanternas={lanternasMock}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

      expect(await screen.findByText('Nada foi alterado.')).toBeDefined()
      expect(editarLanternaAcao).not.toHaveBeenCalled()
    })

    it('no modo edição envia apenas os campos alterados para editarLanternaAcao', async () => {
      vi.mocked(editarLanternaAcao).mockResolvedValueOnce({ ok: true })

      render(
        <FormLanterna
          modo="edicao"
          ficha={fichaHalMock}
          setores={setoresMock}
          lanternas={lanternasMock}
        />,
      )

      fireEvent.change(screen.getByLabelText('Codinome'), {
        target: { value: 'Hal Jordan Líder' },
      })

      fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

      await waitFor(() => {
        expect(editarLanternaAcao).toHaveBeenCalledWith('hal-jordan', {
          codinome: 'Hal Jordan Líder',
        })
      })
    })

    it('associa erros do servidor aos campos e preserva o valor digitado', async () => {
      vi.mocked(criarLanternaAcao).mockResolvedValueOnce({
        ok: false,
        errors: { id: ['Este Lanterna já está cadastrado.'] },
      })

      render(
        <FormLanterna
          modo="criacao"
          setores={setoresMock}
          lanternas={lanternasMock}
        />,
      )

      fireEvent.change(screen.getByLabelText('Identificador (slug)'), {
        target: { value: 'hal-jordan' },
      })
      fireEvent.change(screen.getByLabelText('Codinome'), {
        target: { value: 'Hal Jordan' },
      })
      fireEvent.change(screen.getByLabelText('Espécie'), {
        target: { value: 'Humano' },
      })
      fireEvent.change(screen.getByLabelText('Planeta natal'), {
        target: { value: 'Terra' },
      })

      fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Lanterna' }))

      expect(await screen.findByText('Este Lanterna já está cadastrado.')).toBeDefined()
      expect(screen.getByDisplayValue('hal-jordan')).toBeDefined()
      expect(screen.getByDisplayValue('Hal Jordan')).toBeDefined()
    })
  })

  describe('Tabela de Lanternas (PainelLanternasPage)', () => {
    it('renderiza colunas, links, selos de status e ações', async () => {
      vi.mocked(listarLanternas).mockResolvedValueOnce({
        itens: lanternasMock,
        meta: { total: 3, pagina: 1, limite: 20, paginas: 1 },
      })
      vi.mocked(listarSetores).mockResolvedValueOnce(setoresMock)
      vi.mocked(listarTodosLanternas).mockResolvedValueOnce(lanternasMock)

      const Page = await PainelLanternasPage({
        searchParams: Promise.resolve({}),
      })

      render(Page)

      expect(screen.getByText('Hal Jordan')).toBeDefined()
      expect(screen.getByText('Sinestro')).toBeDefined()
      expect(screen.getByText('Kilowog')).toBeDefined()

      const linkFichaHal = screen.getByRole('link', { name: /Hal Jordan/ })
      expect(linkFichaHal.getAttribute('href')).toBe('/lanternas/hal-jordan')

      expect(screen.getByText('Ativo')).toBeDefined()
      expect(screen.getByText('Afastado')).toBeDefined()
      expect(screen.getByText('Em missão')).toBeDefined()

      const linksEditar = screen.getAllByRole('link', { name: 'Editar' })
      expect(linksEditar.length).toBe(3)
      expect(linksEditar[0].getAttribute('href')).toBe('/painel/lanternas?editar=hal-jordan')

      expect(screen.getByRole('button', { name: 'Afastar' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'Reativar' })).toBeDefined()
      expect(
        screen.getByRole('button', {
          name: 'Em missão: o status muda quando a missão terminar',
        }),
      ).toBeDefined()
    })

    it('exibe estado vazio quando não há registros', async () => {
      vi.mocked(listarLanternas).mockResolvedValueOnce({
        itens: [],
        meta: { total: 0, pagina: 1, limite: 20, paginas: 0 },
      })
      vi.mocked(listarSetores).mockResolvedValueOnce(setoresMock)
      vi.mocked(listarTodosLanternas).mockResolvedValueOnce([])

      const Page = await PainelLanternasPage({
        searchParams: Promise.resolve({ busca: 'inexistente' }),
      })

      render(Page)

      expect(screen.getByText('Nenhuma ficha encontrada')).toBeDefined()
      expect(
        screen.getByText('Nenhum Lanterna corresponde aos filtros aplicados.'),
      ).toBeDefined()
    })

    it('quando ?editar={slug} está presente, carrega e exibe o formulário de edição', async () => {
      vi.mocked(listarLanternas).mockResolvedValueOnce({
        itens: lanternasMock,
        meta: { total: 3, pagina: 1, limite: 20, paginas: 1 },
      })
      vi.mocked(listarSetores).mockResolvedValueOnce(setoresMock)
      vi.mocked(listarTodosLanternas).mockResolvedValueOnce(lanternasMock)
      vi.mocked(buscarLanterna).mockResolvedValueOnce(fichaHalMock)

      const Page = await PainelLanternasPage({
        searchParams: Promise.resolve({ editar: 'hal-jordan' }),
      })

      render(Page)

      expect(buscarLanterna).toHaveBeenCalledWith('hal-jordan')
      expect(screen.getByText('Editar Ficha: Hal Jordan')).toBeDefined()
      expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDefined()
    })
  })
})
