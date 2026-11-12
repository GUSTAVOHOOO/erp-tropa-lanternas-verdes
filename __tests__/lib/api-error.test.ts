// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  ApiError,
  destinoDoErro,
  FALHA_REDE,
  MENSAGEM_DADOS_INVALIDOS,
  MENSAGEM_ERRO_GERAL,
  MENSAGENS_CODIGO,
  RESPOSTA_INVALIDA,
  resultadoDeErroApi,
} from '@/lib/api-error'
import { MENSAGEM_ERRO_API } from '@/lib/resultado-acao'

describe('destinoDoErro', () => {
  test('status 401 encaminha para sessao-expirada', () => {
    expect(destinoDoErro(new ApiError(401, 'NAO_AUTENTICADO'))).toBe('sessao-expirada')
  })

  test('status 403 encaminha para acesso-negado', () => {
    expect(destinoDoErro(new ApiError(403, 'SEM_PERMISSAO'))).toBe('acesso-negado')
  })

  test('status 404 encaminha para nao-encontrado', () => {
    expect(destinoDoErro(new ApiError(404, 'NAO_ENCONTRADO'))).toBe('nao-encontrado')
  })

  test('status 400, 409, 422 e 429 encaminham para formulario', () => {
    expect(destinoDoErro(new ApiError(400, 'DADOS_INVALIDOS'))).toBe('formulario')
    expect(destinoDoErro(new ApiError(409, 'EMAIL_JA_CADASTRADO'))).toBe('formulario')
    expect(destinoDoErro(new ApiError(422, 'SEM_RESPONSAVEL'))).toBe('formulario')
    expect(destinoDoErro(new ApiError(429, 'MUITAS_TENTATIVAS'))).toBe('formulario')
  })

  test('status 0 (FALHA_REDE), 5xx, RESPOSTA_INVALIDA e erro comum encaminham para tentar-de-novo', () => {
    expect(destinoDoErro(new ApiError(0, FALHA_REDE))).toBe('tentar-de-novo')
    expect(destinoDoErro(new ApiError(500, 'ERRO_INTERNO'))).toBe('tentar-de-novo')
    expect(destinoDoErro(new ApiError(503))).toBe('tentar-de-novo')
    expect(destinoDoErro(new ApiError(200, RESPOSTA_INVALIDA))).toBe('tentar-de-novo')
    expect(destinoDoErro(new Error('falha inesperada'))).toBe('tentar-de-novo')
    expect(destinoDoErro('erro em string')).toBe('tentar-de-novo')
    expect(destinoDoErro(null)).toBe('tentar-de-novo')
    expect(destinoDoErro(undefined)).toBe('tentar-de-novo')
  })
})

