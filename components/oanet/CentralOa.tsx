'use client'

import { useId, useState } from 'react'
import { IconeOa } from './IconeOa'
import { EmblemaOa } from './EmblemaOa'
import { CidadeOa } from './ConstructosOa'
import { GalaxiaProcedural } from './GalaxiaProcedural'
import { LinhaSinal, MedidorOa, MolduraOa, SeloOa } from './PainelOa'
import type { TelaOa } from './dados-demo'

function EstatisticasOa() {
  const [periodo, setPeriodo] = useState(7)
  const id = useId()
  const serie = periodo === 7 ? [33, 49, 73, 68, 48, 43, 54, 68, 63, 51, 57, 70, 76] : periodo === 30 ? [28, 39, 33, 54, 48, 67, 55, 72, 65, 79, 69, 85, 90] : [16, 21, 37, 31, 44, 49, 40, 61, 67, 58, 74, 82, 93]
  const linha = serie.map((valor, i) => `${36 + i * 33},${144 - valor * 1.1}`).join(' ')
  return <MolduraOa titulo="Atividade da Tropa" icone="relatorios" className="oa-activity-panel" acao={<div className="oa-segmented" aria-label="Período do gráfico">{[7, 30, 90].map(dias => <button key={dias} aria-pressed={periodo === dias} onClick={() => setPeriodo(dias)}>{dias}d</button>)}</div>}>
    <div className="oa-chart-legend"><span>Ocorrências</span><span>Resolvidas</span><small>Últimos {periodo} dias</small></div>
    <svg className="oa-chart" viewBox="0 0 470 180" role="img" aria-label={`Atividade demonstrativa dos últimos ${periodo} dias; tendência de crescimento.`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--oa-energy)" stopOpacity=".24" /><stop offset="1" stopColor="var(--oa-energy)" stopOpacity="0" /></linearGradient></defs>
      {[35, 70, 105, 140].map((y, i) => <g key={y}><line x1="32" x2="450" y1={y} y2={y} className="oa-chart-grid" /><text x="8" y={y + 4}>{6 - i * 2}k</text></g>)}
      {[36, 102, 168, 234, 300, 366, 432].map(x => <line key={x} x1={x} x2={x} y1="20" y2="140" className="oa-chart-grid" />)}
      <polygon points={`36,140 ${linha} 432,140`} fill={`url(#${id})`} />
      <polyline points={serie.map((v, i) => `${36 + i * 33},${153 - v * .65}`).join(' ')} className="oa-chart-secondary" />
      <polyline points={linha} className="oa-chart-primary" />
      {serie.map((v, i) => <circle key={i} cx={36 + i * 33} cy={144 - v * 1.1} r="3.3" className="oa-chart-point" />)}
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, i) => <text x={36 + i * 66} y="169" textAnchor="middle" key={dia}>{dia}</text>)}
    </svg>
  </MolduraOa>
}

