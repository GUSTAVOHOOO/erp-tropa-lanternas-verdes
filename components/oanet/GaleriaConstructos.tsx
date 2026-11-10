'use client'

import { useState } from 'react'
import { constructosHumanos } from './ConstructosHumanos'
import { constructosCosmicos } from './ConstructosCosmicos'
import { MolduraOa, SeloOa } from './PainelOa'

export const constructosLanternas = [...constructosHumanos, ...constructosCosmicos]

/** Estudos visuais; não altera o cadastro da Tropa. */
export function GaleriaConstructos() {
  const [nome, setNome] = useState('Hal Jordan')
  const selecionado = constructosLanternas.find(c => c.nome === nome) ?? constructosLanternas[0]
  const Arte = selecionado.Arte
  return <MolduraOa titulo="Arquivo de construtos" icone="equipamentos" className="oa-construct-archive" acao={<SeloOa>{constructosLanternas.length} estudos SVG</SeloOa>}>
    <div className="oa-construct-gallery">
      <div className="oa-construct-index"><label className="oa-field"><span>Explorar construto por Lanterna</span><select className="oa-select" value={nome} onChange={e => setNome(e.target.value)}>{constructosLanternas.map(c => <option key={c.nome}>{c.nome}</option>)}</select></label><p>Uma vontade.<br /><strong>Infinitas formas.</strong></p><span>LUZ SÓLIDA / ARQUIVO VISUAL</span></div>
      <figure className="oa-construct-figure"><div className="oa-construct-projection"><Arte className="oa-lantern-construct" /></div><figcaption aria-live="polite"><span>{selecionado.nome}</span><h3>{selecionado.titulo}</h3><p>{selecionado.descricao}</p></figcaption></figure>
    </div>
    <p className="oa-construct-disclaimer">Interpretações artísticas para o laboratório, inspiradas nos membros pesquisados. Os objetos não são um catálogo canônico dos quadrinhos.</p>
  </MolduraOa>
}

export function ConstructoDoLanterna({ nome }: { nome: string }) {
  const constructo = constructosLanternas.find(c => c.nome === nome)
  if (!constructo) return null
  const Arte = constructo.Arte
  return <figure className="oa-profile-construct"><Arte className="oa-lantern-construct" /><figcaption>{constructo.titulo}<small>Estudo de luz sólida · SVG original</small></figcaption></figure>
}
