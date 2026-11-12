// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError } from '@/lib/api-error'
import { exigirPapel } from '@/lib/dal'
import { buscarSetor, criarSetor, editarSetor, excluirSetor } from '@/lib/setores'
import { criarSetorAcao, editarSetorAcao, excluirSetorAcao } from '@/app/(painel)/painel/setores/actions'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/dal', () => ({
  exigirPapel: vi.fn(),
}))

vi.mock('@/lib/setores', () => ({
  listarSetores: vi.fn(),
  buscarSetor: vi.fn(),
  criarSetor: vi.fn(),
  editarSetor: vi.fn(),
  excluirSetor: vi.fn(),
}))

const setorBase = {
  id: 2814,
  nome: 'Setor 2814',
  descricao: 'Setor espacial 2814 que protege a Terra.',
}

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
  vi.mocked(buscarSetor).mockResolvedValue(setorBase)
  vi.mocked(criarSetor).mockResolvedValue(setorBase)
  vi.mocked(editarSetor).mockResolvedValue(setorBase)
  vi.mocked(excluirSetor).mockResolvedValue(undefined)
})

describe('actions de gestão de setores', () => {
  describe('permissões de acesso (AUTH-05, AUTH-06)', () => {
    it('Lanterna é barrado em criarSetorAcao sem chamar API', async () => {
      vi.mocked(exigirPapel).mockImplementation(async () => {
        redirect('/acesso-negado')
      })
      await expect(
        criarSetorAcao({
          id: 500,
          nome: 'Setor 500',
          descricao: 'Descrição longa do setor 500.',
        }),
      ).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
      expect(criarSetor).not.toHaveBeenCalled()
    })

    it('Lanterna é barrado em editarSetorAcao sem chamar API', async () => {
      vi.mocked(exigirPapel).mockImplementation(async () => {
        redirect('/acesso-negado')
      })
      await expect(
        editarSetorAcao(2814, {
          nome: 'Novo nome',
        }),
      ).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
      expect(editarSetor).not.toHaveBeenCalled()
    })

    it('Lanterna é barrado em excluirSetorAcao sem chamar API', async () => {
      vi.mocked(exigirPapel).mockImplementation(async () => {
        redirect('/acesso-negado')
      })
      await expect(excluirSetorAcao(2814)).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
      expect(excluirSetor).not.toHaveBeenCalled()
    })
  })

  describe('criarSetorAcao', () => {
    it('validação falha quando campos são inválidos', async () => {
      const res = await criarSetorAcao({
        id: '',
        nome: 'A',
        descricao: 'Curta',
      })
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.errors?.id).toBeDefined()
        expect(res.errors?.nome).toBeDefined()
        expect(res.errors?.descricao).toBeDefined()
      }
      expect(criarSetor).not.toHaveBeenCalled()
    })

    it('aceita Setor 0 válido e redireciona', async () => {
      await expect(
        criarSetorAcao({
          id: '0',
          nome: 'Setor Zero',
          descricao: 'Oa e o núcleo sagrado do universo.',
        }),
      ).rejects.toThrow('NEXT_REDIRECT /painel/setores')

      expect(criarSetor).toHaveBeenCalledWith({
        id: 0,
        nome: 'Setor Zero',
        descricao: 'Oa e o núcleo sagrado do universo.',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/painel/setores')
      expect(revalidatePath).toHaveBeenCalledWith('/lanternas')
      expect(revalidatePath).toHaveBeenCalledWith('/cadastro')
      expect(redirect).toHaveBeenCalledWith('/painel/setores')
    })

    it('409 SETOR_JA_CADASTRADO vai para o campo id', async () => {
      vi.mocked(criarSetor).mockRejectedValue(new ApiError(409, 'SETOR_JA_CADASTRADO'))
      const res = await criarSetorAcao({
        id: 2814,
        nome: 'Setor 2814',
        descricao: 'Descrição longa do setor 2814.',
      })
      expect(res).toEqual({
        ok: false,
        errors: { id: ['Este setor já está cadastrado.'] },
      })
    })

    it('401 redireciona para /sessao-expirada', async () => {
      vi.mocked(criarSetor).mockRejectedValue(new ApiError(401, 'NAO_AUTENTICADO'))
      await expect(
        criarSetorAcao({
          id: 500,
          nome: 'Setor 500',
          descricao: 'Descrição longa do setor 500.',
        }),
      ).rejects.toThrow('NEXT_REDIRECT /sessao-expirada')
      expect(redirect).toHaveBeenCalledWith('/sessao-expirada')
    })

    it('403 redireciona para /acesso-negado', async () => {
      vi.mocked(criarSetor).mockRejectedValue(new ApiError(403, 'SEM_PERMISSAO'))
      await expect(
        criarSetorAcao({
          id: 500,
          nome: 'Setor 500',
          descricao: 'Descrição longa do setor 500.',
        }),
      ).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
      expect(redirect).toHaveBeenCalledWith('/acesso-negado')
    })
  })

  describe('editarSetorAcao', () => {
    it('retorna "Nada foi alterado." se os campos forem iguais aos atuais', async () => {
      const res = await editarSetorAcao(2814, {
        nome: 'Setor 2814',
        descricao: 'Setor espacial 2814 que protege a Terra.',
      })
      expect(res).toEqual({
        ok: false,
        erro: 'Nada foi alterado.',
      })
      expect(editarSetor).not.toHaveBeenCalled()
    })

    it('envia somente campos alterados e redireciona', async () => {
      await expect(
        editarSetorAcao(2814, {
          nome: 'Setor 2814 Atualizado',
          descricao: 'Setor espacial 2814 que protege a Terra.',
        }),
      ).rejects.toThrow('NEXT_REDIRECT /painel/setores')

      expect(editarSetor).toHaveBeenCalledWith(2814, {
        nome: 'Setor 2814 Atualizado',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/painel/setores')
      expect(revalidatePath).toHaveBeenCalledWith('/lanternas')
      expect(revalidatePath).toHaveBeenCalledWith('/cadastro')
      expect(redirect).toHaveBeenCalledWith('/painel/setores')
    })

    it('404 vira mensagem "Este setor não existe mais."', async () => {
      vi.mocked(buscarSetor).mockResolvedValue(null)
      const res = await editarSetorAcao(9999, {
        nome: 'Novo Nome',
      })
      expect(res).toEqual({
        ok: false,
        erro: 'Este setor não existe mais.',
      })
      expect(editarSetor).not.toHaveBeenCalled()
    })

    it('aceita Setor 0 válido para edição e envia campos', async () => {
      vi.mocked(buscarSetor).mockResolvedValue({
        id: 0,
        nome: 'Setor Zero Antigo',
        descricao: 'Descrição do setor zero.',
      })
      await expect(
        editarSetorAcao(0, {
          nome: 'Setor Zero Atualizado',
        }),
      ).rejects.toThrow('NEXT_REDIRECT /painel/setores')

      expect(editarSetor).toHaveBeenCalledWith(0, {
        nome: 'Setor Zero Atualizado',
      })
    })

    it('id inválido retorna mensagem de setor inexistente sem consultar API', async () => {
      const res = await editarSetorAcao(-1, { nome: 'Nome' })
      expect(res).toEqual({
        ok: false,
        erro: 'Este setor não existe mais.',
      })
      expect(buscarSetor).not.toHaveBeenCalled()
      expect(editarSetor).not.toHaveBeenCalled()
    })

    it('401 em editarSetorAcao redireciona para /sessao-expirada', async () => {
      vi.mocked(editarSetor).mockRejectedValue(new ApiError(401, 'NAO_AUTENTICADO'))
      await expect(
        editarSetorAcao(2814, {
          nome: 'Nome Atualizado',
        }),
      ).rejects.toThrow('NEXT_REDIRECT /sessao-expirada')
      expect(redirect).toHaveBeenCalledWith('/sessao-expirada')
    })

    it('403 em editarSetorAcao redireciona para /acesso-negado', async () => {
      vi.mocked(editarSetor).mockRejectedValue(new ApiError(403, 'SEM_PERMISSAO'))
      await expect(
        editarSetorAcao(2814, {
          nome: 'Nome Atualizado',
        }),
      ).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
      expect(redirect).toHaveBeenCalledWith('/acesso-negado')
    })
  })

  describe('excluirSetorAcao', () => {
    it('sucesso revalida caminhos e redireciona', async () => {
      await expect(excluirSetorAcao(3601)).rejects.toThrow('NEXT_REDIRECT /painel/setores')
      expect(excluirSetor).toHaveBeenCalledWith(3601)
      expect(revalidatePath).toHaveBeenCalledWith('/painel/setores')
      expect(revalidatePath).toHaveBeenCalledWith('/lanternas')
      expect(revalidatePath).toHaveBeenCalledWith('/cadastro')
      expect(redirect).toHaveBeenCalledWith('/painel/setores')
    })

    it('aceita Setor 0 válido para exclusão e redireciona', async () => {
      await expect(excluirSetorAcao(0)).rejects.toThrow('NEXT_REDIRECT /painel/setores')
      expect(excluirSetor).toHaveBeenCalledWith(0)
    })

    it('id inválido retorna mensagem de setor inexistente sem chamar excluirSetor', async () => {
      const res = await excluirSetorAcao(-1)
      expect(res).toEqual({
        ok: false,
        erro: 'Este setor não existe mais.',
      })
      expect(excluirSetor).not.toHaveBeenCalled()
    })

    it('401 em excluirSetorAcao redireciona para /sessao-expirada', async () => {
      vi.mocked(excluirSetor).mockRejectedValue(new ApiError(401, 'NAO_AUTENTICADO'))
      await expect(excluirSetorAcao(2814)).rejects.toThrow('NEXT_REDIRECT /sessao-expirada')
      expect(redirect).toHaveBeenCalledWith('/sessao-expirada')
    })

    it('403 em excluirSetorAcao redireciona para /acesso-negado', async () => {
      vi.mocked(excluirSetor).mockRejectedValue(new ApiError(403, 'SEM_PERMISSAO'))
      await expect(excluirSetorAcao(2814)).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
      expect(redirect).toHaveBeenCalledWith('/acesso-negado')
    })

    it('409 SETOR_EM_USO vira mensagem geral amigável', async () => {
      vi.mocked(excluirSetor).mockRejectedValue(new ApiError(409, 'SETOR_EM_USO'))
      const res = await excluirSetorAcao(2814)
      expect(res).toEqual({
        ok: false,
        erro: 'Este setor tem lanternas, ocorrências ou contas ligadas e não pode ser removido.',
      })
    })

    it('404 vira mensagem "Este setor não existe mais."', async () => {
      vi.mocked(excluirSetor).mockRejectedValue(new ApiError(404, 'NAO_ENCONTRADO'))
      const res = await excluirSetorAcao(9999)
      expect(res).toEqual({
        ok: false,
        erro: 'Este setor não existe mais.',
      })
    })
  })
})
