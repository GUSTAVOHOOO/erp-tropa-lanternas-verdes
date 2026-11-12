// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError } from '@/lib/api-error'
import { exigirPapel } from '@/lib/dal'
import { alterarPapel, vincularLanterna } from '@/lib/gestao-usuarios'
import type { Sessao, Usuario } from '@/lib/schemas/usuario'
import { alterarPapelAcao, vincularLanternaAcao } from '@/app/(painel)/painel/usuarios/actions'

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

vi.mock('@/lib/gestao-usuarios', () => ({
  alterarPapel: vi.fn(),
  vincularLanterna: vi.fn(),
}))

const guardiaoLogado: Sessao = {
  id: '00000000-0000-4000-8000-000000000001',
  nome: 'Ganthet',
  email: 'ganthet@oa.tropa',
  papel: 'guardiao',
  setorId: null,
  lanternaId: null,
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const outroUsuario: Usuario = {
  id: '00000000-0000-4000-8000-000000000002',
  nome: 'Hal Jordan',
  email: 'hal@oa.tropa',
  papel: 'lanterna',
  setorId: 2814,
  lanternaId: 'hal-jordan',
  criadoEm: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(exigirPapel).mockResolvedValue(guardiaoLogado)
  vi.mocked(alterarPapel).mockResolvedValue(outroUsuario)
  vi.mocked(vincularLanterna).mockResolvedValue(outroUsuario)
})

