import { expect, test } from 'vitest'
import Link from 'next/link'
import { render, screen } from '@testing-library/react'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { BarraStatus } from '@/components/BarraStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { GRAVIDADES, STATUS_OCORRENCIA, rotuloGravidade, rotuloStatus } from '@/lib/schemas/ocorrencia'

test('BadgeGravidade sempre mostra o texto, nunca só a cor (CSS-12)', () => {
  for (const gravidade of GRAVIDADES) {
    const { unmount } = render(<BadgeGravidade gravidade={gravidade} />)
    expect(screen.getByText(rotuloGravidade[gravidade])).toBeDefined()
    unmount()
  }
})

// UI-02.00: os tons seguem o laboratório (TelasOa): crítica em vermelho, baixa em azul, as demais em âmbar.
test('BadgeGravidade é um selo OANET com o tom do laboratório', () => {
  const tons = { baixa: 'azul', media: 'ambar', alta: 'ambar', critica: 'vermelho' } as const
  for (const gravidade of GRAVIDADES) {
    const { unmount } = render(<BadgeGravidade gravidade={gravidade} />)
    const selo = screen.getByText(rotuloGravidade[gravidade]).closest('.oa-badge')
    expect(selo?.classList.contains(`oa-badge--${tons[gravidade]}`)).toBe(true)
    unmount()
  }
})

test('BadgeStatus mostra o rótulo e o símbolo é decorativo', () => {
  const { container } = render(<BadgeStatus status="em_andamento" />)
  expect(screen.getByText('Em andamento')).toBeDefined()
  const simbolos = container.querySelectorAll('svg, .oa-badge > span')
  expect(simbolos.length).toBeGreaterThan(0)
  for (const simbolo of simbolos) expect(simbolo.getAttribute('aria-hidden')).toBe('true')
})

// UI-02.00: mesmos tons do laboratório: resolvida em verde, aberta em âmbar, em andamento neutro.
test('BadgeStatus é um selo OANET com o tom do laboratório', () => {
  const tons = { aberta: 'ambar', em_andamento: 'neutro', resolvida: 'verde' } as const
  for (const status of STATUS_OCORRENCIA) {
    const { unmount } = render(<BadgeStatus status={status} />)
    const selo = screen.getByText(rotuloStatus[status]).closest('.oa-badge')
    expect(selo?.classList.contains(`oa-badge--${tons[status]}`)).toBe(true)
    unmount()
  }
})

test('BarraStatus acende um segmento por ocorrência e a legenda filtra', () => {
  const ocorrencias = [
    { id: 'a', status: 'aberta' as const },
    { id: 'b', status: 'aberta' as const },
    { id: 'c', status: 'resolvida' as const },
  ]
  const { container } = render(<BarraStatus ocorrencias={ocorrencias} />)
  expect(container.querySelectorAll('[data-status]')).toHaveLength(3)
  expect(screen.getByRole('link', { name: /2\s*abertas/ }).getAttribute('href')).toBe('/painel/ocorrencias?status=aberta')
  expect(screen.getByRole('link', { name: /0\s*em andamento/ }).getAttribute('href')).toBe('/painel/ocorrencias?status=em_andamento')
  expect(screen.getByRole('link', { name: /1\s*resolvidas/ }).getAttribute('href')).toBe('/painel/ocorrencias?status=resolvida')
})

test('BarraStatus sem ocorrências não desenha a barra e mostra zeros', () => {
  const { container } = render(<BarraStatus ocorrencias={[]} />)
  expect(container.querySelectorAll('[data-status]')).toHaveLength(0)
  expect(screen.getByRole('link', { name: /0\s*abertas/ })).toBeDefined()
})

test('CabecalhoPagina tem um único h1, descrição e ação', () => {
  render(
    <CabecalhoPagina titulo="Ocorrências" descricao="Todas as ocorrências da Tropa.">
      <Link href="/painel/ocorrencias/nova">Registrar ocorrência</Link>
    </CabecalhoPagina>,
  )
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  const titulo = screen.getByRole('heading', { level: 1, name: 'Ocorrências' })
  expect(titulo.closest('header')?.classList.contains('oa-page-heading')).toBe(true) // UI-02.00: abertura OANET
  expect(screen.getByText('Todas as ocorrências da Tropa.')).toBeDefined()
  expect(screen.getByRole('link', { name: 'Registrar ocorrência' })).toBeDefined()
})

test('CabecalhoPagina sem descrição nem ação mostra só o título', () => {
  const { container } = render(<CabecalhoPagina titulo="Sobre" />)
  expect(screen.getByRole('heading', { level: 1, name: 'Sobre' })).toBeDefined()
  expect(container.querySelector('p')).toBeNull()
})

test('TabelaOcorrencias não tem texto solto entre células (hidratação)', () => {
  const { container } = render(
    <TabelaOcorrencias
      ocorrencias={[{ id: 'o1', titulo: 'Ataque', descricao: 'x', planeta: 'Terra', setorId: '2814', gravidade: 'alta', status: 'aberta', envolvidos: 1, responsavelId: null, resolucao: null, criadaPor: 'u1', criadaEm: '2026-10-01T12:00:00.000Z' }]}
      nomeSetor={{ '2814': 'Setor 2814' }}
      nomeLanterna={{}}
    />,
  )
  for (const linha of container.querySelectorAll('tr')) {
    const textoSolto = [...linha.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE)
    expect(textoSolto).toHaveLength(0)
  }
})
