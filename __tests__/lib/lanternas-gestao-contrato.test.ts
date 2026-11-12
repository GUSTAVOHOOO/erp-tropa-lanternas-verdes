// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const fakeEnv = vi.hoisted(() => ({ apiUrl: 'http://127.0.0.1:46789' }))
vi.mock('@/lib/env', () => ({
  get env() {
    return { API_URL: fakeEnv.apiUrl }
  },
}))
vi.mock('@/lib/dal', () => ({
  lerTokenObrigatorio: vi.fn(async () => 'fake-token-guardiao'),
}))

import { ApiError } from '@/lib/api-error'
import { alterarStatusLanterna, criarLanterna, editarLanterna } from '@/lib/lanternas'
import { camposAlterados, lanternaFormularioSchema } from '@/lib/schemas/gestao-lanterna'
import type { LanternaFicha } from '@/lib/schemas/lanterna'

describe('gestão de Lanternas pelo contrato (FE-08)', () => {
  let servidor: { url: string; setScenario: (id: string) => void; reset: () => void; close: () => Promise<void> }

  beforeAll(async () => {
    const { createContractServer } = await import('../../scripts/contrato/servidor.mjs')
    servidor = await createContractServer({ port: 46789 })
    fakeEnv.apiUrl = servidor.url
  })

  afterAll(async () => {
    await servidor?.close()
  })

  beforeEach(() => {
    servidor.reset()
  })

  describe('contrato HTTP da API', () => {
    it('criar 201 cria uma nova ficha de Lanterna com sucesso', async () => {
      servidor.setScenario('criarLanterna.201')
      const ficha = await criarLanterna({
        id: 'novo-lanterna',
        codinome: 'Novo Lanterna',
        especie: 'Humano',
        planetaNatal: 'Terra',
        identidadeCivil: 'Teste Civil',
        setorId: 2814,
        anoIngresso: 2026,
        primeiraAparicao: 'HQ #1',
        habilidades: ['Voo', 'Construtos de energia'],
        mentorId: 'hal-jordan',
        citacao: 'No dia mais claro na noite mais densa',
        biografia: 'História do novo guerreiro da tropa.',
        fontes: {},
      })
      expect(ficha).toBeDefined()
      expect(ficha.id).toBeDefined()
      expect(ficha.codinome).toBeDefined()
    })

    it('duplicada 409 retorna LANTERNA_JA_CADASTRADA', async () => {
      servidor.setScenario('criarLanterna.409.LANTERNA_JA_CADASTRADA')
      await expect(
        criarLanterna({
          id: 'hal-jordan',
          codinome: 'Hal Jordan',
          especie: 'Humano',
          planetaNatal: 'Terra',
        }),
      ).rejects.toThrow(ApiError)

      try {
        await criarLanterna({
          id: 'hal-jordan',
          codinome: 'Hal Jordan',
          especie: 'Humano',
          planetaNatal: 'Terra',
        })
      } catch (erro) {
        expect(erro).toBeInstanceOf(ApiError)
        expect((erro as ApiError).status).toBe(409)
        expect((erro as ApiError).codigo).toBe('LANTERNA_JA_CADASTRADA')
      }
    })

    it('mentor inválido 422 retorna MENTOR_INVALIDO', async () => {
      servidor.setScenario('criarLanterna.422.MENTOR_INVALIDO')
      try {
        await criarLanterna({
          id: 'novo-lanterna',
          codinome: 'Novo Lanterna',
          especie: 'Humano',
          planetaNatal: 'Terra',
          mentorId: 'mentor-invalido',
        })
      } catch (erro) {
        expect(erro).toBeInstanceOf(ApiError)
        expect((erro as ApiError).status).toBe(422)
        expect((erro as ApiError).codigo).toBe('MENTOR_INVALIDO')
      }
    })

    it('editar só campos alterados 200 envia payload válido e recebe a ficha atualizada', async () => {
      servidor.setScenario('editarLanterna.200')
      const ficha = await editarLanterna('hal-jordan', {
        codinome: 'Hal Jordan Atualizado',
      })
      expect(ficha).toBeDefined()
      expect(ficha.id).toBe('hal-jordan')
    })

    it('em uso 409 retorna LANTERNA_EM_USO ao trocar ou anular setor com vínculos', async () => {
      servidor.setScenario('editarLanterna.409.LANTERNA_EM_USO.anular-setor')
      try {
        await editarLanterna('lanterna-em-uso', {
          setorId: null,
        })
      } catch (erro) {
        expect(erro).toBeInstanceOf(ApiError)
        expect((erro as ApiError).status).toBe(409)
        expect((erro as ApiError).codigo).toBe('LANTERNA_EM_USO')
      }
    })

    it('status afastado 200 atualiza status para afastado', async () => {
      servidor.setScenario('alterarStatusLanterna.200')
      const ficha = await alterarStatusLanterna('hal-jordan', 'afastado')
      expect(ficha).toBeDefined()
    })

    it('status ativo 200 reativa lanterna afastado', async () => {
      servidor.setScenario('alterarStatusLanterna.200.reativar')
      const ficha = await alterarStatusLanterna('hal-jordan', 'ativo')
      expect(ficha).toBeDefined()
    })

    it('em missão 409 retorna LANTERNA_EM_MISSAO ao tentar afastar ficha em missão', async () => {
      servidor.setScenario('alterarStatusLanterna.409.LANTERNA_EM_MISSAO.afastar')
      try {
        await alterarStatusLanterna('lanterna-em-missao', 'afastado')
      } catch (erro) {
        expect(erro).toBeInstanceOf(ApiError)
        expect((erro as ApiError).status).toBe(409)
        expect((erro as ApiError).codigo).toBe('LANTERNA_EM_MISSAO')
      }
    })
  })

  describe('schema e utilitários de gestão', () => {
    it('campos vazios viram null em lanternaFormularioSchema', () => {
      const parsed = lanternaFormularioSchema.parse({
        id: 'novo-lanterna',
        codinome: 'Novo Lanterna',
        especie: 'Humano',
        planetaNatal: 'Terra',
        identidadeCivil: '',
        setorId: '',
        anoIngresso: '',
        primeiraAparicao: '',
        habilidades: '',
        mentorId: '',
        citacao: '',
        biografia: '',
      })

      expect(parsed.identidadeCivil).toBeNull()
      expect(parsed.setorId).toBeNull()
      expect(parsed.anoIngresso).toBeNull()
      expect(parsed.primeiraAparicao).toBeNull()
      expect(parsed.habilidades).toEqual([])
      expect(parsed.mentorId).toBeNull()
      expect(parsed.citacao).toBeNull()
      expect(parsed.biografia).toBeNull()
    })

    it('habilidades são convertidas em array trimado sem vazios e limitadas a 10', () => {
      const parsed = lanternaFormularioSchema.parse({
        codinome: 'Teste Habilidades',
        especie: 'Humano',
        planetaNatal: 'Terra',
        habilidades: '  Voo , Construtos de energia \n Força sobre-humana ,  ',
      })

      expect(parsed.habilidades).toEqual(['Voo', 'Construtos de energia', 'Força sobre-humana'])

      const maisDe10 = Array.from({ length: 11 }, (_, i) => `Habilidade ${i + 1}`).join(', ')
      const resultado = lanternaFormularioSchema.safeParse({
        codinome: 'Teste Habilidades',
        especie: 'Humano',
        planetaNatal: 'Terra',
        habilidades: maisDe10,
      })
      expect(resultado.success).toBe(false)
    })

    it('citação com mais de 15 palavras falha no refine', () => {
      const com16 = 'uma duas três quatro cinco seis sete oito nove dez onze doze treze quatorze quinze dezesseis'
      const resultado16 = lanternaFormularioSchema.safeParse({
        codinome: 'Teste Citação',
        especie: 'Humano',
        planetaNatal: 'Terra',
        citacao: com16,
      })
      expect(resultado16.success).toBe(false)

      const com15 = 'uma duas três quatro cinco seis sete oito nove dez onze doze treze quatorze quinze'
      const resultado15 = lanternaFormularioSchema.safeParse({
        codinome: 'Teste Citação',
        especie: 'Humano',
        planetaNatal: 'Terra',
        citacao: com15,
      })
      expect(resultado15.success).toBe(true)
    })

    it('camposAlterados distingue campo omitido de null e inclui somente alterações reais', () => {
      const fichaBase: LanternaFicha = {
        id: 'hal-jordan',
        codinome: 'Hal Jordan',
        identidadeCivil: 'Harold Jordan',
        especie: 'Humano',
        planetaNatal: 'Terra',
        setorId: 2814,
        status: 'ativo',
        anoIngresso: 1959,
        primeiraAparicao: 'Showcase #22',
        habilidades: ['Voo', 'Construtos'],
        mentorId: 'sinestro',
        citacao: 'No dia mais claro',
        biografia: 'Piloto de testes destemido.',
        fontes: {},
        estatisticas: { resolvidas: 10, emAndamento: 2, tempoMedioResolucaoHoras: 4.5, cargaAtual: 2 },
        mentor: null,
        aprendizes: [],
      }

      // Nada alterado: objeto vazio
      expect(camposAlterados(fichaBase, { ...fichaBase })).toEqual({})

      // Campo alterado
      expect(camposAlterados(fichaBase, { codinome: 'Hal Jordan II' })).toEqual({ codinome: 'Hal Jordan II' })

      // Campo omitido (undefined) não entra no resultado
      const resultadoOmitido = camposAlterados(fichaBase, { codinome: 'Hal' })
      expect(resultadoOmitido).toEqual({ codinome: 'Hal' })
      expect('setorId' in resultadoOmitido).toBe(false)
      expect('identidadeCivil' in resultadoOmitido).toBe(false)

      // Campo explicitamente setado como null que antes tinha valor ENTRA no resultado
      const resultadoNulo = camposAlterados(fichaBase, { setorId: null, identidadeCivil: null })
      expect(resultadoNulo).toEqual({ setorId: null, identidadeCivil: null })

      // Campo que já era null e continua null não entra
      const fichaComNulos = { ...fichaBase, setorId: null, identidadeCivil: null }
      const resultadoPermaneceNulo = camposAlterados(fichaComNulos, { setorId: null, identidadeCivil: null })
      expect(resultadoPermaneceNulo).toEqual({})
    })
  })
})
