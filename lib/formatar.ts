/** Data e hora em português, no horário de Brasília (ex.: "01/10/2026, 09:00"). */
export function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
}
