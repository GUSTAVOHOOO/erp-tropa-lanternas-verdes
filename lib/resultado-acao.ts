/** O que uma Server Action devolve quando não redireciona. */
export type ResultadoAcao = { // [DEC-05]
  ok: boolean
  erro?: string // erro geral: vai para errors.root no formulário
  errors?: Record<string, string[] | undefined> // erros por campo (z.flattenError)
}

/** Mensagem para humanos quando a API não responde. O detalhe técnico vai só para o log. */
export const MENSAGEM_ERRO_API = // [API-13]
  'Não foi possível falar com a Central de Oa. Verifique se a API está ligada e tente de novo.'
