export function normalizarBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLocaleLowerCase('und')
}
