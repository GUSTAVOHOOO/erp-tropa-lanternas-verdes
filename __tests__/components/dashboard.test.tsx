import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard as DashboardComponent } from '@/app/(painel)/painel/_components/Dashboard'
import type { Dashboard } from '@/lib/schemas/dashboard'
import type { Setor } from '@/lib/schemas/setor'

vi.mock('next/navigation', () => ({
  usePathname: () => '/painel',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}))

const dadosCompletos: Dashboard = {
  porStatus: {
    aberta: 4,
    em_andamento: 1,
    resolvida: 2,
  },
  porGravidade: {
    baixa: 1,
    media: 2,
    alta: 3,
    critica: 1,
  },
  vencidas: 1,
  tempoMedioResolucaoHoras: 36.5,
  serie: [
    { dia: '2026-11-03', abertas: 0, resolvidas: 0 },
    { dia: '2026-11-04', abertas: 0, resolvidas: 1 },
    { dia: '2026-11-05', abertas: 2, resolvidas: 0 },
  ],
  ranking: [
    { lanternaId: 'hal-jordan', codinome: 'Hal Jordan', resolvidas: 2 },
    { lanternaId: 'kilowog', codinome: 'Kilowog', resolvidas: 1 },
  ],
}

const dadosSemResolvidas: Dashboard = {
  porStatus: {
    aberta: 0,
    em_andamento: 0,
    resolvida: 0,
  },
  porGravidade: {
    baixa: 0,
    media: 0,
    alta: 0,
    critica: 0,
  },
  vencidas: 0,
  tempoMedioResolucaoHoras: null,
  serie: [
    { dia: '2026-11-03', abertas: 0, resolvidas: 0 },
  ],
  ranking: [],
}

const setoresExemplo: Setor[] = [
  { id: 2814, nome: 'Setor 2814', descricao: 'Setor espacial 2814' },
  { id: 674, nome: 'Setor 674', descricao: 'Setor de Bolovax Vik' },
]

test('Dashboard exibe números e rótulos de status com links acessíveis', () => {
  render(<DashboardComponent dados={dadosCompletos} dias={30} />)

  const linkAberta = screen.getByRole('link', { name: /4\s*Abertas/i })
  expect(linkAberta.getAttribute('href')).toBe('/painel/ocorrencias?status=aberta')

  const linkAndamento = screen.getByRole('link', { name: /1\s*Em andamento/i })
  expect(linkAndamento.getAttribute('href')).toBe('/painel/ocorrencias?status=em_andamento')

  const linkResolvida = screen.getByRole('link', { name: /2\s*Resolvidas/i })
  expect(linkResolvida.getAttribute('href')).toBe('/painel/ocorrencias?status=resolvida')
})

test('Dashboard exibe vencidas maior que zero e zero explícito "Nenhuma vencida"', () => {
  const { unmount } = render(<DashboardComponent dados={dadosCompletos} dias={30} />)
  const painelVencidas = screen.getByRole('heading', { name: /Ocorrências vencidas/i }).closest('.oa-panel')
  expect(painelVencidas?.textContent).toContain('1')
  expect(painelVencidas?.textContent).toContain('vencidas')
  unmount()

  render(<DashboardComponent dados={dadosSemResolvidas} dias={30} />)
  const painelSemVencidas = screen.getByRole('heading', { name: /Ocorrências vencidas/i }).closest('.oa-panel')
  expect(painelSemVencidas?.textContent).toContain('Nenhuma vencida')
})

test('Dashboard exibe tempo médio em pt-BR com vírgula decimal e null como "Sem resoluções ainda"', () => {
  const { unmount } = render(<DashboardComponent dados={dadosCompletos} dias={30} />)
  expect(screen.getByText('36,5')).toBeDefined()
  expect(screen.getByText('horas')).toBeDefined()
  unmount()

  render(<DashboardComponent dados={dadosSemResolvidas} dias={30} />)
  expect(screen.getByText('Sem resoluções ainda')).toBeDefined()
})

test('Dashboard exibe barras de gravidade com rótulo e número em texto (CSS-12)', () => {
  render(<DashboardComponent dados={dadosCompletos} dias={30} />)

  expect(screen.getByText('Baixa')).toBeDefined()
  expect(screen.getByText('Média')).toBeDefined()
  expect(screen.getByText('Alta')).toBeDefined()
  expect(screen.getByText('Crítica')).toBeDefined()
  expect(screen.getByText('3')).toBeDefined()
})

test('Dashboard renderiza gráfico SVG com role="img" e aria-label resumindo', () => {
  render(<DashboardComponent dados={dadosCompletos} dias={30} />)

  const grafico = screen.getByRole('img', { name: /Série dos últimos 30 dias/i })
  expect(grafico).toBeDefined()
})

test('Dashboard renderiza tabela equivalente da série com todas as linhas e datas UTC sem deslocar', () => {
  render(<DashboardComponent dados={dadosCompletos} dias={30} />)

  expect(screen.getByText('Ver dados da série')).toBeDefined()
  const linhas = screen.getAllByRole('row')
  // 1 linha de cabeçalho + 3 linhas de dados
  expect(linhas).toHaveLength(4)

  // As datas não devem ser deslocadas pelo fuso local
  expect(screen.getByText('03/11/2026')).toBeDefined()
  expect(screen.getByText('04/11/2026')).toBeDefined()
  expect(screen.getByText('05/11/2026')).toBeDefined()
})

test('Dashboard renderiza ranking ordenado com Links para a ficha do lanterna', () => {
  render(<DashboardComponent dados={dadosCompletos} dias={30} />)

  const linkHal = screen.getByRole('link', { name: 'Hal Jordan' })
  expect(linkHal.getAttribute('href')).toBe('/lanternas/hal-jordan')

  const linkKilowog = screen.getByRole('link', { name: 'Kilowog' })
  expect(linkKilowog.getAttribute('href')).toBe('/lanternas/kilowog')

  expect(screen.getByText(/2 resolvidas/)).toBeDefined()
})

test('Dashboard sem resoluções exibe "Nenhuma resolução registrada" no ranking', () => {
  render(<DashboardComponent dados={dadosSemResolvidas} dias={30} />)

  expect(screen.getByText('Nenhuma resolução registrada')).toBeDefined()
})

test('Dashboard nunca exibe métricas ilustrativas da vitrine do laboratório', () => {
  const { container } = render(<DashboardComponent dados={dadosCompletos} dias={30} />)
  expect(container.textContent).not.toMatch(/7\.200|3\.600|98,7%/)
})

test('Dashboard renderiza filtro de setor quando fornecido para o Guardião', () => {
  render(<DashboardComponent dados={dadosCompletos} dias={30} setores={setoresExemplo} />)
  expect(screen.getByLabelText(/Período/i)).toBeDefined()
  expect(screen.getByLabelText(/Setor/i)).toBeDefined()
})
