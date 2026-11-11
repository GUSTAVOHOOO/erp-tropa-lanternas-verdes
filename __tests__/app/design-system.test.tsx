import { expect, test, vi } from 'vitest'

const redirectMock = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import DesignSystemPage from '@/app/(site)/design-system/page'

test('redireciona para o laboratório visual oficial OANET (D28)', () => {
  DesignSystemPage()
  expect(redirectMock).toHaveBeenCalledWith('/laboratorio')
})