export function CentralOa({ navegar, efeitosReduzidos = false }: { navegar: (tela: TelaOa) => void; efeitosReduzidos?: boolean }) {
  const metricas = [
    { nome: 'Lanternas ativos', valor: '7.200', icone: 'pessoal', variacao: '+0,3%' },
    { nome: 'Setores monitorados', valor: '3.600', icone: 'setores', variacao: '+0,1%' },
    { nome: 'Energia da bateria', valor: '98,7', unidade: '%', icone: 'energia', variacao: 'Capacidade central' },
    { nome: 'Alertas prioritários', valor: '12', icone: 'escudo', variacao: '+1 nesta hora' },
  ] as const
  return <div className="oa-screen">
    <div className="oa-metrics">{metricas.map((m, i) => <MolduraOa key={m.nome} className={`oa-metric ${i === 3 ? 'oa-metric--warning' : ''}`}><div className="oa-metric-icon"><IconeOa nome={m.icone} /></div><div className="oa-metric-copy"><strong>{m.valor}{'unidade' in m && <small>{m.unidade}</small>}</strong><span>{m.nome}</span><small className="oa-metric-delta">{i < 2 && '↗ '}{m.variacao}</small></div>{i === 2 ? <svg className="oa-energy-bar" viewBox="0 0 130 8" aria-hidden="true"><path d="M4 4h122" /><path d="M4 4h116" /></svg> : <LinhaSinal variante={i} />}</MolduraOa>)}</div>
    <div className="oa-command-grid">
      <MolduraOa titulo="Mapa galáctico" icone="alvo" className="oa-map-panel" acao={<span className="oa-live"><i />Transmissão ao vivo</span>}><GalaxiaProcedural efeitosReduzidos={efeitosReduzidos} /></MolduraOa>
      <MolduraOa titulo="Alertas prioritários" icone="ocorrencias" className="oa-alerts-panel" acao={<button className="oa-text-action" onClick={() => navegar('ocorrencias')}>Ver todos <IconeOa nome="seta" /></button>}>
        <ul className="oa-alert-list">
          <li><span className="oa-alert-icon oa-tone-danger"><IconeOa nome="ocorrencias" /></span><div><strong className="oa-tone-danger">Ameaça de nível Ômega</strong><p>Setor 7632 · Sinal de atividade Parallax detectado.</p><small>Há 12 minutos</small></div></li>
          <li><span className="oa-alert-icon oa-tone-warning"><IconeOa nome="escudo" /></span><div><strong className="oa-tone-warning">Ocorrência em andamento</strong><p>Setor 1187 · Conflito com forças desconhecidas.</p><small>Há 28 minutos</small></div></li>
          <li><span className="oa-alert-icon"><IconeOa nome="energia" /></span><div><strong>Atualização da bateria</strong><p>Capacidade da Bateria Central em 98,7%. Sistemas estáveis.</p><small>Há 1 hora</small></div></li>
        </ul>
        <div className="oa-alert-foot"><span className="oa-live"><i />Rede de vigilância ativa</span><span>3600 / 3600</span></div>
      </MolduraOa>
      <MolduraOa titulo="Operações recentes" icone="missoes" className="oa-missions-panel" acao={<button className="oa-text-action" onClick={() => navegar('ocorrencias')}>Abrir registro <IconeOa nome="seta" /></button>}>
        <ul className="oa-operation-list">{[{ nome: 'Patrulha orbital', setor: 'Setor 2814', estado: 'Concluída', icone: 'setores' }, { nome: 'Investigação', setor: 'Setor 7632', estado: 'Em andamento', icone: 'busca' }, { nome: 'Resgate civil', setor: 'Setor 1187', estado: 'Pendente', icone: 'escudo' }].map((op, i) => <li key={op.nome}><div className={`oa-operation-symbol oa-operation-symbol--${i}`}><IconeOa nome={op.icone as 'setores' | 'busca' | 'escudo'} /></div><div><strong>{op.nome}</strong><small>{op.setor}</small></div><SeloOa tom={i === 0 ? 'verde' : 'ambar'}>{op.estado}</SeloOa></li>)}</ul>
      </MolduraOa>
      <EstatisticasOa />
      <MolduraOa titulo="Hierarquia da Tropa" icone="hierarquia" className="oa-hierarchy-panel" acao={<button className="oa-text-action" onClick={() => navegar('lanternas')}>Conhecer a Tropa <IconeOa nome="seta" /></button>}><div className="oa-hierarchy"><EmblemaOa className="oa-hierarchy-emblem" /><div><h3>Comando Central de Oa</h3><p>Uma vontade. Um universo.</p><ul><li><IconeOa nome="hierarquia" />Conselho dos Guardiões</li><li><IconeOa nome="escudo" />Comando da Tropa</li><li><IconeOa nome="pessoal" />Corpo de patrulha</li></ul></div><CidadeOa className="oa-hierarchy-city" /></div></MolduraOa>
      <MolduraOa titulo="Integridade operacional" icone="verificado" className="oa-integrity-panel"><div className="oa-integrity"><MedidorOa valor={100} /><ul>{['Anéis operacionais', 'Comunicação estável', 'Bateria Central', 'Sistemas online'].map(item => <li key={item}><span className="oa-dot" />{item}</li>)}</ul></div><svg className="oa-equalizer" viewBox="0 0 340 30" preserveAspectRatio="none" aria-hidden="true">{Array.from({ length: 68 }, (_, i) => <line key={i} x1={i * 5 + 1} x2={i * 5 + 1} y1={29} y2={(29 - (Math.sin(i * .63) + 1) * 7 - (i % 9) - 3).toFixed(4)} />)}</svg></MolduraOa>
    </div>
  </div>
}
