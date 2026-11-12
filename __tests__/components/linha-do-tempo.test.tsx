import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { LinhaDoTempo } from '@/app/(painel)/painel/ocorrencias/_components/LinhaDoTempo'
import type { Evento } from '@/lib/schemas/evento'

const autorGuardiao = {
  id: '00000000-0000-4000-8000-000000000001',
  nome: 'Ganthet',
  papel: 'guardiao' as const,
}

const autorLanterna = {
  id: '00000000-0000-4000-8000-000000000002',
  nome: 'Hal Jordan',
  papel: 'lanterna' as const,
}

const nomeLanterna: Record<string, string> = {
  'hal-jordan': 'Hal Jordan',
  'john-stewart': 'John Stewart',
}

describe('LinhaDoTempo', () => {
  test('vazio renderiza texto "Nenhum evento registrado."', () => {
    render(<LinhaDoTempo eventos={[]} nomeLanterna={nomeLanterna} />)
    expect(screen.getByText('Nenhum evento registrado.')).toBeDefined()
  })

  test('preserva a ordem dos eventos na lista ordenada', () => {
    const eventos: Evento[] = [
      {
        id: '00000000-0000-4000-8000-000000000101',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorGuardiao.id,
        autor: autorGuardiao,
        criadoEm: '2026-11-10T10:00:00.000Z',
        tipo: 'criada',
        dados: { de: null, para: 'aberta' },
      },
      {
        id: '00000000-0000-4000-8000-000000000102',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorLanterna.id,
        autor: autorLanterna,
        criadoEm: '2026-11-10T11:00:00.000Z',
        tipo: 'status_alterado',
        dados: { de: 'aberta', para: 'em_andamento' },
      },
    ]

    render(<LinhaDoTempo eventos={eventos} nomeLanterna={nomeLanterna} />)
    const ol = screen.getByRole('list')
    const itens = within(ol).getAllByRole('listitem')
    expect(itens).toHaveLength(2)
    expect(within(itens[0]).getByText('registrou a ocorrência')).toBeDefined()
    expect(within(itens[1]).getByText('iniciou o atendimento')).toBeDefined()
  })

  test('renderiza autor (nome e papel) e data formatada', () => {
    const eventos: Evento[] = [
      {
        id: '00000000-0000-4000-8000-000000000101',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorGuardiao.id,
        autor: autorGuardiao,
        criadoEm: '2026-11-10T10:00:00.000Z',
        tipo: 'criada',
        dados: { de: null, para: 'aberta' },
      },
    ]

    render(<LinhaDoTempo eventos={eventos} nomeLanterna={nomeLanterna} />)
    expect(screen.getByText(/Ganthet/)).toBeDefined()
    expect(screen.getByText(/Guardião/)).toBeDefined()
    expect(screen.getByText(/10\/11\/2026/)).toBeDefined()
  })

  test('tipo atribuida: cobre atribuição, liberação e troca de responsável com codinome e fallback', () => {
    const eventos: Evento[] = [
      {
        id: '00000000-0000-4000-8000-000000000102',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorGuardiao.id,
        autor: autorGuardiao,
        criadoEm: '2026-11-10T10:10:00.000Z',
        tipo: 'atribuida',
        dados: { de: null, para: 'hal-jordan' },
      },
      {
        id: '00000000-0000-4000-8000-000000000103',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorGuardiao.id,
        autor: autorGuardiao,
        criadoEm: '2026-11-10T10:20:00.000Z',
        tipo: 'atribuida',
        dados: { de: 'hal-jordan', para: 'john-stewart' },
      },
      {
        id: '00000000-0000-4000-8000-000000000104',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorGuardiao.id,
        autor: autorGuardiao,
        criadoEm: '2026-11-10T10:30:00.000Z',
        tipo: 'atribuida',
        dados: { de: 'john-stewart', para: null },
      },
      {
        id: '00000000-0000-4000-8000-000000000105',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorGuardiao.id,
        autor: autorGuardiao,
        criadoEm: '2026-11-10T10:40:00.000Z',
        tipo: 'atribuida',
        dados: { de: null, para: 'slug-desconhecido' },
      },
    ]

    render(<LinhaDoTempo eventos={eventos} nomeLanterna={nomeLanterna} />)
    expect(screen.getByText('atribuiu a Hal Jordan')).toBeDefined()
    expect(screen.getByText('trocou o responsável de Hal Jordan para John Stewart')).toBeDefined()
    expect(screen.getByText('liberou o responsável John Stewart')).toBeDefined()
    expect(screen.getByText('atribuiu a slug-desconhecido')).toBeDefined()
  })

  test('tipo resolvida: exibe "resolveu" e a explicação da resolução', () => {
    const eventos: Evento[] = [
      {
        id: '00000000-0000-4000-8000-000000000106',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorLanterna.id,
        autor: autorLanterna,
        criadoEm: '2026-11-10T12:00:00.000Z',
        tipo: 'resolvida',
        dados: {
          de: 'em_andamento',
          para: 'resolvida',
          resolucao: 'Distorção espacial contida pela patrulha do setor.',
        },
      },
    ]

    render(<LinhaDoTempo eventos={eventos} nomeLanterna={nomeLanterna} />)
    expect(screen.getByText('resolveu')).toBeDefined()
    expect(screen.getByText('Distorção espacial contida pela patrulha do setor.')).toBeDefined()
  })

  test('tipo reaberta: exibe "reabriu", motivo e nota de responsável liberado quando responsavelId é nulo', () => {
    const eventos: Evento[] = [
      {
        id: '00000000-0000-4000-8000-000000000107',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorGuardiao.id,
        autor: autorGuardiao,
        criadoEm: '2026-11-10T14:00:00.000Z',
        tipo: 'reaberta',
        dados: {
          de: 'resolvida',
          para: 'aberta',
          motivo: 'Nova instabilidade detectada após encerramento.',
          responsavelAnteriorId: 'hal-jordan',
          responsavelId: null,
        },
      },
      {
        id: '00000000-0000-4000-8000-000000000108',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorGuardiao.id,
        autor: autorGuardiao,
        criadoEm: '2026-11-10T15:00:00.000Z',
        tipo: 'reaberta',
        dados: {
          de: 'resolvida',
          para: 'aberta',
          motivo: 'Manutenção adicional solicitada.',
          responsavelAnteriorId: 'hal-jordan',
          responsavelId: 'hal-jordan',
        },
      },
    ]

    render(<LinhaDoTempo eventos={eventos} nomeLanterna={nomeLanterna} />)
    expect(screen.getAllByText('reabriu')).toHaveLength(2)
    expect(screen.getByText('Nova instabilidade detectada após encerramento.')).toBeDefined()
    expect(screen.getByText('responsável Hal Jordan liberado')).toBeDefined()
    expect(screen.getByText('Manutenção adicional solicitada.')).toBeDefined()
  })

  test('tipo comentario_apagado: exibe "apagou um comentário"', () => {
    const eventos: Evento[] = [
      {
        id: '00000000-0000-4000-8000-000000000109',
        ocorrenciaId: '00000000-0000-4000-8000-000000000010',
        autorId: autorGuardiao.id,
        autor: autorGuardiao,
        criadoEm: '2026-11-10T16:00:00.000Z',
        tipo: 'comentario_apagado',
        dados: { comentarioId: '00000000-0000-4000-8000-000000000201' },
      },
    ]

    render(<LinhaDoTempo eventos={eventos} nomeLanterna={nomeLanterna} />)
    expect(screen.getByText('apagou um comentário')).toBeDefined()
  })
})
