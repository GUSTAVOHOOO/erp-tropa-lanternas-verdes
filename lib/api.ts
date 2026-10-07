/** Monta a URL completa da API a partir do API_URL do .env.local. Filtros vazios são ignorados. */
export function urlDaApi(caminho: string, filtros: Record<string, string | undefined> = {}): URL {
  const base = process.env.API_URL
  if (!base) throw new Error('API_URL não definido no .env.local')
  const url = new URL(caminho, base) // [API-16]
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor) url.searchParams.set(chave, valor)
  }
  return url
}
