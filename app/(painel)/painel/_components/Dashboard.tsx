import Link from 'next/link'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { FiltroDashboard } from './FiltroDashboard'
import { DIAS_PADRAO, type Dashboard as DashboardDados } from '@/lib/schemas/dashboard'
import type { Setor } from '@/lib/schemas/setor'

type DashboardProps = {
  dados: DashboardDados
  dias?: number
  setores?: Setor[]
}

const GRAVIDADES = ['baixa', 'media', 'alta', 'critica'] as const

const rotulosGravidade = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
} as const

const classesCorGravidade = {
  baixa: 'fill-gravidade-baixa',
  media: 'fill-gravidade-media',
  alta: 'fill-gravidade-alta',
  critica: 'fill-gravidade-critica',
} as const

function formatarDataUtc(dia: string): string {
  const [ano, mes, d] = dia.split('-')
  return `${d}/${mes}/${ano}`
}

/**
 * Dashboard operacional do painel com métricas reais agregadas pelo backend. [API-04][CSS-12]
 */
export function Dashboard({ dados, dias = DIAS_PADRAO, setores = [] }: DashboardProps) {
  const { porStatus, porGravidade, vencidas, tempoMedioResolucaoHoras, serie, ranking } = dados

  const formatadorHoras = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

  // Cálculo da distribuição de gravidade
  const maxGravidade = Math.max(1, porGravidade.baixa, porGravidade.media, porGravidade.alta, porGravidade.critica)

  // Cálculo da série SVG
  const maxSerie = Math.max(1, ...serie.map((s) => Math.max(s.abertas, s.resolvidas)))
  const totalAbertas = serie.reduce((acc, s) => acc + s.abertas, 0)
  const totalResolvidas = serie.reduce((acc, s) => acc + s.resolvidas, 0)
  const ariaLabelSerie = `Série dos últimos ${dias} dias: ${totalAbertas} abertas e ${totalResolvidas} resolvidas`

  const svgXMin = 36
  const svgXMax = 464
  const svgYMin = 20
  const svgYMax = 120
  const alturaUtil = svgYMax - svgYMin
  const larguraUtil = svgXMax - svgXMin

  const calcularX = (i: number) =>
    serie.length > 1 ? svgXMin + (i / (serie.length - 1)) * larguraUtil : (svgXMin + svgXMax) / 2
  const calcularYAbertas = (valor: number) => svgYMax - (valor / maxSerie) * alturaUtil
  const calcularYResolvidas = (valor: number) => svgYMax - (valor / maxSerie) * alturaUtil

  const pontosAbertas = serie.map((item, i) => `${calcularX(i).toFixed(1)},${calcularYAbertas(item.abertas).toFixed(1)}`).join(' ')
  const pontosResolvidas = serie.map((item, i) => `${calcularX(i).toFixed(1)},${calcularYResolvidas(item.resolvidas).toFixed(1)}`).join(' ')

  return (
    <div className="grid gap-6">
      <MolduraOa titulo="Filtros operacionais" icone="painel">
        <div className="oa-panel-body">
          <FiltroDashboard setores={setores} />
        </div>
      </MolduraOa>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* (a) Status: três números com rótulo de texto */}
        <MolduraOa titulo="Status operacional" icone="painel">
          <div className="grid grid-cols-3 gap-2 py-2">
            <Link
              href="/painel/ocorrencias?status=aberta"
              className="flex flex-col items-center justify-center p-2 rounded bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
            >
              <strong className="text-2xl font-bold font-mono text-foreground">{porStatus.aberta}</strong>
              <span className="text-xs text-muted-foreground">Abertas</span>
            </Link>
            <Link
              href="/painel/ocorrencias?status=em_andamento"
              className="flex flex-col items-center justify-center p-2 rounded bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
            >
              <strong className="text-2xl font-bold font-mono text-foreground">{porStatus.em_andamento}</strong>
              <span className="text-xs text-muted-foreground text-center">Em andamento</span>
            </Link>
            <Link
              href="/painel/ocorrencias?status=resolvida"
              className="flex flex-col items-center justify-center p-2 rounded bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
            >
              <strong className="text-2xl font-bold font-mono text-foreground">{porStatus.resolvida}</strong>
              <span className="text-xs text-muted-foreground">Resolvidas</span>
            </Link>
          </div>
        </MolduraOa>

        {/* (c) Vencidas */}
        <MolduraOa titulo="Ocorrências vencidas" icone="sino">
          <div className="flex flex-col items-center justify-center h-full min-h-[90px] p-2">
            {vencidas === 0 ? (
              <span className="text-sm font-medium text-muted-foreground">Nenhuma vencida</span>
            ) : (
              <div className="flex items-baseline gap-2">
                <strong className="text-3xl font-bold font-mono text-destructive">{vencidas}</strong>
                <span className="text-sm text-destructive">vencidas</span>
              </div>
            )}
          </div>
        </MolduraOa>

        {/* (d) Tempo médio de resolução */}
        <MolduraOa titulo="Tempo médio de resolução" icone="energia">
          <div className="flex flex-col items-center justify-center h-full min-h-[90px] p-2">
            {tempoMedioResolucaoHoras === null ? (
              <span className="text-sm font-medium text-muted-foreground">Sem resoluções ainda</span>
            ) : (
              <div className="flex items-baseline gap-2">
                <strong className="text-3xl font-bold font-mono text-foreground">
                  {formatadorHoras.format(tempoMedioResolucaoHoras)}
                </strong>
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
            )}
          </div>
        </MolduraOa>

        {/* (b) Gravidade: barras horizontais em SVG com número em texto */}
        <MolduraOa titulo="Distribuição por gravidade" icone="alvo">
          <div className="grid gap-2 px-4 pt-3 pb-6">
            {GRAVIDADES.map((g) => {
              const valor = porGravidade[g]
              const larguraPct = Math.max(valor > 0 ? 4 : 0, Math.round((valor / maxGravidade) * 100))
              return (
                <div key={g} className="flex items-center gap-2 text-xs">
                  <span className="w-14 font-medium">{rotulosGravidade[g]}</span>
                  <div className="flex-1">
                    <svg viewBox="0 0 100 8" className="h-2 w-full" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y="0" width="100" height="8" rx="4" className="fill-muted/20" />
                      {valor > 0 && (
                        <rect
                          x="0"
                          y="0"
                          width={larguraPct}
                          height="8"
                          rx="4"
                          className={classesCorGravidade[g]}
                        />
                      )}
                    </svg>
                  </div>
                  <span className="w-6 text-right font-mono font-medium">{valor}</span>
                </div>
              )
            })}
          </div>
        </MolduraOa>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* (e) Série dos últimos {dias} dias */}
        <div className="lg:col-span-2">
          <MolduraOa titulo={`Série dos últimos ${dias} dias`} icone="relatorios">
            <div className="oa-chart-legend mb-2">
              <span>Abertas</span>
              <span>Resolvidas</span>
              <small>Últimos {dias} dias</small>
            </div>
            <svg
              className="oa-chart"
              viewBox="0 0 500 160"
              role="img"
              aria-label={ariaLabelSerie}
            >
              {[20, 70, 120].map((y) => (
                <line key={y} x1={svgXMin} x2={svgXMax} y1={y} y2={y} className="oa-chart-grid" />
              ))}
              {serie.length > 0 && (
                <>
                  <polyline points={pontosResolvidas} className="oa-chart-secondary" />
                  <polyline points={pontosAbertas} className="oa-chart-primary" />
                  {serie.map((item, i) => (
                    <circle
                      key={`aberta-${item.dia}`}
                      cx={calcularX(i)}
                      cy={calcularYAbertas(item.abertas)}
                      r="3"
                      className="oa-chart-point"
                    />
                  ))}
                </>
              )}
            </svg>
            <details className="oa-disclosure mt-4 px-4 pb-5">
              <summary>
                Ver dados da série
              </summary>
              <div className="mt-2 max-h-56 overflow-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className="py-1 px-2 font-medium">Data</th>
                      <th scope="col" className="py-1 px-2 font-medium">Abertas</th>
                      <th scope="col" className="py-1 px-2 font-medium">Resolvidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serie.map((item) => (
                      <tr key={item.dia} className="border-b border-border/40">
                        <td className="py-1 px-2 font-mono">{formatarDataUtc(item.dia)}</td>
                        <td className="py-1 px-2">{item.abertas}</td>
                        <td className="py-1 px-2">{item.resolvidas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </MolduraOa>
        </div>

        {/* (f) Ranking */}
        <div className="lg:col-span-1">
          <MolduraOa titulo="Ranking de resoluções" icone="hierarquia">
            {ranking.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma resolução registrada
              </p>
            ) : (
              <ol className="divide-y divide-border/50 px-4 pt-2 pb-5">
                {ranking.map((item, index) => (
                  <li key={item.lanternaId} className="flex items-center justify-between py-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground w-4">{index + 1}.</span>
                      <Link
                        href={`/lanternas/${item.lanternaId}`}
                        className="font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline text-sm"
                      >
                        {item.codinome}
                      </Link>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.resolvidas} {item.resolvidas === 1 ? 'resolvida' : 'resolvidas'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </MolduraOa>
        </div>
      </div>
    </div>
  )
}
