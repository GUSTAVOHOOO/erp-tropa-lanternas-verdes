import { useId } from 'react'

// Campo fixo: mesmo céu no servidor e navegador, sem sorteio na hidratação.
const estrelas = Array.from({ length: 230 }, (_, i) => ({
  id: i,
  x: ((i * 7919 + 137) % 16000) / 10,
  y: ((i * 3571 + 89) % 10000) / 10,
  r: i % 19 === 0 ? 1.8 : i % 5 === 0 ? 1.1 : .55,
  opacidade: .25 + (i % 7) / 12,
}))

/** Cenário decorativo: SVG estático, sem loop de renderização ou rede. */
export function FundoCosmico() {
  const id = useId()
  return <div className="oa-cosmos" aria-hidden="true">
    <svg viewBox="0 0 1600 1000" data-oa-motion="cosmos" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        {['esmeralda', 'energia', 'floresta'].map(tom => <radialGradient key={tom} id={`${id}-${tom}`} className={`oa-nebula-${tom}`}><stop stopColor="currentColor" stopOpacity=".55" /><stop offset=".45" stopColor="currentColor" stopOpacity=".19" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient>)}
        <filter id={`${id}-nevoa`} x="-30%" y="-60%" width="160%" height="220%"><feTurbulence type="fractalNoise" baseFrequency=".006 .014" numOctaves="2" seed="17" result="poeira" /><feDisplacementMap in="SourceGraphic" in2="poeira" scale="110" xChannelSelector="R" yChannelSelector="G" /><feGaussianBlur stdDeviation="20" /></filter>
      </defs>
      <g filter={`url(#${id}-nevoa)`} transform="rotate(-28 800 500)">
        <ellipse cx="900" cy="470" rx="850" ry="200" fill={`url(#${id}-esmeralda)`} />
        <ellipse cx="1150" cy="410" rx="500" ry="140" fill={`url(#${id}-energia)`} />
        <ellipse cx="480" cy="570" rx="450" ry="160" fill={`url(#${id}-floresta)`} />
      </g>
      <g transform="rotate(-28 800 500)" aria-hidden="true">
        <g className="oa-vec-cosmos-deriva oa-vec-cosmos-deriva-0" opacity=".3"><ellipse cx="900" cy="470" rx="640" ry="150" fill={`url(#${id}-esmeralda)`} /></g>
        <g className="oa-vec-cosmos-deriva oa-vec-cosmos-deriva-1" opacity=".28"><ellipse cx="1150" cy="410" rx="380" ry="105" fill={`url(#${id}-energia)`} /></g>
        <g className="oa-vec-cosmos-deriva oa-vec-cosmos-deriva-2" opacity=".28"><ellipse cx="480" cy="570" rx="340" ry="120" fill={`url(#${id}-floresta)`} /></g>
      </g>
      {[0, 1, 2].map(grupo => <g key={grupo} className={`oa-cosmos-stars oa-vec-cosmos-estrelas oa-vec-cosmos-estrelas-${grupo}`} fill="currentColor">{estrelas.filter(e => e.id % 3 === grupo).map(e => <circle key={e.id} cx={e.x} cy={e.y} r={e.r} opacity={e.opacidade} />)}</g>)}
      <g className="oa-cosmos-beacons" fill="none" stroke="currentColor" strokeWidth=".7">
        <path className="oa-vec-cosmos-farol oa-vec-cosmos-farol-0" d="M1280 156v16m-8-8h16" />
        <path className="oa-vec-cosmos-farol oa-vec-cosmos-farol-1" d="M380 324v12m-6-6h12" />
        <path className="oa-vec-cosmos-farol oa-vec-cosmos-farol-2" d="M1450 730v18m-9-9h18" />
      </g>
    </svg>
    <div className="oa-cosmos-vignette" />
  </div>
}
