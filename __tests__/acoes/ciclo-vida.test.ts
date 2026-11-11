// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError } from '@/lib/api-error'
import { exigirPapel, verificarSessao } from '@/lib/dal'
import {
  alterarStatusOcorrencia,
  buscarOcorrencia,
  definirResponsavel,
  editarOcorrencia as persistirEdicao,
  excluirOcorrencia as persistirExclusao,
} from '@/lib/ocorrencias'
import type { Ocorrencia } from '@/lib/schemas/ocorrencia'
import type { Sessao } from '@/lib/schemas/usuario'
import {
  atribuirResponsavel,
  atualizarStatus,
  editarOcorrencia,
  excluirOcorrencia,
} from '@/app/(painel)/painel/ocorrencias/actions'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/dal', () => ({
  verificarSessao: vi.fn(),
  exigirPapel: vi.fn(),
}))

vi.mock('@/lib/ocorrencias', () => ({
  alterarStatusOcorrencia: vi.fn(),
  buscarOcorrencia: vi.fn(),
  definirResponsavel: vi.fn(),
  editarOcorrencia: vi.fn(),
  excluirOcorrencia: vi.fn(),
}))

const hal: Sessao = {
  id: '00000000-0000-4000-8000-000000000002',
  nome: 'Hal Jordan',
  email: 'hal@oa.tropa',
  papel: 'lanterna',
  setorId: 2814,
  lanternaId: 'hal-jordan',
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const john: Sessao = {
  id: '00000000-0000-4000-8000-000000000003',
  nome: 'John Stewart',
  email: 'john@oa.tropa',
  papel: 'lanterna',
  setorId: 2814,
  lanternaId: 'john-stewart',
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const ganthet: Sessao = {
  id: '00000000-0000-4000-8000-000000000001',
  nome: 'Ganthet',
  email: 'ganthet@oa.tropa',
  papel: 'guardiao',
  setorId: null,
  lanternaId: null,
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const ocorrenciaAberta: Ocorrencia = {
  id: '00000000-0000-4000-8000-000000000101',
  titulo: 'Invasão em Oa',
  descricao: 'Muitos invasores na Bateria Central de Oa.',
  planeta: 'Oa',
  setorId: 2814,
  gravidade: 'alta',
  status: 'aberta',
  envolvidos: 2,
  responsavelId: 'hal-jordan',
  resolucao: null,
  criadaPorId: '00000000-0000-4000-8000-000000000002',
  criadaEm: '2026-01-01T00:00:00.000Z',
  resolvidaEm: null,
  prazoEm: '2026-01-03T00:00:00.000Z',
  vencida: false,
}

const ocorrenciaEmAndamento: Ocorrencia = {
  ...ocorrenciaAberta,
  status: 'em_andamento',
}

const ocorrenciaResolvida: Ocorrencia = {
  ...ocorrenciaAberta,
  status: 'resolvida',
  resolucao: 'Invasores contidos na Bateria Central.',
  resolvidaEm: '2026-01-02T00:00:00.000Z',
}

const ocorrenciaOutroSetor: Ocorrencia = {
  ...ocorrenciaAberta,
  id: '00000000-0000-4000-8000-000000000102',
  setorId: 674,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaAberta)
  vi.mocked(alterarStatusOcorrencia).mockResolvedValue(ocorrenciaEmAndamento)
  vi.mocked(definirResponsavel).mockResolvedValue(ocorrenciaAberta)
  vi.mocked(persistirEdicao).mockResolvedValue(ocorrenciaAberta)
  vi.mocked(persistirExclusao).mockResolvedValue(undefined)
})

describe('atualizarStatus', () => {
  test('sessão conferida antes do parse: se rejeitar, não chama alterarStatusOcorrencia', async () => {
    vi.mocked(verificarSessao).mockRejectedValue(new Error('NEXT_REDIRECT /login'))
    await expect(atualizarStatus(ocorrenciaAberta.id, { status: 'em_andamento' })).rejects.toThrow(
      'NEXT_REDIRECT /login',
    )
    expect(alterarStatusOcorrencia).not.toHaveBeenCalled()
  })

  test('Lanterna de outro setor: devolve erro de permissão sem alterar status', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaOutroSetor)
    const resultado = await atualizarStatus(ocorrenciaOutroSetor.id, { status: 'em_andamento' })
    expect(resultado).toEqual({ ok: false, erro: 'Você não tem permissão para esta alteração.' })
    expect(alterarStatusOcorrencia).not.toHaveBeenCalled()
  })

  test('Lanterna tentando abrir ocorrência já resolvida: transição proibida sem alterar status', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaResolvida)
    const resultado = await atualizarStatus(ocorrenciaResolvida.id, {
      statusAtual: 'resolvida',
      status: 'aberta',
      motivo: 'Motivo com tamanho suficiente para o schema.',
    })
    expect(resultado).toEqual({ ok: false, erro: 'Você não tem permissão para esta alteração.' })
    expect(alterarStatusOcorrencia).not.toHaveBeenCalled()
  })

  test('iniciar (aberta -> em_andamento): chama alterarStatusOcorrencia sem resolucao nem motivo', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaAberta)
    const resultado = await atualizarStatus(ocorrenciaAberta.id, {
      status: 'em_andamento',
      resolucao: 'Texto irrelevante para este status',
      motivo: 'Motivo irrelevante para este status',
    })
    expect(resultado).toEqual({ ok: true })
    expect(alterarStatusOcorrencia).toHaveBeenCalledWith(ocorrenciaAberta.id, {
      status: 'em_andamento',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
  })

  test('resolver (-> resolvida): envia status resolvida e resolucao', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaEmAndamento)
    const resultado = await atualizarStatus(ocorrenciaEmAndamento.id, {
      status: 'resolvida',
      resolucao: 'Conflito encerrado com intervenção da Tropa.',
    })
    expect(resultado).toEqual({ ok: true })
    expect(alterarStatusOcorrencia).toHaveBeenCalledWith(ocorrenciaEmAndamento.id, {
      status: 'resolvida',
      resolucao: 'Conflito encerrado com intervenção da Tropa.',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
  })

  test('reabrir (resolvida -> aberta, Guardião): envia status aberta e motivo', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaResolvida)
    const resultado = await atualizarStatus(ocorrenciaResolvida.id, {
      statusAtual: 'resolvida',
      status: 'aberta',
      motivo: 'Novos distúrbios foram detectados no local.',
    })
    expect(resultado).toEqual({ ok: true })
    expect(alterarStatusOcorrencia).toHaveBeenCalledWith(ocorrenciaResolvida.id, {
      status: 'aberta',
      motivo: 'Novos distúrbios foram detectados no local.',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
  })

  test('reabrir com motivo curto: erro no campo motivo pelo schema sem chamar alterarStatusOcorrencia', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    const resultado = await atualizarStatus(ocorrenciaResolvida.id, {
      statusAtual: 'resolvida',
      status: 'aberta',
      motivo: 'curto',
    })
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.errors?.motivo?.[0]).toBe('Informe em pelo menos 10 caracteres o motivo da reabertura.')
    }
    expect(alterarStatusOcorrencia).not.toHaveBeenCalled()
  })

  test('ApiError 422 RESOLUCAO_OBRIGATORIA vira erro no campo resolucao', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaEmAndamento)
    vi.mocked(alterarStatusOcorrencia).mockRejectedValue(new ApiError(422, 'RESOLUCAO_OBRIGATORIA'))
    const resultado = await atualizarStatus(ocorrenciaEmAndamento.id, {
      status: 'resolvida',
      resolucao: 'Resolucao valida no cliente',
    })
    expect(resultado).toEqual({
      ok: false,
      errors: {
        resolucao: ['Informe a resolução da ocorrência com pelo menos 10 caracteres.'],
      },
    })
  })

  test('ApiError 422 SEM_RESPONSAVEL vira erro no campo responsavelId', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaAberta)
    vi.mocked(alterarStatusOcorrencia).mockRejectedValue(new ApiError(422, 'SEM_RESPONSAVEL'))
    const resultado = await atualizarStatus(ocorrenciaAberta.id, {
      status: 'em_andamento',
    })
    expect(resultado).toEqual({
      ok: false,
      errors: {
        responsavelId: ['Atribua um responsável antes de iniciar o atendimento.'],
      },
    })
  })

  test('ApiError 404 vira erro geral "Esta ocorrência não existe mais."', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(buscarOcorrencia).mockRejectedValue(new ApiError(404, 'NAO_ENCONTRADO'))
    const resultado = await atualizarStatus(ocorrenciaAberta.id, { status: 'em_andamento' })
    expect(resultado).toEqual({ ok: false, erro: 'Esta ocorrência não existe mais.' })
  })

  test('sucesso: revalidatePath e { ok: true }', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaAberta)
    const resultado = await atualizarStatus(ocorrenciaAberta.id, { status: 'em_andamento' })
    expect(resultado).toEqual({ ok: true })
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
  })
})

