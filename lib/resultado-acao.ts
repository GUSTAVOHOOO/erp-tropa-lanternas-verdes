/** O que uma Server Action devolve quando não redireciona. [DEC-05] */
export type ResultadoAcao = {
  ok: boolean
  erro?: string // erro geral: vai para errors.root no formulário
  errors?: Record<string, string[] | undefined> // erros por campo (z.flattenError)
}

/** Mensagem para humanos quando a API não responde. O detalhe técnico vai só para o log. [API-13] */
export const MENSAGEM_ERRO_API =
  'Não foi possível falar com a Central de Oa. Verifique se a API está ligada e tente de novo.'
