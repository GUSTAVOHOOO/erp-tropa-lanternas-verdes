import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Comentarios } from '@/app/(painel)/painel/ocorrencias/_components/Comentarios'
import { FormComentario } from '@/app/(painel)/painel/ocorrencias/_components/FormComentario'
import { ApagarComentario } from '@/app/(painel)/painel/ocorrencias/_components/ApagarComentario'
import type { Comentario } from '@/lib/schemas/comentario'
import type { Sessao } from '@/lib/schemas/usuario'

vi.mock('@/app/(painel)/painel/ocorrencias/comentarios-actions', () => ({
  comentar: vi.fn(),
  apagarComentario: vi.fn(),
}))

import { comentar, apagarComentario } from '@/app/(painel)/painel/ocorrencias/comentarios-actions'

const sessaoGuardiao: Sessao = {
  id: '00000000-0000-4000-8000-000000000001',
  nome: 'Ganthet',
  email: 'ganthet@oa.tropa',
  papel: 'guardiao',
  setorId: null,
  lanternaId: null,
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const sessaoLanterna: Sessao = {
  id: '00000000-0000-4000-8000-000000000002',
  nome: 'Hal Jordan',
  email: 'hal@oa.tropa',
  papel: 'lanterna',
  setorId: 2814,
  lanternaId: 'hal-jordan',
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const sessaoOutroLanterna: Sessao = {
  id: '00000000-0000-4000-8000-000000000003',
  nome: 'John Stewart',
  email: 'john@oa.tropa',
  papel: 'lanterna',
  setorId: 2814,
  lanternaId: 'john-stewart',
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const ocorrenciaId = '00000000-0000-4000-8000-000000000010'

const comentariosExemplo: Comentario[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    ocorrenciaId,
    autorId: sessaoLanterna.id,
    autor: {
      id: sessaoLanterna.id,
      nome: sessaoLanterna.nome,
      papel: 'lanterna',
    },
    texto: 'Primeiro comentário de teste.\nCom quebra de linha.',
    criadoEm: '2026-11-10T12:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    ocorrenciaId,
    autorId: sessaoGuardiao.id,
    autor: {
      id: sessaoGuardiao.id,
      nome: sessaoGuardiao.nome,
      papel: 'guardiao',
    },
    texto: 'Texto com <b>tags HTML</b> que devem aparecer literais.',
    criadoEm: '2026-11-10T13:00:00.000Z',
  },
]

describe('Comentarios (Server Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('vazio exibe "Nenhum comentário ainda." e mantém o formulário de comentar', () => {
    render(<Comentarios ocorrenciaId={ocorrenciaId} comentarios={[]} sessao={sessaoLanterna} />)
    expect(screen.getByText('Nenhum comentário ainda.')).toBeDefined()
    expect(screen.getByLabelText('Comentário')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Comentar' })).toBeDefined()
  })

  test('renderiza lista de comentários com autor, data e texto puro', () => {
    render(<Comentarios ocorrenciaId={ocorrenciaId} comentarios={comentariosExemplo} sessao={sessaoGuardiao} />)
    const ul = screen.getByRole('list')
    expect(ul).toBeDefined()
    expect(screen.getByText(/Hal Jordan/)).toBeDefined()
    expect(screen.getByText(/Ganthet/)).toBeDefined()
    expect(screen.getAllByText(/10\/11\/2026/)).toHaveLength(2)

    // O texto com <b>tags HTML</b> aparece literal (não há elemento <b> no DOM)
    const textoComHtml = screen.getByText('Texto com <b>tags HTML</b> que devem aparecer literais.')
    expect(textoComHtml).toBeDefined()
    expect(textoComHtml.querySelector('b')).toBeNull()
  })

  test('sem controles de edição de comentário', () => {
    render(<Comentarios ocorrenciaId={ocorrenciaId} comentarios={comentariosExemplo} sessao={sessaoGuardiao} />)
    expect(screen.queryByRole('button', { name: /Editar comentário/i })).toBeNull()
  })

  test('visibilidade do botão Apagar: Guardião vê para todos os comentários', () => {
    render(<Comentarios ocorrenciaId={ocorrenciaId} comentarios={comentariosExemplo} sessao={sessaoGuardiao} />)
    const botoesApagar = screen.getAllByRole('button', { name: 'Apagar' })
    expect(botoesApagar).toHaveLength(2)
  })

  test('visibilidade do botão Apagar: Lanterna só vê para o próprio comentário', () => {
    render(<Comentarios ocorrenciaId={ocorrenciaId} comentarios={comentariosExemplo} sessao={sessaoLanterna} />)
    const botoesApagar = screen.getAllByRole('button', { name: 'Apagar' })
    expect(botoesApagar).toHaveLength(1)
  })

  test('visibilidade do botão Apagar: Lanterna sem comentários não vê nenhum botão Apagar', () => {
    render(<Comentarios ocorrenciaId={ocorrenciaId} comentarios={comentariosExemplo} sessao={sessaoOutroLanterna} />)
    expect(screen.queryByRole('button', { name: 'Apagar' })).toBeNull()
  })
})