describe('atribuirResponsavel', () => {
  test('exigirPapel("guardiao") barra outros papéis sem tocar na persistência', async () => {
    vi.mocked(exigirPapel).mockRejectedValue(new Error('NEXT_REDIRECT /acesso-negado'))
    await expect(atribuirResponsavel(ocorrenciaAberta.id, { responsavelId: 'hal-jordan' })).rejects.toThrow(
      'NEXT_REDIRECT /acesso-negado',
    )
    expect(exigirPapel).toHaveBeenCalledWith('guardiao')
    expect(definirResponsavel).not.toHaveBeenCalled()
  })

  test('responsavelId vazio ("") vira null ao chamar definirResponsavel', async () => {
    vi.mocked(exigirPapel).mockResolvedValue(ganthet)
    await expect(atribuirResponsavel(ocorrenciaAberta.id, { responsavelId: '' })).rejects.toThrow(
      `NEXT_REDIRECT /painel/ocorrencias/${ocorrenciaAberta.id}`,
    )
    expect(definirResponsavel).toHaveBeenCalledWith(ocorrenciaAberta.id, null)
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
    expect(redirect).toHaveBeenCalledWith(`/painel/ocorrencias/${ocorrenciaAberta.id}`)
  })

  test('responsavelId com slug válido chama definirResponsavel com o slug', async () => {
    vi.mocked(exigirPapel).mockResolvedValue(ganthet)
    await expect(atribuirResponsavel(ocorrenciaAberta.id, { responsavelId: 'john-stewart' })).rejects.toThrow(
      `NEXT_REDIRECT /painel/ocorrencias/${ocorrenciaAberta.id}`,
    )
    expect(definirResponsavel).toHaveBeenCalledWith(ocorrenciaAberta.id, 'john-stewart')
  })

  test('ApiError 422 SEM_RESPONSAVEL vira erro no campo responsavelId sem redirecionar', async () => {
    vi.mocked(exigirPapel).mockResolvedValue(ganthet)
    vi.mocked(definirResponsavel).mockRejectedValue(new ApiError(422, 'SEM_RESPONSAVEL'))
    const resultado = await atribuirResponsavel(ocorrenciaAberta.id, { responsavelId: 'hal-jordan' })
    expect(resultado).toEqual({
      ok: false,
      errors: {
        responsavelId: ['Atribua um responsável antes de iniciar o atendimento.'],
      },
    })
    expect(redirect).not.toHaveBeenCalled()
  })

  test('ApiError 409 LANTERNA_AFASTADO vira erro no campo responsavelId sem redirecionar', async () => {
    vi.mocked(exigirPapel).mockResolvedValue(ganthet)
    vi.mocked(definirResponsavel).mockRejectedValue(new ApiError(409, 'LANTERNA_AFASTADO'))
    const resultado = await atribuirResponsavel(ocorrenciaAberta.id, { responsavelId: 'hal-jordan' })
    expect(resultado).toEqual({
      ok: false,
      errors: {
        responsavelId: ['Este Lanterna está afastado e não pode receber ocorrências.'],
      },
    })
    expect(redirect).not.toHaveBeenCalled()
  })

  test('sucesso: revalidatePath e redirect para o detalhe', async () => {
    vi.mocked(exigirPapel).mockResolvedValue(ganthet)
    await expect(atribuirResponsavel(ocorrenciaAberta.id, { responsavelId: 'hal-jordan' })).rejects.toThrow(
      `NEXT_REDIRECT /painel/ocorrencias/${ocorrenciaAberta.id}`,
    )
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
    expect(redirect).toHaveBeenCalledWith(`/painel/ocorrencias/${ocorrenciaAberta.id}`)
  })
})