describe('ações de gestão de usuários', () => {
  describe('segurança e permissões', () => {
    test('Lanterna é barrado por exigirPapel em alterarPapelAcao', async () => {
      vi.mocked(exigirPapel).mockImplementation(async () => {
        redirect('/acesso-negado')
      })

      await expect(
        alterarPapelAcao(outroUsuario.id, { papel: 'guardiao' }),
      ).rejects.toThrow('NEXT_REDIRECT /acesso-negado')

      expect(alterarPapel).not.toHaveBeenCalled()
    })

    test('Lanterna é barrado por exigirPapel em vincularLanternaAcao', async () => {
      vi.mocked(exigirPapel).mockImplementation(async () => {
        redirect('/acesso-negado')
      })

      await expect(
        vincularLanternaAcao(outroUsuario.id, { lanternaId: 'hal-jordan' }),
      ).rejects.toThrow('NEXT_REDIRECT /acesso-negado')

      expect(vincularLanterna).not.toHaveBeenCalled()
    })
  })

  describe('alterarPapelAcao', () => {
    test('destino guardiao nunca envia setorId mesmo se fornecido no formulário', async () => {
      await expect(
        alterarPapelAcao(outroUsuario.id, { papel: 'guardiao', setorId: '2814' }),
      ).rejects.toThrow(`NEXT_REDIRECT /painel/usuarios?conta=${outroUsuario.id}`)

      expect(alterarPapel).toHaveBeenCalledWith(outroUsuario.id, { papel: 'guardiao' })
    })

    test('aceita Setor 0 como valor válido para destino lanterna', async () => {
      await expect(
        alterarPapelAcao(outroUsuario.id, { papel: 'lanterna', setorId: '0' }),
      ).rejects.toThrow(`NEXT_REDIRECT /painel/usuarios?conta=${outroUsuario.id}`)

      expect(alterarPapel).toHaveBeenCalledWith(outroUsuario.id, { papel: 'lanterna', setorId: 0 })
    })

    test('omite setorId quando mantido o setor atual (string vazia)', async () => {
      await expect(
        alterarPapelAcao(outroUsuario.id, { papel: 'lanterna', setorId: '' }),
      ).rejects.toThrow(`NEXT_REDIRECT /painel/usuarios?conta=${outroUsuario.id}`)

      expect(alterarPapel).toHaveBeenCalledWith(outroUsuario.id, { papel: 'lanterna' })
    })

    test('revalida layout completo quando a conta alterada é a do próprio Guardião logado', async () => {
      await expect(
        alterarPapelAcao(guardiaoLogado.id, { papel: 'guardiao' }),
      ).rejects.toThrow(`NEXT_REDIRECT /painel/usuarios?conta=${guardiaoLogado.id}`)

      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(revalidatePath).toHaveBeenCalledWith('/painel/usuarios')
    })

    test('não revalida layout quando a conta alterada for de outro usuário', async () => {
      await expect(
        alterarPapelAcao(outroUsuario.id, { papel: 'lanterna', setorId: 2814 }),
      ).rejects.toThrow(`NEXT_REDIRECT /painel/usuarios?conta=${outroUsuario.id}`)

      expect(revalidatePath).not.toHaveBeenCalledWith('/', 'layout')
      expect(revalidatePath).toHaveBeenCalledWith('/painel/usuarios')
    })

    test('direciona erro ULTIMO_GUARDIAO para erro geral', async () => {
      vi.mocked(alterarPapel).mockRejectedValue(new ApiError(409, 'ULTIMO_GUARDIAO'))

      const resultado = await alterarPapelAcao(guardiaoLogado.id, { papel: 'lanterna', setorId: 2814 })
      expect(resultado.ok).toBe(false)
      expect(resultado.erro).toBe('Não é possível alterar o papel do último Guardião.')
      expect(resultado.errors).toBeUndefined()
    })

    test('direciona erro SETOR_OBRIGATORIO para o campo setorId', async () => {
      vi.mocked(alterarPapel).mockRejectedValue(new ApiError(422, 'SETOR_OBRIGATORIO'))

      const resultado = await alterarPapelAcao(outroUsuario.id, { papel: 'lanterna' })
      expect(resultado.ok).toBe(false)
      expect(resultado.errors?.setorId).toContain('É obrigatório informar um setor para o Lanterna.')
    })

    test('direciona erro SETOR_DIFERENTE para o campo setorId', async () => {
      vi.mocked(alterarPapel).mockRejectedValue(new ApiError(422, 'SETOR_DIFERENTE'))

      const resultado = await alterarPapelAcao(outroUsuario.id, { papel: 'lanterna', setorId: 100 })
      expect(resultado.ok).toBe(false)
      expect(resultado.errors?.setorId).toContain('O setor informado é diferente do setor da ficha vinculada.')
    })

    test('erro 404 retorna mensagem amigável de inexistência', async () => {
      vi.mocked(alterarPapel).mockRejectedValue(new ApiError(404, 'NAO_ENCONTRADO'))

      const resultado = await alterarPapelAcao('00000000-0000-4000-8000-000000000999', { papel: 'guardiao' })
      expect(resultado.ok).toBe(false)
      expect(resultado.erro).toBe('Esta conta ou Ficha não existe mais.')
    })

    test('redireciona para /sessao-expirada em caso de erro 401 da API', async () => {
      vi.mocked(alterarPapel).mockRejectedValue(new ApiError(401, 'NAO_AUTENTICADO'))

      await expect(
        alterarPapelAcao(outroUsuario.id, { papel: 'lanterna', setorId: 2814 }),
      ).rejects.toThrow('NEXT_REDIRECT /sessao-expirada')
    })

    test('redireciona para /acesso-negado em caso de erro 403 da API', async () => {
      vi.mocked(alterarPapel).mockRejectedValue(new ApiError(403, 'SEM_PERMISSAO'))

      await expect(
        alterarPapelAcao(outroUsuario.id, { papel: 'lanterna', setorId: 2814 }),
      ).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
    })
  })

  describe('vincularLanternaAcao', () => {
    test('desvincula passando null ao serviço quando lanternaId é vazio', async () => {
      await expect(
        vincularLanternaAcao(outroUsuario.id, { lanternaId: '' }),
      ).rejects.toThrow(`NEXT_REDIRECT /painel/usuarios?conta=${outroUsuario.id}`)

      expect(vincularLanterna).toHaveBeenCalledWith(outroUsuario.id, null)
    })

    test('vincula com slug válido', async () => {
      await expect(
        vincularLanternaAcao(outroUsuario.id, { lanternaId: 'hal-jordan' }),
      ).rejects.toThrow(`NEXT_REDIRECT /painel/usuarios?conta=${outroUsuario.id}`)

      expect(vincularLanterna).toHaveBeenCalledWith(outroUsuario.id, 'hal-jordan')
    })

    test('revalida layout completo quando a conta vinculada é a do próprio Guardião logado', async () => {
      await expect(
        vincularLanternaAcao(guardiaoLogado.id, { lanternaId: '' }),
      ).rejects.toThrow(`NEXT_REDIRECT /painel/usuarios?conta=${guardiaoLogado.id}`)

      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(revalidatePath).toHaveBeenCalledWith('/painel/usuarios')
    })

    test('não revalida layout quando a conta vinculada for de outro usuário', async () => {
      await expect(
        vincularLanternaAcao(outroUsuario.id, { lanternaId: 'hal-jordan' }),
      ).rejects.toThrow(`NEXT_REDIRECT /painel/usuarios?conta=${outroUsuario.id}`)

      expect(revalidatePath).not.toHaveBeenCalledWith('/', 'layout')
      expect(revalidatePath).toHaveBeenCalledWith('/painel/usuarios')
    })

    test('direciona erro VINCULO_NAO_PERMITIDO para o campo lanternaId', async () => {
      vi.mocked(vincularLanterna).mockRejectedValue(new ApiError(422, 'VINCULO_NAO_PERMITIDO'))

      const resultado = await vincularLanternaAcao(guardiaoLogado.id, { lanternaId: 'hal-jordan' })
      expect(resultado.ok).toBe(false)
      expect(resultado.errors?.lanternaId).toContain('Apenas contas de Lanterna podem ser vinculadas a uma ficha.')
    })

    test('direciona erro SETOR_DIFERENTE para o campo lanternaId', async () => {
      vi.mocked(vincularLanterna).mockRejectedValue(new ApiError(422, 'SETOR_DIFERENTE'))

      const resultado = await vincularLanternaAcao(outroUsuario.id, { lanternaId: 'sinestro' })
      expect(resultado.ok).toBe(false)
      expect(resultado.errors?.lanternaId).toContain('O setor informado é diferente do setor da ficha vinculada.')
    })

    test('direciona erro LANTERNA_JA_VINCULADA para o campo lanternaId', async () => {
      vi.mocked(vincularLanterna).mockRejectedValue(new ApiError(409, 'LANTERNA_JA_VINCULADA'))

      const resultado = await vincularLanternaAcao(outroUsuario.id, { lanternaId: 'guy-gardner' })
      expect(resultado.ok).toBe(false)
      expect(resultado.errors?.lanternaId).toContain('Este Lanterna já está vinculado a outra conta.')
    })

    test('erro 404 retorna mensagem amigável de inexistência', async () => {
      vi.mocked(vincularLanterna).mockRejectedValue(new ApiError(404, 'NAO_ENCONTRADO'))

      const resultado = await vincularLanternaAcao(outroUsuario.id, { lanternaId: 'inexistente' })
      expect(resultado.ok).toBe(false)
      expect(resultado.erro).toBe('Esta conta ou Ficha não existe mais.')
    })

    test('redireciona para /sessao-expirada em caso de erro 401 da API', async () => {
      vi.mocked(vincularLanterna).mockRejectedValue(new ApiError(401, 'NAO_AUTENTICADO'))

      await expect(
        vincularLanternaAcao(outroUsuario.id, { lanternaId: 'hal-jordan' }),
      ).rejects.toThrow('NEXT_REDIRECT /sessao-expirada')
    })

    test('redireciona para /acesso-negado em caso de erro 403 da API', async () => {
      vi.mocked(vincularLanterna).mockRejectedValue(new ApiError(403, 'SEM_PERMISSAO'))

      await expect(
        vincularLanternaAcao(outroUsuario.id, { lanternaId: 'hal-jordan' }),
      ).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
    })
  })
})