describe('resultadoDeErroApi', () => {
  test('400 com detalhes junta vários detalhes do mesmo campo em errors', () => {
    const erro = new ApiError(400, 'DADOS_INVALIDOS', [
      { campo: 'email', mensagens: ['E-mail inválido.'] },
      { campo: 'email', mensagens: ['Formato incompatível.'] },
      { campo: 'setorId', mensagens: ['Setor inexistente.'] },
    ])
    const resultado = resultadoDeErroApi(erro)
    expect(resultado).toEqual({
      ok: false,
      errors: {
        email: ['E-mail inválido.', 'Formato incompatível.'],
        setorId: ['Setor inexistente.'],
      },
    })
  })

  test('400 sem detalhes devolve erro geral "Confira os dados enviados."', () => {
    const comListaVazia = new ApiError(400, 'DADOS_INVALIDOS', [])
    const semParametro = new ApiError(400)
    expect(resultadoDeErroApi(comListaVazia)).toEqual({
      ok: false,
      erro: MENSAGEM_DADOS_INVALIDOS,
    })
    expect(resultadoDeErroApi(semParametro)).toEqual({
      ok: false,
      erro: MENSAGEM_DADOS_INVALIDOS,
    })
  })

  test('409 com código conhecido devolve mensagem do dicionário', () => {
    const erro = new ApiError(409, 'EMAIL_JA_CADASTRADO')
    expect(resultadoDeErroApi(erro)).toEqual({
      ok: false,
      erro: MENSAGENS_CODIGO.EMAIL_JA_CADASTRADO,
    })
  })

  test('422 com código conhecido devolve mensagem do dicionário', () => {
    const erro = new ApiError(422, 'SEM_RESPONSAVEL')
    expect(resultadoDeErroApi(erro)).toEqual({
      ok: false,
      erro: 'Atribua um responsável antes de iniciar o atendimento.',
    })
  })

  test('código desconhecido em 4xx devolve mensagem geral segura sem expor erro técnico', () => {
    const erro409 = new ApiError(409, 'CODIGO_INEXISTENTE')
    const erro422 = new ApiError(422, 'OUTRO_CODIGO_DESCONHECIDO')
    const res409 = resultadoDeErroApi(erro409)
    const res422 = resultadoDeErroApi(erro422)

    expect(res409).toEqual({ ok: false, erro: MENSAGEM_ERRO_GERAL })
    expect(res422).toEqual({ ok: false, erro: MENSAGEM_ERRO_GERAL })
    expect(res409.erro).not.toContain('A API respondeu')
    expect(res422.erro).not.toContain('A API respondeu')
  })

  test('429 devolve mensagem de muitas tentativas', () => {
    const erro = new ApiError(429, 'MUITAS_TENTATIVAS')
    expect(resultadoDeErroApi(erro)).toEqual({
      ok: false,
      erro: 'Muitas tentativas. Aguarde um momento e tente de novo.',
    })
  })

  test('500, falha de rede, resposta inválida e erro desconhecido devolvem MENSAGEM_ERRO_API', () => {
    expect(resultadoDeErroApi(new ApiError(500, 'ERRO_INTERNO'))).toEqual({
      ok: false,
      erro: MENSAGEM_ERRO_API,
    })
    expect(resultadoDeErroApi(new ApiError(0, FALHA_REDE))).toEqual({
      ok: false,
      erro: MENSAGEM_ERRO_API,
    })
    expect(resultadoDeErroApi(new ApiError(200, RESPOSTA_INVALIDA))).toEqual({
      ok: false,
      erro: MENSAGEM_ERRO_API,
    })
    expect(resultadoDeErroApi(new Error('falha de conexão'))).toEqual({
      ok: false,
      erro: MENSAGEM_ERRO_API,
    })
    expect(resultadoDeErroApi(null)).toEqual({
      ok: false,
      erro: MENSAGEM_ERRO_API,
    })
  })

  test('401, 403 e 404 também devolvem erro geral seguro', () => {
    expect(resultadoDeErroApi(new ApiError(401, 'CREDENCIAIS_INVALIDAS'))).toEqual({
      ok: false,
      erro: 'E-mail ou senha incorretos.',
    })
    expect(resultadoDeErroApi(new ApiError(403, 'SEM_PERMISSAO'))).toEqual({
      ok: false,
      erro: 'Você não tem permissão para realizar esta operação.',
    })
    expect(resultadoDeErroApi(new ApiError(404, 'NAO_ENCONTRADO'))).toEqual({
      ok: false,
      erro: 'Registro não encontrado.',
    })
    expect(resultadoDeErroApi(new ApiError(404, 'CODIGO_DESCONHECIDO'))).toEqual({
      ok: false,
      erro: MENSAGEM_ERRO_GERAL,
    })
  })
})

describe('contrato: openapi.json vs MENSAGENS_CODIGO', () => {
  test('todo código dos enums de Erro401, Erro403, Erro404, Erro409, Erro422 e Erro429 possui entrada em MENSAGENS_CODIGO', () => {
    const openapiPath = path.resolve(process.cwd(), 'docs/contratos/openapi.json')
    const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'))
    const schemas = openapi.components.schemas

    const statusList = ['Erro401', 'Erro403', 'Erro404', 'Erro409', 'Erro422', 'Erro429'] as const

    for (const schemaName of statusList) {
      const codigos: string[] = schemas[schemaName]?.properties?.erro?.properties?.codigo?.enum ?? []
      expect(codigos.length).toBeGreaterThan(0)
      for (const codigo of codigos) {
        const mensagem = MENSAGENS_CODIGO[codigo]
        expect(
          mensagem,
          `Código ${codigo} do schema ${schemaName} deve estar presente em MENSAGENS_CODIGO`,
        ).toBeDefined()
        expect(typeof mensagem).toBe('string')
        expect(mensagem.trim().length).toBeGreaterThan(0)
      }
    }
  })
})
