import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})

vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}))

const revalidatePathMock = vi.fn()
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))

const exigirPapelMock = vi.fn()
vi.mock('@/lib/dal', () => ({
  exigirPapel: (papel: string) => exigirPapelMock(papel),
}))

const criarLanternaMock = vi.fn()
const editarLanternaMock = vi.fn()
const alterarStatusLanternaMock = vi.fn()
const buscarLanternaMock = vi.fn()

vi.mock('@/lib/lanternas', () => ({
  criarLanterna: (...args: unknown[]) => criarLanternaMock(...args),
  editarLanterna: (...args: unknown[]) => editarLanternaMock(...args),
  alterarStatusLanterna: (...args: unknown[]) => alterarStatusLanternaMock(...args),
  buscarLanterna: (...args: unknown[]) => buscarLanternaMock(...args),
}))

import { ApiError } from '@/lib/api-error'
import {
  alterarStatusLanternaAcao,
  criarLanternaAcao,
  editarLanternaAcao,
} from '@/app/(painel)/painel/lanternas/actions'
import type { LanternaFicha } from '@/lib/schemas/lanterna'

const fichaMock: LanternaFicha = {
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
  mentorId: null,
  citacao: 'No dia mais claro',
  biografia: 'Piloto de testes',
  fontes: {},
  estatisticas: { resolvidas: 10, emAndamento: 1, tempoMedioResolucaoHoras: 2, cargaAtual: 1 },
  mentor: null,
  aprendizes: [],
}

