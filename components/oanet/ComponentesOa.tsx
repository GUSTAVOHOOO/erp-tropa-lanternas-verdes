'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Input } from '@/components/ui/input'
import { IconeOa, type IconeOaNome } from './IconeOa'
import { EmblemaOa } from './EmblemaOa'
import { BateriaOa } from './ConstructosOa'
import { BotaoOa, MedidorOa, MolduraOa, SeloOa } from './PainelOa'

const icones: IconeOaNome[] = ['painel', 'pessoal', 'setores', 'ocorrencias', 'missoes', 'equipamentos', 'hierarquia', 'relatorios', 'comunicacoes', 'escudo', 'energia', 'alvo', 'busca', 'sino', 'configuracao', 'codigo', 'seta', 'mais', 'menos', 'sair', 'menu', 'fechar', 'verificado', 'olho', 'pausa', 'play']

export function ComponentesOa({ notificar }: { notificar: (mensagem: string) => void }) {
  const [aba, setAba] = useState('Geral')
  const [icone, setIcone] = useState<IconeOaNome>('energia')
  const [confirmar, setConfirmar] = useState(false)
  return <div className="oa-screen">
    <div className="oa-gallery-intro"><IconeOa nome="codigo" /><p>Geometria, luz e vontade.<br /><span>Uma biblioteca inteira construída em código.</span></p><SeloOa>HTML · CSS · SVG · Canvas</SeloOa></div>
    <div className="oa-component-grid">
      <MolduraOa titulo="Comandos de energia" icone="energia"><div className="oa-sample-body"><div className="oa-button-row"><BotaoOa onClick={() => notificar('Sinal transmitido. A Central recebeu sua mensagem.')}>Emitir sinal<IconeOa nome="seta" /></BotaoOa><BotaoOa tom="linha" onClick={() => notificar('Canal secundário selecionado.')}>Canal secundário</BotaoOa></div><div className="oa-button-row"><BotaoOa tom="perigo" onClick={() => setConfirmar(true)}><IconeOa nome="ocorrencias" />Testar confirmação</BotaoOa><BotaoOa disabled>Indisponível</BotaoOa></div><p className="oa-caption">Cantos recortados, terminais de luz e estados de interação.</p></div></MolduraOa>
      <MolduraOa titulo="Sinais e classificação" icone="escudo"><div className="oa-sample-body"><div className="oa-badge-row"><SeloOa>Online</SeloOa><SeloOa tom="ambar">Atenção</SeloOa><SeloOa tom="vermelho">Crítico</SeloOa><SeloOa tom="azul">Informação</SeloOa><SeloOa tom="neutro">Em espera</SeloOa></div><div className="oa-component-alert"><IconeOa nome="verificado" /><div><strong>Protocolo de patrulha atualizado.</strong><p>Sistemas sincronizados com a Bateria Central.</p></div></div></div></MolduraOa>
      <MolduraOa titulo="Painel de navegação" icone="painel"><div className="oa-sample-body"><div className="oa-tabs" role="tablist" aria-label="Exemplo de abas">{['Geral', 'Avançado', 'Histórico'].map((nome, i) => <button id={`oa-tab-${i}`} aria-controls="oa-tab-panel" role="tab" aria-selected={aba === nome} key={nome} onClick={() => setAba(nome)} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const proximo = (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3; setAba(['Geral', 'Avançado', 'Histórico'][proximo]); document.getElementById(`oa-tab-${proximo}`)?.focus() } }} tabIndex={aba === nome ? 0 : -1}>{nome}</button>)}</div><div className="oa-tab-content" role="tabpanel" id="oa-tab-panel" aria-labelledby={`oa-tab-${['Geral', 'Avançado', 'Histórico'].indexOf(aba)}`}><EmblemaOa className="oa-sample-emblem" /><div><strong>{aba === 'Geral' ? 'Conexão com Oa estabelecida' : aba === 'Avançado' ? 'Protocolo de energia' : 'Última sincronização'}</strong><p>{aba === 'Geral' ? 'Canal seguro · Setor 2814' : aba === 'Avançado' ? 'Frequência estável · Potência nominal' : 'Hoje, às 15h24 · Sem ocorrências'}</p></div></div></div></MolduraOa>
      <MolduraOa titulo="Credenciais e campos" icone="codigo"><div className="oa-sample-body"><label className="oa-field"><span>Identificação do Lanterna</span><Input className="oa-input" placeholder="Digite sua identificação" /></label><div className="oa-form-columns"><label className="oa-field"><span>Setor</span><select className="oa-select" defaultValue="2814"><option>2814</option><option>674</option><option>1187</option></select></label><label className="oa-field"><span>Campo desabilitado</span><Input className="oa-input" value="Acesso do Guardião" disabled /></label></div></div></MolduraOa>
      <MolduraOa titulo="Símbolos da Tropa" icone="hierarquia" className="oa-icon-library"><div className="oa-sample-body"><div className="oa-icon-grid">{icones.map(nome => <button key={nome} aria-label={`Ícone ${nome}`} aria-pressed={icone === nome} onClick={() => setIcone(nome)}><IconeOa nome={nome} /><span>{nome}</span></button>)}</div><code className="oa-code-preview">{`<IconeOa nome="${icone}" />`}</code></div></MolduraOa>
      <MolduraOa titulo="Constructo de energia" icone="equipamentos" className="oa-construct-panel"><div className="oa-construct-sample"><BateriaOa className="oa-battery-sample" /><div><SeloOa>SVG procedural</SeloOa><h3>A origem da vontade.</h3><p>Geometria vetorial, camadas de luz e profundidade. Cada detalhe faz parte do código.</p><MedidorOa valor={98} legenda="Carga central" /></div></div></MolduraOa>
    </div>
    <details className="oa-source-note"><summary><IconeOa nome="codigo" />Como esta interface foi construída</summary><p>As molduras são recortadas em CSS. Os ícones, emblemas e constructos são SVGs originais. A galáxia é desenhada ponto a ponto em Canvas e os gráficos usam coordenadas vetoriais. Nenhum PNG, fotografia ou biblioteca de ícones é usado neste laboratório.</p></details>
    <Dialog.Root open={confirmar} onOpenChange={setConfirmar}>
      <Dialog.Portal><Dialog.Backdrop className="oa-dialog-backdrop" /><Dialog.Popup className="oa-dialog oa-lab" aria-describedby="oa-confirm-description"><div className="oa-dialog-symbol"><IconeOa nome="escudo" /></div><Dialog.Title className="oa-dialog-title">Confirmar envio da patrulha?</Dialog.Title><Dialog.Description id="oa-confirm-description" className="oa-dialog-description">A equipe receberá o sinal de mobilização para o setor 2814. Esta ação é apenas uma demonstração.</Dialog.Description><div className="oa-dialog-actions"><Dialog.Close render={<BotaoOa tom="linha" />}>Cancelar</Dialog.Close><BotaoOa onClick={() => { setConfirmar(false); notificar('Patrulha mobilizada na simulação. Nenhum dado real foi alterado.') }}>Confirmar envio<IconeOa nome="seta" /></BotaoOa></div></Dialog.Popup></Dialog.Portal>
    </Dialog.Root>
  </div>
}