describe('editarOcorrencia', () => {
  test('Lanterna que não é o criador: erro de permissão sem chamar persistirEdicao', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(john)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaAberta)
    const resultado = await editarOcorrencia(ocorrenciaAberta.id, {
      titulo: 'Título alterado',
      descricao: ocorrenciaAberta.descricao,
      planeta: ocorrenciaAberta.planeta,
      gravidade: ocorrenciaAberta.gravidade,
      envolvidos: ocorrenciaAberta.envolvidos,
    })
    expect(resultado).toEqual({ ok: false, erro: 'Você não tem permissão para esta alteração.' })
    expect(persistirEdicao).not.toHaveBeenCalled()
  })

  test('Guardião altera apenas campos modificados: persistirEdicao recebe apenas o delta', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaAberta)
    await expect(
      editarOcorrencia(ocorrenciaAberta.id, {
        titulo: 'Invasão Crítica em Oa',
        descricao: ocorrenciaAberta.descricao,
        planeta: ocorrenciaAberta.planeta,
        gravidade: 'critica',
        envolvidos: ocorrenciaAberta.envolvidos,
      }),
    ).rejects.toThrow(`NEXT_REDIRECT /painel/ocorrencias/${ocorrenciaAberta.id}`)
    expect(persistirEdicao).toHaveBeenCalledWith(ocorrenciaAberta.id, {
      titulo: 'Invasão Crítica em Oa',
      gravidade: 'critica',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
    expect(redirect).toHaveBeenCalledWith(`/painel/ocorrencias/${ocorrenciaAberta.id}`)
  })

  test('submeter sem nenhuma alteração: erro "Nada foi alterado."', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaAberta)
    const resultado = await editarOcorrencia(ocorrenciaAberta.id, {
      titulo: ocorrenciaAberta.titulo,
      descricao: ocorrenciaAberta.descricao,
      planeta: ocorrenciaAberta.planeta,
      gravidade: ocorrenciaAberta.gravidade,
      envolvidos: ocorrenciaAberta.envolvidos,
    })
    expect(resultado).toEqual({ ok: false, erro: 'Nada foi alterado.' })
    expect(persistirEdicao).not.toHaveBeenCalled()
  })

  test('ocorrência resolvida não pode ser editada (acoes.editar falso)', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaResolvida)
    const resultado = await editarOcorrencia(ocorrenciaResolvida.id, {
      titulo: 'Tentativa de editar resolvida',
      descricao: ocorrenciaResolvida.descricao,
      planeta: ocorrenciaResolvida.planeta,
      gravidade: ocorrenciaResolvida.gravidade,
      envolvidos: ocorrenciaResolvida.envolvidos,
    })
    expect(resultado).toEqual({ ok: false, erro: 'Você não tem permissão para esta alteração.' })
    expect(persistirEdicao).not.toHaveBeenCalled()
  })

  test('ApiError 409 OCORRENCIA_RESOLVIDA mapeado para erro amigável', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaAberta)
    vi.mocked(persistirEdicao).mockRejectedValue(new ApiError(409, 'OCORRENCIA_RESOLVIDA'))
    const resultado = await editarOcorrencia(ocorrenciaAberta.id, {
      titulo: 'Título com alteração',
      descricao: ocorrenciaAberta.descricao,
      planeta: ocorrenciaAberta.planeta,
      gravidade: ocorrenciaAberta.gravidade,
      envolvidos: ocorrenciaAberta.envolvidos,
    })
    expect(resultado).toEqual({
      ok: false,
      erro: 'Esta ocorrência já foi resolvida e não pode ser alterada.',
    })
  })
})

