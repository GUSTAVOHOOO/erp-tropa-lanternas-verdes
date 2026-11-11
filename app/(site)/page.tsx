import Link from 'next/link'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { Juramento } from '@/components/Juramento'
import { BateriaOa, CidadeOa } from '@/components/oanet/ConstructosOa'
import { IconeOa } from '@/components/oanet/IconeOa'
import { MolduraOa } from '@/components/oanet/PainelOa'

/** Homepage: o único lugar com mais expressão; leva a todas as áreas. */
export default function HomePage() { // [DEC-09]
  return (
    <div className="oa-screen">
      <CabecalhoPagina titulo="Central de Ocorrências da Tropa dos Lanternas Verdes" descricao="União. Justiça. Proteção." />
      <MolduraOa className="oa-portal-hero">
        <div className="oa-portal-copy">
          <span className="oa-portal-signature">OA CENTRAL // REDE PÚBLICA</span>
          <h2>A vontade move <span>o universo.</span></h2> {/* [CSS-13] */}
          <p>
            De Oa, os Guardiões acompanham o que acontece nos 3600 setores do universo. Aqui a Tropa registra
            cada ocorrência intergaláctica e decide quem vai atendê-la.
          </p>
          <div className="oa-button-row">
            <Link href="/painel" className="oa-button oa-button--energia"><span className="oa-button-content">Entrar na Central de Comando</span></Link> {/* [ROTA-16] */}
            <Link href="/lanternas" className="oa-button oa-button--linha"><span className="oa-button-content">Conhecer os lanternas</span></Link>
            <Link href="/sobre" className="oa-button oa-button--linha"><span className="oa-button-content">Sobre a Tropa</span></Link>
          </div>
        </div>
        <CidadeOa className="oa-portal-city" />
      </MolduraOa>
      <MolduraOa>
        <div className="oa-portal-bottom">
          <div><IconeOa nome="escudo" /><strong>Central de Oa.<br />Uma só luz.</strong></div>
          <Juramento />
          <BateriaOa className="oa-portal-battery" />
        </div>
      </MolduraOa>
    </div>
  )
}

