import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const VARIANTES = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const

test('toda variante de botão usa o anel no foco (CSS-14)', () => {
  for (const variant of VARIANTES) {
    expect(buttonVariants({ variant })).toContain('focus-visible:shadow-anel')
  }
})

test('botão desabilitado continua sendo um botão desabilitado', () => {
  render(<Button disabled>Salvar</Button>)
  expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true)
})

test('Input e Textarea usam o anel e marcam erro pela borda', () => {
  render(<><Input aria-label="Título" /><Textarea aria-label="Descrição" /></>)
  for (const campo of [screen.getByLabelText('Título'), screen.getByLabelText('Descrição')]) {
    expect(campo.className).toContain('focus-visible:shadow-anel')
    expect(campo.className).toContain('aria-invalid:border-destructive')
  }
})
