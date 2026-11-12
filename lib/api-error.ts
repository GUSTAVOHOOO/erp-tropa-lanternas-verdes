import { MENSAGEM_ERRO_API, type ResultadoAcao } from '@/lib/resultado-acao'

/** Erro de campo devolvido pela API em `erro.detalhes` (400 DADOS_INVALIDOS). */
export type DetalheCampo = { campo: string; mensagens: string[] }

/** Códigos locais do cliente, que nunca vêm da API. */
export const FALHA_REDE = 'FALHA_REDE' // sem resposta HTTP (status 0)
export const RESPOSTA_INVALIDA = 'RESPOSTA_INVALIDA' // corpo ilegível ou fora do schema

/**
 * Erro HTTP vindo da API. Guarda status, código estável e detalhes de campo
 * para a tela escolher a saída (404, 401, 409...). A mensagem da API não é exibida. [API-03]
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo?: string,
    public detalhes: DetalheCampo[] = [],
  ) {
    super(`A API respondeu ${status}`)
    this.name = 'ApiError'
  }
}


export const MENSAGEM_DADOS_INVALIDOS = 'Confira os dados enviados.'
export const MENSAGEM_ERRO_GERAL = 'Não foi possível concluir a operação. Tente novamente.'

/**
 * Mensagens amigáveis em português para cada código de erro estável da API.
 * Mapeia os enums de Erro401, Erro403, Erro404, Erro409, Erro422 e Erro429 do OpenAPI. [API-18]
 */
export const MENSAGENS_CODIGO: Record<string, string> = {
  // 401
  NAO_AUTENTICADO: 'Sua sessão expirou. Faça login novamente.',
  CREDENCIAIS_INVALIDAS: 'E-mail ou senha incorretos.',

  // 403
  SEM_PERMISSAO: 'Você não tem permissão para realizar esta operação.',

  // 404
  NAO_ENCONTRADO: 'Registro não encontrado.',

  // 409
  EMAIL_JA_CADASTRADO: 'Este e-mail já está cadastrado.',
  SETOR_JA_CADASTRADO: 'Este setor já está cadastrado.',
  LANTERNA_JA_CADASTRADA: 'Este Lanterna já está cadastrado.',
  LANTERNA_JA_VINCULADA: 'Este Lanterna já está vinculado a outra conta.',
  CONTA_SEM_LANTERNA: 'Sua conta não possui uma ficha de Lanterna vinculada.',
  LANTERNA_AFASTADO: 'Este Lanterna está afastado e não pode receber ocorrências.',
  LANTERNA_EM_MISSAO: 'O Lanterna está em missão; o status só muda quando a missão terminar.',
  SETOR_EM_USO: 'Este setor possui vínculos ativos e não pode ser removido.',
  ULTIMO_GUARDIAO: 'Não é possível alterar o papel do último Guardião.',
  OCORRENCIA_RESOLVIDA: 'Esta ocorrência já foi resolvida e não pode ser alterada.',
  LANTERNA_EM_USO: 'O setor da ficha não pode mudar: há conta ou ocorrência ligada a ele.',

  // 422
  TRANSICAO_INVALIDA: 'Transição de status inválida para esta ocorrência.',
  SEM_RESPONSAVEL: 'Atribua um responsável antes de iniciar o atendimento.',
  RESOLUCAO_OBRIGATORIA: 'Informe a resolução da ocorrência com pelo menos 10 caracteres.',
  MOTIVO_OBRIGATORIO: 'Informe o motivo da reabertura com pelo menos 10 caracteres.',
  RESPONSAVEL_DE_OUTRO_SETOR: 'O responsável selecionado pertence a outro setor.',
  MENTOR_INVALIDO: 'O mentor selecionado é inválido ou formaria um ciclo.',
  SETOR_DIFERENTE: 'O setor informado é diferente do setor da ficha vinculada.',
  SETOR_OBRIGATORIO: 'É obrigatório informar um setor para o Lanterna.',
  VINCULO_NAO_PERMITIDO: 'Apenas contas de Lanterna podem ser vinculadas a uma ficha.',

  // 429
  MUITAS_TENTATIVAS: 'Muitas tentativas. Aguarde um momento e tente de novo.',

  // 400 / 500 auxiliares
  DADOS_INVALIDOS: MENSAGEM_DADOS_INVALIDOS,
  ERRO_INTERNO: 'Ocorreu um erro interno. Tente novamente mais tarde.',
}

export type DestinoErro =
  | 'formulario'
  | 'sessao-expirada'
  | 'acesso-negado'
  | 'nao-encontrado'
  | 'tentar-de-novo'

/**
 * Classifica a falha HTTP para definir a navegação ou tratamento na tela. [API-12]
 */
export function destinoDoErro(erro: unknown): DestinoErro {
  if (!(erro instanceof ApiError)) {
    return 'tentar-de-novo'
  }
  if (erro.status === 0 || erro.codigo === FALHA_REDE || erro.codigo === RESPOSTA_INVALIDA || erro.status >= 500) {
    return 'tentar-de-novo'
  }
  if (erro.status === 401) {
    return 'sessao-expirada'
  }
  if (erro.status === 403) {
    return 'acesso-negado'
  }
  if (erro.status === 404) {
    return 'nao-encontrado'
  }
  if (erro.status === 400 || erro.status === 409 || erro.status === 422 || erro.status === 429) {
    return 'formulario'
  }
  return 'tentar-de-novo'
}

/**
 * Converte erros da API em ResultadoAcao seguro para formulários e Server Actions. [API-13][API-18]
 * Nunca expõe erro.message nem mensagens brutas da API na tela.
 */
export function resultadoDeErroApi(erro: unknown): ResultadoAcao {
  if (!(erro instanceof ApiError)) {
    return { ok: false, erro: MENSAGEM_ERRO_API }
  }

  // Falha de rede (status 0), erro interno de servidor (5xx) ou corpo de resposta inválido
  if (erro.status === 0 || erro.codigo === FALHA_REDE || erro.codigo === RESPOSTA_INVALIDA || erro.status >= 500) {
    return { ok: false, erro: MENSAGEM_ERRO_API }
  }

  // 400 com ou sem detalhes de campo
  if (erro.status === 400) {
    if (erro.detalhes && erro.detalhes.length > 0) {
      const errors: Record<string, string[]> = {}
      for (const detalhe of erro.detalhes) {
        if (detalhe.campo && Array.isArray(detalhe.mensagens) && detalhe.mensagens.length > 0) {
          if (!errors[detalhe.campo]) {
            errors[detalhe.campo] = []
          }
          errors[detalhe.campo].push(...detalhe.mensagens)
        }
      }
      if (Object.keys(errors).length > 0) {
        return { ok: false, errors }
      }
    }
    return { ok: false, erro: MENSAGEM_DADOS_INVALIDOS }
  }

  // 409, 422, 429 (e também 401, 403, 404 se chamados em Action sem redirecionar)
  const mensagem = (erro.codigo ? MENSAGENS_CODIGO[erro.codigo] : undefined) ?? MENSAGEM_ERRO_GERAL
  return { ok: false, erro: mensagem }
}
