import { filtroOcorrenciasSchema } from '@/lib/schemas/ocorrencia'

type Parametros = Partial<Record<'status' | 'gravidade' | 'setor', unknown>>

/** Mantém parâmetros repetidos como array, do mesmo jeito que searchParams no servidor. */
export function parametrosDoFiltro(params: URLSearchParams): Parametros {
  const valor = (chave: 'status' | 'gravidade' | 'setor') => {
    const todos = params.getAll(chave)
    return todos.length > 1 ? todos : todos[0]
  }
  return { status: valor('status'), gravidade: valor('gravidade'), setor: valor('setor') }
}

/** Mesmo filtro efetivo na consulta e nos controles; setor desconhecido é ignorado. */
export function normalizarFiltroOcorrencias(parametros: Parametros, setores: readonly string[]) {
  const filtro = filtroOcorrenciasSchema.parse(parametros) // [ROTA-11]
  return { ...filtro, setor: filtro.setor && setores.includes(filtro.setor) ? filtro.setor : undefined }
}
