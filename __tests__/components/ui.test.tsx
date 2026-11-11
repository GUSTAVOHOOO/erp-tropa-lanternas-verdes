import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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

// UI-02.00: as primitivas carregam as classes OANET de app/globals.css; foco e erro vêm de
// .oa-input:focus-visible e .oa-input[aria-invalid=true] (conferidos no navegador, o jsdom não aplica CSS).
test('Input e Textarea são campos OANET e repassam atributos e classe extra', () => {
  render(<><Input aria-label="Título" aria-invalid className="extra" disabled /><Textarea aria-label="Descrição" /></>)
  const input = screen.getByLabelText('Título')
  expect(input.classList.contains('oa-input')).toBe(true)
  expect(input.classList.contains('extra')).toBe(true)
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(input.hasAttribute('disabled')).toBe(true)
  const area = screen.getByLabelText('Descrição')
  expect(area.classList.contains('oa-input')).toBe(true)
  expect(area.classList.contains('oa-textarea')).toBe(true)
})

test('Label continua sendo um label ligado ao campo', () => {
  render(<><Label htmlFor="planeta">Planeta</Label><Input id="planeta" /></>)
  expect(screen.getByLabelText('Planeta').id).toBe('planeta')
})

test('gatilho do select é um seletor OANET', () => {
  render(
    <Select items={{ baixa: 'Baixa' }}>
      <SelectTrigger aria-label="Gravidade"><SelectValue placeholder="Escolha" /></SelectTrigger>
    </Select>,
  )
  const gatilho = screen.getByRole('combobox', { name: 'Gravidade' }) // sem <Label>, o Base UI expõe o gatilho como combobox
  expect(gatilho.classList.contains('oa-select')).toBe(true)
  expect(gatilho.textContent).toContain('Escolha')
})

test('tabela OANET rola na horizontal e mantém números alinhados', () => {
  render(
    <Table>
      <TableHeader><TableRow><TableHead>Setor</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableCell>2814</TableCell></TableRow></TableBody>
    </Table>,
  )
  const tabela = screen.getByRole('table')
  expect(tabela.classList.contains('oa-table')).toBe(true)
  expect(tabela.className).toContain('tabular-nums')
  expect(tabela.parentElement?.classList.contains('oa-table-scroll')).toBe(true)
  expect(screen.getByRole('columnheader', { name: 'Setor' })).toBeDefined()
})

test('Skeleton usa um token OANET e aceita classe de tamanho', () => {
  const { container } = render(<Skeleton className="h-9 w-64" />)
  const bloco = container.querySelector('[data-slot="skeleton"]')!
  expect(bloco.className).toContain('--oa-')
  expect(bloco.classList.contains('h-9')).toBe(true)
})
