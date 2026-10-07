/** Erro HTTP vindo da API. Guarda o status para a tela escolher a saída (404, 401, 500...). */
export class ApiError extends Error { // [API-03]
  constructor(public status: number) {
    super(`A API respondeu ${status}`)
    this.name = 'ApiError'
  }
}
