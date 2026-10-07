import { expect, test } from 'vitest'
import { formatarData } from '@/lib/formatar'

test('data em português, no horário de Brasília', () => {
  const texto = formatarData('2026-10-01T12:00:00.000Z')
  expect(texto).toContain('01/10/2026')
  expect(texto).toContain('09:00')
})
