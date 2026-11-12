import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/lib/dal', () => ({
  exigirPapel: vi.fn(),
}))

vi.mock('@/lib/setores', () => ({
  listarSetores: vi.fn(),
  buscarSetor: vi.fn(),
}))

vi.mock('@/app/(painel)/painel/setores/actions', () => ({
  criarSetorAcao: vi.fn(),
  editarSetorAcao: vi.fn(),
  excluirSetorAcao: vi.fn(),
}))

import { exigirPapel } from '@/lib/dal'
import { listarSetores } from '@/lib/setores'
import { criarSetorAcao, editarSetorAcao, excluirSetorAcao } from '@/app/(painel)/painel/setores/actions'
import SetoresPage from '@/app/(painel)/painel/setores/page'
import { FormSetor } from '@/app/(painel)/painel/setores/_components/FormSetor'
import { ExcluirSetor } from '@/app/(painel)/painel/setores/_components/ExcluirSetor'

const setoresMock = [
  {
    id: 2814,
    nome: 'Setor 2814',
    descricao: 'Setor espacial que protege a Terra e arredores.',
  },
  {
    id: 674,
    nome: 'Setor 674',
    descricao: 'Setor de Bolovax Vik protegido por Kilowog.',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(exigirPapel).mockResolvedValue({
    id: '00000000-0000-4000-8000-000000000001',
    nome: 'Ganthet',
    email: 'ganthet@oa.tropa',
    papel: 'guardiao',
    setorId: null,
    lanternaId: null,
    criadoEm: '2026-01-01T00:00:00.000Z',
  })
  vi.mocked(listarSetores).mockResolvedValue(setoresMock)
})

