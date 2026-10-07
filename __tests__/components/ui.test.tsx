import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

test('gatilho do select usa o anel e marca erro pela borda', () => {
  render(
    <Select items={{ baixa: 'Baixa' }}>
      <SelectTrigger aria-label="Gravidade"><SelectValue placeholder="Escolha" /></SelectTrigger>
    </Select>,
  )
  const gatilho = screen.getByRole('combobox', { name: 'Gravidade' }) // sem <Label>, o Base UI expõe o gatilho como combobox
  expect(gatilho.className).toContain('focus-visible:shadow-anel')
  expect(gatilho.className).toContain('aria-invalid:border-destructive')
})

test('cabeçalho da tabela usa o texto terciário e números alinhados', () => {
  render(
    <Table>
      <TableHeader><TableRow><TableHead>Setor</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableCell>2814</TableCell></TableRow></TableBody>
    </Table>,
  )
  expect(screen.getByRole('columnheader', { name: 'Setor' }).className).toContain('text-texto-terciario')
  expect(screen.getByRole('table').className).toContain('tabular-nums')
})