describe('excluirOcorrencia', () => {
  test('só Guardião: exigirPapel barra outros papéis', async () => {
    vi.mocked(exigirPapel).mockRejectedValue(new Error('NEXT_REDIRECT /acesso-negado'))
    await expect(excluirOcorrencia(ocorrenciaAberta.id)).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
    expect(exigirPapel).toHaveBeenCalledWith('guardiao')
    expect(persistirExclusao).not.toHaveBeenCalled()
  })

  test('id inválido ou ocorrência inexistente (404): erro tratado sem redirect', async () => {
    vi.mocked(exigirPapel).mockResolvedValue(ganthet)
    const resIdInvalido = await excluirOcorrencia(123)
    expect(resIdInvalido).toEqual({ ok: false, erro: 'Esta ocorrência não existe mais.' })
    expect(persistirExclusao).not.toHaveBeenCalled()

    vi.mocked(persistirExclusao).mockRejectedValue(new ApiError(404, 'NAO_ENCONTRADO'))
    const res404 = await excluirOcorrencia('00000000-0000-4000-8000-000000000999')
    expect(res404).toEqual({ ok: false, erro: 'Esta ocorrência não existe mais.' })
    expect(redirect).not.toHaveBeenCalled()
  })

  test('sucesso: chama persistirExclusao, revalidatePath e redirect para /painel/ocorrencias', async () => {
    vi.mocked(exigirPapel).mockResolvedValue(ganthet)
    await expect(excluirOcorrencia(ocorrenciaAberta.id)).rejects.toThrow(
      'NEXT_REDIRECT /painel/ocorrencias',
    )
    expect(persistirExclusao).toHaveBeenCalledWith(ocorrenciaAberta.id)
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
    expect(redirect).toHaveBeenCalledWith('/painel/ocorrencias')
  })
})
