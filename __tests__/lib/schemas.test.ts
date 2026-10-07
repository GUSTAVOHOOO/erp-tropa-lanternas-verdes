// @vitest-environment node
import * as z from 'zod'
import { describe, expect, test } from 'vitest'
import db from '@/db.json'
import { setorSchema } from '@/lib/schemas/setor'
import { lanternaSchema, filtroLanternasSchema } from '@/lib/schemas/lanterna'
import { usuarioSchema } from '@/lib/schemas/usuario'
import { loginSchema } from '@/lib/schemas/login'
import {
  atribuicaoSchema,
  atualizarStatusSchema,
  filtroOcorrenciasSchema,
  novaOcorrenciaSchema,
  ocorrenciaSchema,
} from '@/lib/schemas/ocorrencia'
import { ApiError } from '@/lib/api-error'

describe('db.json respeita o contrato (os schemas de resposta)', () => {
  test('todas as coleções passam no schema', () => {
    expect(() => z.array(setorSchema).parse(db.setores)).not.toThrow()
    expect(() => z.array(lanternaSchema).parse(db.lanternas)).not.toThrow()
    expect(() => z.array(usuarioSchema).parse(db.usuarios)).not.toThrow()
    expect(() => z.array(ocorrenciaSchema).parse(db.ocorrencias)).not.toThrow()
  })

  test('referências apontam para registros que existem', () => {
    const setores = new Set(db.setores.map((s) => s.id))
    const lanternas = new Set(db.lanternas.map((l) => l.id))
    const usuarios = new Set(db.usuarios.map((u) => u.id))
    for (const l of db.lanternas) expect(setores.has(l.setorId)).toBe(true)
    for (const o of db.ocorrencias) {
      expect(setores.has(o.setorId)).toBe(true)
      expect(usuarios.has(o.criadaPor)).toBe(true)
      if (o.responsavelId) expect(lanternas.has(o.responsavelId)).toBe(true)
    }
  })

  test('tem o que o roteiro de demonstração precisa', () => {
    expect(db.usuarios.map((u) => u.email)).toEqual(['ganthet@oa.tropa', 'hal@oa.tropa', 'kilowog@oa.tropa'])
    expect(db.lanternas.some((l) => l.setorId === '3601')).toBe(false) // estado vazio na área pública
    expect(db.ocorrencias.some((o) => o.setorId === '1417')).toBe(false) // estado vazio no painel
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
    const r = novaOcorrenciaSchema.safeParse({ titulo: 'abc', descricao: 'curta', planeta: 'x', setorId: '', gravidade: 'xyz', envolvidos: '0' })
    expect(r.success).toBe(false)
    const erros = z.flattenError(r.error!).fieldErrors
    expect(erros.titulo?.[0]).toBe('O título precisa ter pelo menos 5 caracteres.')
    expect(erros.descricao?.[0]).toBe('Descreva a ocorrência em pelo menos 10 caracteres.')
    expect(erros.planeta?.[0]).toBe('Informe o planeta onde a ocorrência aconteceu.')
    expect(erros.setorId?.[0]).toBe('Escolha o setor da ocorrência.')
    expect(erros.gravidade?.[0]).toBe('Escolha a gravidade.')
    expect(erros.envolvidos?.[0]).toBe('Informe quantos seres estão envolvidos (mínimo 1).')
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
    expect(filtroOcorrenciasSchema.parse({ status: 'xyz', setor: 'abc' })).toEqual({ status: undefined, setor: undefined })
    expect(filtroLanternasSchema.parse({ setor: '../etc' })).toEqual({ setor: undefined })
  })

  test('valor válido passa', () => {
    expect(filtroOcorrenciasSchema.parse({ status: 'aberta', setor: '2814' })).toEqual({ status: 'aberta', setor: '2814' })
    expect(filtroLanternasSchema.parse({ setor: '0' })).toEqual({ setor: '0' })
  })
})

test('login e atribuição têm mensagens de correção', () => {
  const login = loginSchema.safeParse({ email: 'hal', senha: '' })
  const erros = z.flattenError(login.error!).fieldErrors
  expect(erros.email?.[0]).toBe('Informe um e-mail válido, como hal@oa.tropa.')
  expect(erros.senha?.[0]).toBe('Informe sua senha.')
  const atribuicao = atribuicaoSchema.safeParse({ responsavelId: '' })
  expect(z.flattenError(atribuicao.error!).fieldErrors.responsavelId?.[0]).toBe('Escolha o lanterna responsável.')
})

test('ApiError guarda o status HTTP', () => {
  const erro = new ApiError(404)
  expect(erro).toBeInstanceOf(Error)
  expect(erro.status).toBe(404)
  expect(erro.message).toBe('A API respondeu 404')
})
