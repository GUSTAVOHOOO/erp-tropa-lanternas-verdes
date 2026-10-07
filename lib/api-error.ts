/** Erro HTTP vindo da API. Guarda o status para a tela escolher a saída (404, 401, 500...). [API-03] */
export class ApiError extends Error {
  constructor(public status: number) {
    super(`A API respondeu ${status}`)
    this.name = 'ApiError'
  }
}