describe('ApagarComentario (Client Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('apagar abre diálogo de confirmação acessível e cancela com Escape', async () => {
    render(<ApagarComentario ocorrenciaId={ocorrenciaId} comentarioId="00000000-0000-4000-8000-000000000201" />)

    expect(screen.queryByRole('alertdialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))

    const dialogo = screen.getByRole('alertdialog')
    expect(dialogo).toBeDefined()
    expect(within(dialogo).getByText('Apagar comentário')).toBeDefined()

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  test('cancelar fecha o diálogo sem chamar apagarComentario', () => {
    render(<ApagarComentario ocorrenciaId={ocorrenciaId} comentarioId="00000000-0000-4000-8000-000000000201" />)

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    const dialogo = screen.getByRole('alertdialog')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(apagarComentario).not.toHaveBeenCalled()
  })

  test('confirmar exclusão chama apagarComentario com IDs corretos', async () => {
    vi.mocked(apagarComentario).mockResolvedValueOnce({ ok: true })
    render(<ApagarComentario ocorrenciaId={ocorrenciaId} comentarioId="00000000-0000-4000-8000-000000000201" />)

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    const dialogo = screen.getByRole('alertdialog')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Apagar' }))

    expect(apagarComentario).toHaveBeenCalledWith(ocorrenciaId, '00000000-0000-4000-8000-000000000201')
  })

  test('erro ao apagar é exibido no diálogo', async () => {
    vi.mocked(apagarComentario).mockResolvedValueOnce({
      ok: false,
      erro: 'Só o autor ou um Guardião pode apagar este comentário.',
    })
    render(<ApagarComentario ocorrenciaId={ocorrenciaId} comentarioId="00000000-0000-4000-8000-000000000201" />)

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    const dialogo = screen.getByRole('alertdialog')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Apagar' }))

    expect(await screen.findByText('Só o autor ou um Guardião pode apagar este comentário.')).toBeDefined()
  })
})

describe('FormComentario (Client Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('envio com sucesso limpa campo e exibe status "Comentário publicado."', async () => {
    vi.mocked(comentar).mockResolvedValueOnce({ ok: true })
    render(<FormComentario ocorrenciaId={ocorrenciaId} />)

    const campo = screen.getByLabelText('Comentário') as HTMLTextAreaElement
    const botao = screen.getByRole('button', { name: 'Comentar' })

    fireEvent.change(campo, { target: { value: 'Comentário válido de teste.' } })
    expect(campo.value).toBe('Comentário válido de teste.')

    fireEvent.click(botao)

    await waitFor(() => {
      expect(comentar).toHaveBeenCalledWith(ocorrenciaId, { texto: 'Comentário válido de teste.' })
    })
    expect(await screen.findByText('Comentário publicado.')).toBeDefined()
    expect(screen.getByRole('status')).toBeDefined()
    expect(campo.value).toBe('')
  })

  test('erro de validação do servidor no campo texto', async () => {
    vi.mocked(comentar).mockResolvedValueOnce({
      ok: false,
      errors: { texto: ['Texto inválido pelo servidor.'] },
    })
    render(<FormComentario ocorrenciaId={ocorrenciaId} />)

    const campo = screen.getByLabelText('Comentário') as HTMLTextAreaElement
    fireEvent.change(campo, { target: { value: 'Texto enviado.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }))

    expect(await screen.findByRole('alert')).toBeDefined()
    expect(screen.getByText('Texto inválido pelo servidor.')).toBeDefined()
    expect(campo.value).toBe('Texto enviado.')
  })

  test('erro geral do servidor exibido em role alert', async () => {
    vi.mocked(comentar).mockResolvedValueOnce({
      ok: false,
      erro: 'Este comentário ou ocorrência não existe mais.',
    })
    render(<FormComentario ocorrenciaId={ocorrenciaId} />)

    const campo = screen.getByLabelText('Comentário') as HTMLTextAreaElement
    fireEvent.change(campo, { target: { value: 'Texto teste.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }))

    expect(await screen.findByText('Este comentário ou ocorrência não existe mais.')).toBeDefined()
    expect(campo.value).toBe('Texto teste.')
  })
})