describe('Server Actions de gestão de Lanternas (FE-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    exigirPapelMock.mockResolvedValue({ id: 'guardiao-1', papel: 'guardiao' })
    buscarLanternaMock.mockResolvedValue(fichaMock)
  })

  describe('Lanterna barrado (AUTH-05/06)', () => {
    it('criarLanternaAcao barra Lanterna redirecionando para /acesso-negado', async () => {
      exigirPapelMock.mockImplementationOnce(() => {
        redirectMock('/acesso-negado')
      })

      await expect(
        criarLanternaAcao({
          id: 'novo-lanterna',
          codinome: 'Novo Lanterna',
          especie: 'Humano',
          planetaNatal: 'Terra',
        }),
      ).rejects.toThrow('REDIRECT:/acesso-negado')

      expect(exigirPapelMock).toHaveBeenCalledWith('guardiao')
      expect(criarLanternaMock).not.toHaveBeenCalled()
    })

    it('editarLanternaAcao barra Lanterna antes de qualquer consulta', async () => {
      exigirPapelMock.mockImplementationOnce(() => {
        redirectMock('/acesso-negado')
      })

      await expect(
        editarLanternaAcao('hal-jordan', { codinome: 'Novo Nome' }),
      ).rejects.toThrow('REDIRECT:/acesso-negado')

      expect(exigirPapelMock).toHaveBeenCalledWith('guardiao')
      expect(buscarLanternaMock).not.toHaveBeenCalled()
      expect(editarLanternaMock).not.toHaveBeenCalled()
    })

    it('alterarStatusLanternaAcao barra Lanterna', async () => {
      exigirPapelMock.mockImplementationOnce(() => {
        redirectMock('/acesso-negado')
      })

      await expect(
        alterarStatusLanternaAcao('hal-jordan', 'afastado'),
      ).rejects.toThrow('REDIRECT:/acesso-negado')

      expect(exigirPapelMock).toHaveBeenCalledWith('guardiao')
      expect(alterarStatusLanternaMock).not.toHaveBeenCalled()
    })
  })

  describe('códigos de erro associados aos campos', () => {
    it('LANTERNA_JA_CADASTRADA associa o erro ao campo id', async () => {
      criarLanternaMock.mockRejectedValueOnce(new ApiError(409, 'LANTERNA_JA_CADASTRADA'))

      const resultado = await criarLanternaAcao({
        id: 'hal-jordan',
        codinome: 'Hal Jordan',
        especie: 'Humano',
        planetaNatal: 'Terra',
      })

      expect(resultado.ok).toBe(false)
      expect(resultado.errors?.id).toBeDefined()
      expect(resultado.errors?.id?.[0]).toContain('já está cadastrado')
    })

    it('MENTOR_INVALIDO associa o erro ao campo mentorId', async () => {
      criarLanternaMock.mockRejectedValueOnce(new ApiError(422, 'MENTOR_INVALIDO'))

      const resultado = await criarLanternaAcao({
        id: 'novo-lanterna',
        codinome: 'Novo Lanterna',
        especie: 'Humano',
        planetaNatal: 'Terra',
        mentorId: 'sinestro',
      })

      expect(resultado.ok).toBe(false)
      expect(resultado.errors?.mentorId).toBeDefined()
      expect(resultado.errors?.mentorId?.[0]).toContain('mentor')
    })

    it('404 com setorId associa erro ao campo setorId', async () => {
      criarLanternaMock.mockRejectedValueOnce(new ApiError(404, 'NAO_ENCONTRADO'))

      const resultado = await criarLanternaAcao({
        id: 'novo-lanterna',
        codinome: 'Novo Lanterna',
        especie: 'Humano',
        planetaNatal: 'Terra',
        setorId: 9999,
      })

      expect(resultado.ok).toBe(false)
      expect(resultado.errors?.setorId).toBeDefined()
    })

    it('LANTERNA_EM_USO associa o erro ao campo setorId', async () => {
      editarLanternaMock.mockRejectedValueOnce(new ApiError(409, 'LANTERNA_EM_USO'))

      const resultado = await editarLanternaAcao('hal-jordan', {
        ...fichaMock,
        setorId: null,
      })

      expect(resultado.ok).toBe(false)
      expect(resultado.errors?.setorId).toBeDefined()
      expect(resultado.errors?.setorId?.[0]).toContain('setor da ficha não pode mudar')
    })

    it('LANTERNA_EM_MISSAO vira erro geral', async () => {
      alterarStatusLanternaMock.mockRejectedValueOnce(new ApiError(409, 'LANTERNA_EM_MISSAO'))

      const resultado = await alterarStatusLanternaAcao('hal-jordan', 'afastado')

      expect(resultado.ok).toBe(false)
      expect(resultado.erro).toContain('em missão')
      expect(resultado.errors).toBeUndefined()
    })

    it('401 da API redireciona para /sessao-expirada', async () => {
      criarLanternaMock.mockRejectedValueOnce(new ApiError(401, 'NAO_AUTENTICADO'))

      await expect(
        criarLanternaAcao({
          id: 'kyle-rayner',
          codinome: 'Kyle Rayner',
          especie: 'Humano',
          planetaNatal: 'Terra',
        }),
      ).rejects.toThrow('REDIRECT:/sessao-expirada')
    })

    it('403 da API redireciona para /acesso-negado', async () => {
      criarLanternaMock.mockRejectedValueOnce(new ApiError(403, 'SEM_PERMISSAO'))

      await expect(
        criarLanternaAcao({
          id: 'kyle-rayner',
          codinome: 'Kyle Rayner',
          especie: 'Humano',
          planetaNatal: 'Terra',
        }),
      ).rejects.toThrow('REDIRECT:/acesso-negado')
    })
  })

  describe('nada alterado e validações prévias', () => {
    it('editarLanternaAcao devolve erro sem chamar a API se nada mudou', async () => {
      const resultado = await editarLanternaAcao('hal-jordan', {
        ...fichaMock,
      })

      expect(resultado.ok).toBe(false)
      expect(resultado.erro).toBe('Nada foi alterado.')
      expect(editarLanternaMock).not.toHaveBeenCalled()
    })

    it('alterarStatusLanternaAcao nunca envia em_missao para a API', async () => {
      const resultado = await alterarStatusLanternaAcao('hal-jordan', 'em_missao' as unknown as 'ativo')

      expect(resultado.ok).toBe(false)
      expect(resultado.erro).toContain('Status inválido')
      expect(alterarStatusLanternaMock).not.toHaveBeenCalled()
    })
  })

  describe('sucessos e navegações', () => {
    it('criarLanternaAcao com dados válidos revalida e redireciona para /painel/lanternas', async () => {
      criarLanternaMock.mockResolvedValueOnce(fichaMock)

      await expect(
        criarLanternaAcao({
          id: 'kyle-rayner',
          codinome: 'Kyle Rayner',
          especie: 'Humano',
          planetaNatal: 'Terra',
        }),
      ).rejects.toThrow('REDIRECT:/painel/lanternas')

      expect(revalidatePathMock).toHaveBeenCalledWith('/painel/lanternas')
      expect(revalidatePathMock).toHaveBeenCalledWith('/lanternas')
      expect(revalidatePathMock).toHaveBeenCalledWith('/painel', 'layout')
      expect(revalidatePathMock).toHaveBeenCalledWith('/lanternas/kyle-rayner') // Ficha pública
    })

    it('editarLanternaAcao revalida e redireciona', async () => {
      editarLanternaMock.mockResolvedValueOnce({ ...fichaMock, codinome: 'Hal J.' })

      await expect(
        editarLanternaAcao('hal-jordan', {
          ...fichaMock,
          codinome: 'Hal J.',
        }),
      ).rejects.toThrow('REDIRECT:/painel/lanternas')

      expect(revalidatePathMock).toHaveBeenCalledWith('/painel/lanternas')
      expect(revalidatePathMock).toHaveBeenCalledWith('/lanternas')
      expect(revalidatePathMock).toHaveBeenCalledWith('/painel', 'layout')
      expect(revalidatePathMock).toHaveBeenCalledWith('/lanternas/hal-jordan') // Ficha pública
    })

    it('criarLanternaAcao aceita Setor 0 válido e repassa para a API', async () => {
      criarLanternaMock.mockResolvedValueOnce({ ...fichaMock, setorId: 0 })

      await expect(
        criarLanternaAcao({
          id: 'kyle-rayner',
          codinome: 'Kyle Rayner',
          especie: 'Humano',
          planetaNatal: 'Terra',
          setorId: '0',
        }),
      ).rejects.toThrow('REDIRECT:/painel/lanternas')

      expect(criarLanternaMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'kyle-rayner',
          setorId: 0,
        }),
      )
    })

    it('editarLanternaAcao com ficha inexistente devolve erro amigável', async () => {
      buscarLanternaMock.mockResolvedValueOnce(null)

      const resultado = await editarLanternaAcao('desconhecido', { codinome: 'Nome' })
      expect(resultado).toEqual({ ok: false, erro: 'Esta ficha de Lanterna não existe mais.' })
      expect(editarLanternaMock).not.toHaveBeenCalled()
    })

    it('alterarStatusLanternaAcao devolve ok:true sem redirecionar', async () => {
      alterarStatusLanternaMock.mockResolvedValueOnce({ ...fichaMock, status: 'afastado' })

      const resultado = await alterarStatusLanternaAcao('hal-jordan', 'afastado')

      expect(resultado).toEqual({ ok: true })
      expect(revalidatePathMock).toHaveBeenCalledWith('/painel/lanternas')
      expect(revalidatePathMock).toHaveBeenCalledWith('/lanternas')
      expect(revalidatePathMock).toHaveBeenCalledWith('/painel', 'layout')
      expect(revalidatePathMock).toHaveBeenCalledWith('/lanternas/hal-jordan') // Ficha pública
      expect(redirectMock).not.toHaveBeenCalled()
    })
  })
})
