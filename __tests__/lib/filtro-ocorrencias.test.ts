// @vitest-environment node
import { expect, test } from 'vitest'
import { normalizarFiltroOcorrencias, parametrosDoFiltro } from '@/lib/filtro-ocorrencias'

const setores = ['2814', '674']

test('servidor e navegador ignoram parâmetros repetidos igualmente', () => {
  const url = new URLSearchParams('status=aberta&status=resolvida&gravidade=alta&gravidade=critica&setor=2814&setor=674')
  expect(normalizarFiltroOcorrencias(parametrosDoFiltro(url), setores)).toEqual({ status: undefined, gravidade: undefined, setor: undefined })
  expect(normalizarFiltroOcorrencias({ status: ['aberta', 'resolvida'], gravidade: ['alta', 'critica'], setor: ['2814', '674'] }, setores)).toEqual({ status: undefined, gravidade: undefined, setor: undefined })
})

test('setor desconhecido e propriedades herdadas são descartados', () => {
  expect(normalizarFiltroOcorrencias({ status: 'toString', gravidade: '__proto__', setor: '9999' }, setores)).toEqual({ status: undefined, gravidade: undefined, setor: undefined })
})

test('valores válidos preservam os filtros', () => {
  expect(normalizarFiltroOcorrencias({ status: 'aberta', gravidade: 'alta', setor: '2814' }, setores)).toEqual({ status: 'aberta', gravidade: 'alta', setor: '2814' })
})
