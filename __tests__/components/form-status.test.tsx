import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/app/(painel)/painel/ocorrencias/actions', () => ({ atualizarStatus: vi.fn() }))

import { FormStatus } from '@/app/(painel)/painel/ocorrencias/_components/FormStatus'

test('campo de resolução aparece só quando o status é resolvida', () => {
  const { unmount } = render(<FormStatus ocorrenciaId="o3" statusAtual="resolvida" resolucaoAtual="Anéis apreendidos." />)
  expect(screen.getByLabelText('Como foi resolvida?')).toBeDefined()
  unmount()
  render(<FormStatus ocorrenciaId="o2" statusAtual="aberta" resolucaoAtual="" />)
  expect(screen.queryByLabelText('Como foi resolvida?')).toBeNull()
  expect(screen.getByText('Aberta')).toBeDefined()
})
