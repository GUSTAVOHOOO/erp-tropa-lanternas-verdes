import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT ${destino}`)
  }),
}))

vi.mock('next/navigation', () => ({
  redirect,
  usePathname: () => '/painel/usuarios',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/components/CampoSelect', () => ({
  CampoSelect: ({ id, rotulo, itens, valor, aoMudar, erro }: {
    id: string
    rotulo: string
    itens: Record<string, string>
    valor: string | null | undefined
    aoMudar: (v: string | null) => void
    erro?: string
  }) => (
    <div>
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} value={valor ?? ''} onChange={(e) => aoMudar(e.target.value)}>
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

vi.mock('@/lib/dal', () => ({
  exigirPapel: vi.fn(),
}))

vi.mock('@/lib/gestao-usuarios', () => ({
  listarUsuarios: vi.fn(),
  alterarPapel: vi.fn(),
  vincularLanterna: vi.fn(),
}))

vi.mock('@/lib/setores', () => ({
  listarSetores: vi.fn(),
}))

vi.mock('@/lib/lanternas', () => ({
  listarTodosLanternas: vi.fn(),
}))

vi.mock('@/app/(painel)/painel/usuarios/actions', () => ({
  alterarPapelAcao: vi.fn(),
  vincularLanternaAcao: vi.fn(),
}))

import UsuariosPage from '@/app/(painel)/painel/usuarios/page'
import { FormPapel } from '@/app/(painel)/painel/usuarios/_components/FormPapel'
import { FormVinculo } from '@/app/(painel)/painel/usuarios/_components/FormVinculo'
import { alterarPapelAcao, vincularLanternaAcao } from '@/app/(painel)/painel/usuarios/actions'
import { exigirPapel } from '@/lib/dal'
import { listarUsuarios } from '@/lib/gestao-usuarios'
import { listarTodosLanternas } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import type { LanternaLista } from '@/lib/schemas/lanterna'
import type { Setor } from '@/lib/schemas/setor'
import type { Usuario } from '@/lib/schemas/usuario'

const setoresMock: Setor[] = [
  { id: 0, nome: 'Setor 0 (Oa)', descricao: 'Centro do Universo' },
  { id: 2814, nome: 'Setor 2814', descricao: 'Terra e arredores' },
  { id: 674, nome: 'Setor 674', descricao: 'Setor de Kilowog' },
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
    id: 'john-stewart',
    codinome: 'John Stewart',
    identidadeCivil: 'John Stewart',
    especie: 'Humano',
    planetaNatal: 'Terra',
    setorId: 2814,
    status: 'ativo',
    anoIngresso: 1971,
  },
  {
    id: 'kilowog',
    codinome: 'Kilowog',
    identidadeCivil: 'Kilowog',
    especie: 'Bolovax Vik',
    planetaNatal: 'Bolovax Vik',
    setorId: 674,
    status: 'ativo',
    anoIngresso: 1986,
  },
]

const usuariosMock: Usuario[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    nome: 'Ganthet de Oa',
    email: 'ganthet@oa.tropa',
    papel: 'guardiao',
    setorId: 0,
    lanternaId: null,
    criadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    nome: 'Hal Jordan',
    email: 'hal@oa.tropa',
    papel: 'lanterna',
    setorId: 2814,
    lanternaId: 'hal-jordan',
    criadoEm: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    nome: 'Recruta Sem Ficha',
    email: 'recruta@oa.tropa',
    papel: 'lanterna',
    setorId: 2814,
    lanternaId: null,
    criadoEm: '2026-01-03T00:00:00.000Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(exigirPapel).mockResolvedValue(usuariosMock[0])
  vi.mocked(listarSetores).mockResolvedValue(setoresMock)
  vi.mocked(listarTodosLanternas).mockResolvedValue(lanternasMock)
  vi.mocked(listarUsuarios).mockResolvedValue({
    itens: usuariosMock,
    meta: { total: 3, pagina: 1, limite: 20, paginas: 1 },
  })
  vi.mocked(alterarPapelAcao).mockResolvedValue({ ok: true })
  vi.mocked(vincularLanternaAcao).mockResolvedValue({ ok: true })
})

describe('tela de gestão de usuários /painel/usuarios', () => {
  test('exibe tabela com colunas: nome, e-mail, papel (texto), setor, Ficha vinculada e link Gerenciar', async () => {
    const pagina = await UsuariosPage({ searchParams: Promise.resolve({}) })
    render(pagina)

    expect(screen.getByText('Ganthet de Oa')).toBeDefined()
    expect(screen.getByText('ganthet@oa.tropa')).toBeDefined()
    expect(screen.getByText('Guardião')).toBeDefined()

    expect(screen.getAllByText('Hal Jordan').length).toBe(2)
    expect(screen.getByText('hal@oa.tropa')).toBeDefined()
    expect(screen.getAllByText('Lanterna').length).toBeGreaterThan(0)

    // Ficha vinculada: codinome ou "Sem vínculo"
    expect(screen.getAllByText('Sem vínculo').length).toBeGreaterThan(0)

    // Links "Gerenciar" para cada conta
    const linksGerenciar = screen.getAllByRole('link', { name: /gerenciar/i })
    expect(linksGerenciar.length).toBe(3)
  })

  test('vazio sem busca exibe "Nenhuma conta cadastrada"', async () => {
    vi.mocked(listarUsuarios).mockResolvedValue({
      itens: [],
      meta: { total: 0, pagina: 1, limite: 20, paginas: 0 },
    })

    const pagina = await UsuariosPage({ searchParams: Promise.resolve({}) })
    render(pagina)

    expect(screen.getByText('Nenhuma conta cadastrada')).toBeDefined()
  })

  test('vazio com busca exibe "Nenhuma conta encontrada"', async () => {
    vi.mocked(listarUsuarios).mockResolvedValue({
      itens: [],
      meta: { total: 0, pagina: 1, limite: 20, paginas: 0 },
    })

    const pagina = await UsuariosPage({ searchParams: Promise.resolve({ busca: 'inexistente' }) })
    render(pagina)

    expect(screen.getByText('Nenhuma conta encontrada')).toBeDefined()
  })

  test('link Gerenciar na URL (?conta={id}) abre os formulários daquela conta acima da tabela', async () => {
    const pagina = await UsuariosPage({
      searchParams: Promise.resolve({ conta: '00000000-0000-4000-8000-000000000002' }),
    })
    render(pagina)

    expect(screen.getByText(/Gerenciar conta: Hal Jordan/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /salvar papel/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /salvar vínculo/i })).toBeDefined()
  })

  test('conta informada na URL mas ausente nesta página mostra mensagem de erro', async () => {
    const pagina = await UsuariosPage({
      searchParams: Promise.resolve({ conta: '00000000-0000-4000-8000-000000000999' }),
    })
    render(pagina)

    expect(screen.getByText('Conta não encontrada nesta página')).toBeDefined()
  })
})

describe('formulário FormPapel', () => {
  test('setor só aparece quando destino for lanterna', async () => {
    // Conta inicial guardiao: select de setor não deve aparecer
    const { rerender } = render(
      <FormPapel usuario={usuariosMock[0]} setores={setoresMock} />,
    )
    expect(screen.queryByLabelText(/setor da conta/i)).toBeNull()

    // Conta inicial lanterna: select de setor aparece com opção "Manter o setor atual"
    rerender(<FormPapel usuario={usuariosMock[1]} setores={setoresMock} />)
    expect(screen.getByLabelText(/setor da conta/i)).toBeDefined()
    expect(screen.getByText('Manter o setor atual')).toBeDefined()
  })

  test('submissão chama alterarPapelAcao e desabilita botão durante envio', async () => {
    let resolverEnvio!: (val: { ok: boolean }) => void
    const promessaEnvio = new Promise<{ ok: boolean }>((res) => {
      resolverEnvio = res
    })
    vi.mocked(alterarPapelAcao).mockReturnValue(promessaEnvio as never)

    render(<FormPapel usuario={usuariosMock[0]} setores={setoresMock} />)

    const botaoSalvar = screen.getByRole('button', { name: /salvar papel/i })
    fireEvent.click(botaoSalvar)

    await waitFor(() => {
      expect(botaoSalvar.hasAttribute('disabled')).toBe(true)
      expect(screen.getByText('Salvando...')).toBeDefined()
    })

    resolverEnvio({ ok: true })

    await waitFor(() => {
      expect(alterarPapelAcao).toHaveBeenCalledWith(usuariosMock[0].id, { papel: 'guardiao' })
    })
  })

  test('exibe erro geral vindo do servidor', async () => {
    vi.mocked(alterarPapelAcao).mockResolvedValue({
      ok: false,
      erro: 'Não é possível alterar o papel do último Guardião.',
    })

    render(<FormPapel usuario={usuariosMock[0]} setores={setoresMock} />)

    fireEvent.click(screen.getByRole('button', { name: /salvar papel/i }))

    await waitFor(() => {
      expect(screen.getByText('Não é possível alterar o papel do último Guardião.')).toBeDefined()
    })
  })
})

describe('formulário FormVinculo', () => {
  test('inclui opção "Sem vínculo" (desvincular) e filtra fichas pelo setor da conta', () => {
    render(<FormVinculo usuario={usuariosMock[1]} lanternas={lanternasMock} />)

    // Opção "Sem vínculo" existe
    expect(screen.getByText('Sem vínculo')).toBeDefined()

    // Hal Jordan é do setor 2814: deve listar Hal Jordan e John Stewart (setor 2814), mas não Kilowog (setor 674)
    expect(screen.getByText('John Stewart')).toBeDefined()
    expect(screen.queryByText('Kilowog')).toBeNull()
  })

  test('submissão chama vincularLanternaAcao e desabilita botão durante envio', async () => {
    let resolverEnvio!: (val: { ok: boolean }) => void
    const promessaEnvio = new Promise<{ ok: boolean }>((res) => {
      resolverEnvio = res
    })
    vi.mocked(vincularLanternaAcao).mockReturnValue(promessaEnvio as never)

    render(<FormVinculo usuario={usuariosMock[1]} lanternas={lanternasMock} />)

    const botaoSalvar = screen.getByRole('button', { name: /salvar vínculo/i })
    fireEvent.click(botaoSalvar)

    await waitFor(() => {
      expect(botaoSalvar.hasAttribute('disabled')).toBe(true)
      expect(screen.getByText('Salvando...')).toBeDefined()
    })

    resolverEnvio({ ok: true })

    await waitFor(() => {
      expect(vincularLanternaAcao).toHaveBeenCalledWith(usuariosMock[1].id, {
        lanternaId: 'hal-jordan',
      })
    })
  })

  test('exibe erro de campo vindo do servidor', async () => {
    vi.mocked(vincularLanternaAcao).mockResolvedValue({
      ok: false,
      errors: { lanternaId: ['Este Lanterna já está vinculado a outra conta.'] },
    })

    render(<FormVinculo usuario={usuariosMock[1]} lanternas={lanternasMock} />)

    fireEvent.click(screen.getByRole('button', { name: /salvar vínculo/i }))

    await waitFor(() => {
      expect(screen.getByText('Este Lanterna já está vinculado a outra conta.')).toBeDefined()
    })
  })
})