describe('componentes de gestão de setores', () => {
  describe('SetoresPage', () => {
    it('renderiza lista de setores com número, nome, descrição e ações', async () => {
      const page = await SetoresPage({ searchParams: Promise.resolve({}) })
      render(page)

      expect(screen.getByText('2814')).toBeDefined()
      expect(screen.getByText('Setor 2814')).toBeDefined()
      expect(screen.getByText('Setor espacial que protege a Terra e arredores.')).toBeDefined()
      expect(screen.getByText('674')).toBeDefined()
      expect(screen.getByText('Setor 674')).toBeDefined()

      const botoesEditar = screen.getAllByRole('link', { name: /editar/i })
      expect(botoesEditar.length).toBeGreaterThanOrEqual(2)
      const botoesExcluir = screen.getAllByRole('button', { name: /excluir/i })
      expect(botoesExcluir.length).toBeGreaterThanOrEqual(2)
    })

    it('renderiza estado vazio "Nenhum setor cadastrado" quando a lista estiver vazia', async () => {
      vi.mocked(listarSetores).mockResolvedValue([])
      const page = await SetoresPage({ searchParams: Promise.resolve({}) })
      render(page)

      expect(screen.getByText('Nenhum setor cadastrado')).toBeDefined()
    })

    it('renderiza cabeçalho único h1 "Gestão de Setores" (CSS-07)', async () => {
      const page = await SetoresPage({ searchParams: Promise.resolve({}) })
      render(page)

      const h1 = screen.getByRole('heading', { level: 1, name: 'Gestão de Setores' })
      expect(h1).toBeDefined()
    })

    it('renderiza modo de edição quando ?editar={id} estiver presente', async () => {
      const page = await SetoresPage({ searchParams: Promise.resolve({ editar: '2814' }) })
      render(page)

      expect(screen.getByRole('heading', { name: 'Editar setor 2814' })).toBeDefined()
      expect(screen.getByRole('link', { name: 'Cancelar edição' })).toBeDefined()
    })

    it('renderiza e suporta Setor 0', async () => {
      vi.mocked(listarSetores).mockResolvedValue([
        { id: 0, nome: 'Setor Zero', descricao: 'Oa e o núcleo da galáxia.' },
      ])
      const page = await SetoresPage({ searchParams: Promise.resolve({}) })
      render(page)

      expect(screen.getByText('0')).toBeDefined()
      expect(screen.getByText('Setor Zero')).toBeDefined()
      const linkEditar = screen.getByRole('link', { name: /editar/i })
      expect(linkEditar.getAttribute('href')).toBe('/painel/setores?editar=0')
    })
  })

  describe('FormSetor', () => {
    it('em modo de edição renderiza campos preenchidos e envia para editarSetorAcao', async () => {
      vi.mocked(editarSetorAcao).mockResolvedValue({ ok: true })

      render(
        <FormSetor
          setor={{
            id: 2814,
            nome: 'Setor 2814',
            descricao: 'Descrição longa do setor espacial 2814.',
          }}
        />,
      )

      expect(screen.getByDisplayValue('Setor 2814')).toBeDefined()
      expect(screen.getByDisplayValue('Descrição longa do setor espacial 2814.')).toBeDefined()

      fireEvent.change(screen.getByLabelText(/nome/i), {
        target: { value: 'Setor 2814 Atualizado' },
      })

      const botaoSalvar = screen.getByRole('button', { name: /salvar alterações/i })
      fireEvent.click(botaoSalvar)

      await waitFor(() => {
        expect(editarSetorAcao).toHaveBeenCalledWith(2814, {
          nome: 'Setor 2814 Atualizado',
          descricao: 'Descrição longa do setor espacial 2814.',
        })
      })
    })
    it('exibe erros de validação nos campos quando submetido vazio', async () => {
      render(<FormSetor />)

      const botaoEnviar = screen.getByRole('button', { name: /cadastrar setor/i })
      fireEvent.click(botaoEnviar)

      await waitFor(() => {
        expect(screen.getByText('Informe o número do setor.')).toBeDefined()
        expect(screen.getByText('O nome deve ter pelo menos 2 caracteres.')).toBeDefined()
        expect(screen.getByText('A descrição deve ter pelo menos 10 caracteres.')).toBeDefined()
      })
      expect(criarSetorAcao).not.toHaveBeenCalled()
    })

    it('desabilita botão de envio durante submissão', async () => {
      let resolverEnvio!: (val: { ok: boolean }) => void
      const promessaEnvio = new Promise<{ ok: boolean }>((res) => {
        resolverEnvio = res
      })
      vi.mocked(criarSetorAcao).mockReturnValue(promessaEnvio as never)

      render(<FormSetor />)

      fireEvent.change(screen.getByLabelText(/número do setor/i), { target: { value: '4100' } })
      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Setor 4100' } })
      fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Descrição válida de teste.' } })

      const botaoEnviar = screen.getByRole('button', { name: /cadastrar setor/i })
      fireEvent.click(botaoEnviar)

      await waitFor(() => {
        expect(botaoEnviar.hasAttribute('disabled')).toBe(true)
      })

      resolverEnvio({ ok: true })
    })
  })

  describe('ExcluirSetor', () => {
    it('abre confirmação alertdialog e Escape fecha devolvendo o foco ao gatilho', async () => {
      render(<ExcluirSetor setorId={2814} />)

      const gatilho = screen.getByRole('button', { name: 'Excluir' })
      fireEvent.click(gatilho)

      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toBeDefined()
      expect(dialog.getAttribute('aria-modal')).toBe('true')

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

      expect(screen.queryByRole('alertdialog')).toBeNull()
      await waitFor(() => expect(document.activeElement).toBe(gatilho))
    })

    it('exibe erro geral quando falha exclusão de setor em uso', async () => {
      vi.mocked(excluirSetorAcao).mockResolvedValue({
        ok: false,
        erro: 'Este setor tem lanternas, ocorrências ou contas ligadas e não pode ser removido.',
      })

      render(<ExcluirSetor setorId={2814} />)

      fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
      const botaoConfirmar = screen.getByRole('button', { name: 'Confirmar exclusão' })
      fireEvent.click(botaoConfirmar)

      expect(excluirSetorAcao).toHaveBeenCalledWith(2814)
      expect(
        await screen.findByText('Este setor tem lanternas, ocorrências ou contas ligadas e não pode ser removido.'),
      ).toBeDefined()
    })
  })
})
