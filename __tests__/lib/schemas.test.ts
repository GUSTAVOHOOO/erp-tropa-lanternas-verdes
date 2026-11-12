// @vitest-environment node
import * as z from 'zod'
import { describe, expect, test } from 'vitest'
import { setorSchema } from '@/lib/schemas/setor'
import { lanternaListaSchema, filtroLanternasSchema } from '@/lib/schemas/lanterna'
import { loginSchema } from '@/lib/schemas/login'
import {
  atribuicaoSchema,
  atualizarStatusSchema,
  filtroOcorrenciasSchema,
  novaOcorrenciaSchema,
  ocorrenciaSchema,
} from '@/lib/schemas/ocorrencia'
import { ApiError } from '@/lib/api-error'

const ocorrenciaContrato = {
  id: '00000000-0000-4000-8000-000000000201',
  titulo: 'Ocorrência de contrato O1',
  descricao: 'Descrição fictícia com extensão válida.',
  planeta: 'Terra',
  setorId: 2814,
  gravidade: 'critica' as const,
  status: 'em_andamento' as const,
  envolvidos: 2,
  responsavelId: 'hal-jordan',
  resolucao: null,
  criadaPorId: '00000000-0000-4000-8000-000000000102',
  criadaEm: '2026-11-08T14:00:00Z',
  resolvidaEm: null,
  prazoEm: '2026-11-09T14:00:00Z',
  vencida: false,
}

describe('exemplos do contrato passam nos schemas de resposta', () => {
  test('todas as coleções passam no schema', () => {
    expect(() => z.array(setorSchema).parse([{ id: 0, nome: 'Setor Zero', descricao: 'Setor válido para os testes.' }])).not.toThrow()
    expect(() => z.array(lanternaListaSchema).parse([{ id: 'hal-jordan', codinome: 'Hal Jordan', identidadeCivil: null, especie: null, planetaNatal: null, setorId: 0, status: 'ativo', anoIngresso: null }])).not.toThrow()
    expect(() => z.array(ocorrenciaSchema).parse([ocorrenciaContrato])).not.toThrow()
  })
})

describe('novaOcorrenciaSchema', () => {
  const valida = { titulo: '  Ataque em Oa  ', descricao: 'Muitos invasores na Bateria Central.', planeta: 'Oa', setorId: '0', gravidade: 'alta', envolvidos: '3' }

  test('limpa espaços e converte o número que vem do input', () => {
    const dados = novaOcorrenciaSchema.parse(valida)
    expect(dados.titulo).toBe('Ataque em Oa')
    expect(dados.envolvidos).toBe(3)
  })

  test('mensagens em português para cada campo inválido', () => {
    const r = novaOcorrenciaSchema.safeParse({ titulo: 'abc', descricao: 'curta', planeta: 'x', setorId: 'invalido', gravidade: 'xyz', envolvidos: '0' })
    expect(r.success).toBe(false)
    const erros = z.flattenError(r.error!).fieldErrors
    expect(erros.titulo?.[0]).toBe('O título precisa ter pelo menos 5 caracteres.')
    expect(erros.descricao?.[0]).toBe('Descreva a ocorrência em pelo menos 10 caracteres.')
    expect(erros.planeta?.[0]).toBe('Informe o planeta onde a ocorrência aconteceu.')
    expect(erros.setorId?.[0]).toBe('Escolha o setor da ocorrência.')
    expect(erros.gravidade?.[0]).toBe('Escolha a gravidade.')
    expect(erros.envolvidos?.[0]).toBe('Informe quantos seres estão envolvidos (mínimo 1).')
  })

  test('setorId é opcional: setor 0 é aceito e vazio vira ausente', () => {
    const comZero = novaOcorrenciaSchema.parse(valida)
    expect(comZero.setorId).toBe(0)
    const semSetor = novaOcorrenciaSchema.parse({ ...valida, setorId: '' })
    expect(semSetor.setorId).toBeUndefined()
  })

  test('texto no lugar de número tem mensagem própria', () => {
    const r = novaOcorrenciaSchema.safeParse({ ...valida, envolvidos: 'muitos' })
    expect(z.flattenError(r.error!).fieldErrors.envolvidos?.[0]).toBe('Informe um número.')
  })
})

describe('atualizarStatusSchema', () => {
  test('resolvida exige explicação e o erro aparece no campo resolucao', () => {
    const r = atualizarStatusSchema.safeParse({ status: 'resolvida', resolucao: '  ok ' })
    expect(r.success).toBe(false)
    expect(z.flattenError(r.error!).fieldErrors.resolucao?.[0]).toBe('Explique em pelo menos 10 caracteres como a ocorrência foi resolvida.')
  })

  test('outros status não exigem resolução', () => {
    expect(atualizarStatusSchema.safeParse({ status: 'em_andamento', resolucao: '' }).success).toBe(true)
  })
})

describe('filtros vindos da URL nunca quebram a página', () => {
  test('valor desconhecido vira "sem filtro"', () => {
    expect(filtroOcorrenciasSchema.parse({ status: 'xyz', gravidade: 'muito-alta', setor: 'abc' })).toEqual({ status: undefined, gravidade: undefined, setor: undefined })
    expect(filtroLanternasSchema.parse({ setor: '../etc' })).toEqual({ setor: undefined })
  })

  test('valor válido passa', () => {
    expect(filtroOcorrenciasSchema.parse({ status: 'aberta', gravidade: 'alta', setor: '2814' })).toEqual({ status: 'aberta', gravidade: 'alta', setor: 2814 })
    expect(filtroLanternasSchema.parse({ setor: '0' })).toEqual({ busca: undefined, status: undefined, setor: 0, ordenar: undefined, ordem: undefined, pagina: undefined })
  })
})

test('login e atribuição têm mensagens de correção', () => {
  const login = loginSchema.safeParse({ email: 'hal', senha: '' })
  const erros = z.flattenError(login.error!).fieldErrors
  expect(erros.email?.[0]).toBe('Informe um e-mail válido, como hal@oa.tropa.')
  expect(erros.senha?.[0]).toBe('Informe sua senha.')

  expect(atribuicaoSchema.safeParse({ responsavelId: '' }).success).toBe(true)
  expect(atribuicaoSchema.safeParse({ responsavelId: 'hal-jordan' }).success).toBe(true)
  expect(atribuicaoSchema.safeParse({ responsavelId: 'Slug Inválido!' }).success).toBe(false)
})

test('ApiError guarda o status HTTP', () => {
  const erro = new ApiError(404)
  expect(erro).toBeInstanceOf(Error)
  expect(erro.status).toBe(404)
  expect(erro.message).toBe('A API respondeu 404')
})
