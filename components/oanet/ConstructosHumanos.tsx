'use client'

import { useId, type ReactNode } from 'react'

type PropriedadesArte = { className?: string }

/** Palco de projeção comum; a cor da luz é herdada da galeria. */
function Projecao({ titulo, movimento, children, className }: PropriedadesArte & { titulo: string; movimento: string; children: ReactNode }) {
  const id = useId()
  const brilho = `${id}-brilho`
  const luz = `${id}-luz`
  const grade = `${id}-grade`
  return (
    <svg className={className} data-oa-motion={movimento} viewBox="0 0 480 320" role="img" aria-labelledby={`${id}-titulo`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <title id={`${id}-titulo`}>{titulo}</title>
      <defs>
        <filter id={brilho} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="halo" />
          <feMerge><feMergeNode in="halo" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id={luz} x1="0" y1="0" x2="0.7" y2="1">
          <stop stopColor="currentColor" stopOpacity="0.32" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.025" />
        </linearGradient>
        <pattern id={grade} width="24" height="16" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .2 -1 .2 240 230)">
          <path d="M24 0H0V16" strokeOpacity="0.12" strokeWidth="0.7" />
        </pattern>
      </defs>
    <g className="oa-m-cantos">
      <g strokeWidth="0.7" opacity="0.32">
        <path d="M27 78V37h40M413 37h40v41M27 239v43h40M413 282h40v-43" />
        <path d="M34 45h18M34 50h10M428 45h18M436 50h10M34 269h18M428 269h18" />
        <path d="M240 33v14M233 40h14M240 278v14M233 285h14" />
        <path d="M45 158h20m350 0h20" strokeDasharray="2 4" />
      </g>
    </g>
      <path d="M240 209 432 251 240 299 48 251Z" fill={`url(#${grade})`} strokeOpacity="0.13" />
      <ellipse cx="240" cy="261" rx="155" ry="28" strokeOpacity="0.15" />
      <ellipse className="oa-m-orbita-p" cx="240" cy="261" rx="124" ry="20" strokeOpacity="0.38" strokeDasharray="65 8 3 8" />
    <ellipse className="oa-m-varredura-plataforma" cx="240" cy="261" rx="124" ry="20" pathLength="100" strokeWidth="2.4" />
      <path d="m102 252 25-6m226 0 25 6M240 237v-7m0 61v-7" strokeOpacity="0.48" />
      <path className="oa-m-luz-base" d="m157 258 83 17 83-17-83-18Z" fill={`url(#${luz})`} strokeOpacity="0.45" />
      <path d="M177 252 203 103M303 252 277 103" strokeOpacity="0.08" />
      <g filter={`url(#${brilho})`} strokeWidth="1.35">{children}</g>
    <g className="oa-m-sinais">
      <g strokeOpacity="0.5" strokeWidth="0.75">
        <path d="M74 208v-26h32M374 110h31v-28" />
        <circle cx="106" cy="182" r="2" /><circle cx="374" cy="110" r="2" />
        <path d="M74 216h17m-17 5h9M389 75h16m-8-5h8" />
      </g>
    </g>
    </svg>
  )
}

function JatoHal({ className }: PropriedadesArte) {
  return <Projecao className={className} movimento="jato-hal" titulo="Estudo de Hal Jordan: jato de luz sólida em projeção técnica">
    <g className="oa-m-voo">
    <g transform="translate(0 -4)">
      <path d="m100 214 59-53 83-30 133-31-80 65-83 35Z" fill="currentColor" fillOpacity="0.11" />
      <path d="m100 214 112-14 163-100-80 83Z" fill="currentColor" fillOpacity="0.2" />
      <path d="m212 200 30-69 133-31-111 65Z" fill="currentColor" fillOpacity="0.13" />
      <path className="oa-m-aleta" d="m242 131-52-53-27 4 31 76m59 23 68 42 25-9-51-49" fill="currentColor" fillOpacity="0.13" />
      <path d="m194 158-23-60 19-20m105 87 38 47 13 2" strokeOpacity="0.55" />
      <path d="m159 161-34-12-20 7 33 23M212 200l9 31 17-7 5-42" fill="currentColor" fillOpacity="0.18" />
      <path d="m159 161 53 39m30-69 22 34m-70-7 48-27m-21 100 5-26m-101-56 13 30" strokeOpacity="0.45" />
      <path className="oa-m-nucleo" d="m251 148 33-22 29-4-27 25-21 10Z" fill="currentColor" fillOpacity="0.3" />
      <path className="oa-m-nucleo oa-m-atraso" d="m266 138 10 13m8-25 2 21m-50 17 8 12 21-19m-38 14 9 9m-16-2 9 9" strokeOpacity="0.72" />
      <path className="oa-m-nucleo" d="m138 188 23 10 13-9-24-9Z" fill="currentColor" fillOpacity="0.27" />
      <path className="oa-m-nucleo oa-m-atraso" d="m175 207 22-13 13 5-22 15Z" fill="currentColor" fillOpacity="0.27" />
      <path className="oa-m-rastro" d="m139 192-30 13m73 4-24 16m-34-30-36 15m77 15-26 16" strokeDasharray="14 5" strokeOpacity="0.5" />
      <path className="oa-m-pulso" d="m202 108 13 5m90 79 13 5m-146-26 7-3m58-32 8 8m89-26 6 4" strokeWidth="2" />
      <path className="oa-m-rastro oa-m-rastro-b" d="m117 232 122 22 118-72" strokeDasharray="3 6" strokeOpacity="0.25" />
      <path d="m329 102 29-24 32-4m-197 4-15-17h-29" strokeOpacity="0.45" />
      <circle cx="390" cy="74" r="3" /><circle cx="149" cy="61" r="2" />
    </g>
    </g>
  </Projecao>
}

function PonteJohn({ className }: PropriedadesArte) {
  return <Projecao className={className} movimento="ponte-john" titulo="Estudo de John Stewart: ponte estrutural de luz sólida com treliças e pilares">
    <g className="oa-m-estrutura">
    <path d="m71 204 275-72 66 30-274 77Z" fill="currentColor" fillOpacity="0.12" />
    <path d="m71 204 67 35v13l-67-35Zm67 35 274-77v13l-274 77Z" fill="currentColor" fillOpacity="0.23" />
    <path d="m93 201 249-63 47 23-249 70Z" strokeOpacity="0.5" />
    <path className="oa-m-fluxo" d="m114 209 250-66m-229 76 248-68" strokeDasharray="14 8" strokeOpacity="0.65" />
    <path d="M127 210V110l24-7v100m-24-93 11 6 13-13m-13 13v92M318 156V60l24-6v96m-24-90 11 6 13-12m-13 12v89" fill="currentColor" fillOpacity="0.13" />
    <path d="M127 121 87 200m64-85 48 76m119-120-54 98m78-103 52 91" strokeWidth="1.8" />
    <path d="m138 119 191-48m-191 57 191-47" strokeWidth="2" />
    <path className="oa-m-pulso" d="m163 122 1 77m29-85 1 77m29-85 1 77m29-84 1 75m29-83 1 74m29-82 1 74" strokeOpacity="0.55" />
    <path d="m146 241 21 12 5-5v-20m-26 13v20l21 12v-20m0 20 5-5v-20M310 195v28l20 9 7-5v-39m-27 7 20 10 7-6m-7 6v27" fill="currentColor" fillOpacity="0.19" />
    <path className="oa-m-pulso oa-m-atraso" d="m88 218 19-27 31 47 19-56 32 42 20-56 31 41 20-55 31 41 20-54 29 40 21-54 28 40" strokeOpacity="0.5" />
    <path d="m138 252 274-77M71 217l67 35" strokeWidth="2" />
    <g className="oa-m-nucleo" strokeOpacity="0.55">
      <path d="m84 245 48 23m-52-20 8-10m41 34 8-10M355 121l24-7m-27 3 6 9m18-16 6 9" />
      <circle cx="138" cy="116" r="3" /><circle cx="329" cy="66" r="3" />
      <path d="M138 90V65h34m157-19V33h-32" />
    </g>
    </g>
    <path className="oa-m-varredura-estrutura" d="M80 62V262" strokeWidth="2.4" />
  </Projecao>
}

function PunhoGuy({ className }: PropriedadesArte) {
  return <Projecao className={className} movimento="punho-guy" titulo="Estudo de Guy Gardner: punho de boxe facetado em luz sólida">
    <g className="oa-m-soco">
    <path d="m171 239-20-65 18-59 33-37 29 1 17 13 25-4 26 17 23 8 20 25-4 46-35 39-56 22Z" fill="currentColor" fillOpacity="0.12" />
    <path d="m171 239 76 6 56-22-25 39-68 17-48-14Z" fill="currentColor" fillOpacity="0.24" />
    <path d="m169 115 31 20 31-56m-31 56 22 23 26-66m-26 66 29 5 22-75m-22 75 30 8 18-66m-18 66 29-4 12-54" fill="currentColor" fillOpacity="0.1" />
    <path d="m151 174 40 8 31-24m-31 24 11 41 45 22m-45-22 57-15 22-37m-22 37 44 15 35-39m-35 39 7-56" />
    <path className="oa-m-nucleo" d="m157 153 23-15 22 6 10 26-19 18-9 25-20-8Z" fill="currentColor" fillOpacity="0.23" />
    <path className="oa-m-nucleo oa-m-atraso" d="m180 138-4 29 17 21m-17-21-19-14m26 48 10-13" strokeOpacity="0.65" />
    <path className="oa-m-pulso" d="m191 113 15-18 15-2m16 26 10-15 13-2m13 30 8-16 11-1m8 31 10-9 10 4" strokeWidth="2.2" />
    <path d="m168 246 41 17 69-18m-69 18 1 16m26-21 1 14m24-21 1 14m-66-22-2 13" strokeOpacity="0.65" />
    <path className="oa-m-pulso oa-m-atraso" d="m206 228 37 8 39-17m-65 18 4 9m13-6 3 9m14-11 4 7" strokeWidth="0.8" />
    </g>
    <ellipse className="oa-m-impacto" cx="240" cy="261" rx="124" ry="20" strokeWidth="2.4" />
    <g className="oa-m-onda-impacto" strokeOpacity="0.55">
      <path d="m116 110-19-16m32 53-29-5m39-59-7-23m218 49 20-16m-15 56 28 1m-49 54 20 16" strokeWidth="2" />
      <path className="oa-m-fluxo" d="M119 195a119 119 0 0 1 14-106m209 118a119 119 0 0 0 12-101" strokeDasharray="5 7" />
      <path d="m244 64 6-19h31m43 174 16 18h30" />
      <circle cx="281" cy="45" r="2" /><circle cx="370" cy="237" r="2" />
    </g>
  </Projecao>
}

function MechaKyle({ className }: PropriedadesArte) {
  return <Projecao className={className} movimento="mecha-kyle" titulo="Estudo de Kyle Rayner: mecha de luz sólida com armadura e articulações técnicas">
    <g className="oa-m-corpo">
    <g className="oa-m-cabeca">
    <path d="m221 52 21-13 24 11 7 31-31 17-27-18Z" fill="currentColor" fillOpacity="0.2" />
    <path d="m221 52 21 11 24-13m-24 13v35m-19-26 12 5m14-1 13-7" />
    <path d="m215 62-12-17m69 12 12-17M230 40l-3-14m29 16 4-16" strokeOpacity="0.65" />
    </g>
    <g className="oa-m-torso">
    <path d="m198 100 44-10 48 16-11 68-36 23-39-26Z" fill="currentColor" fillOpacity="0.13" />
    <path d="m198 100 45 24 47-18m-47 18v73m-45-97 15 49 30 17 36-20 11-40" />
    <path className="oa-m-nucleo" d="m227 121 16-8 17 10-17 19Z" fill="currentColor" fillOpacity="0.35" />
    <path d="m209 157 34 20 33-19m-63 13 1 15 29 16 28-17 1-14" strokeOpacity="0.65" />
    </g>
    <g className="oa-m-bracos">
    <path d="m198 100-35-4-20 28 25 20 34-17m88-21 34-3 23 28-25 19-36-18" fill="currentColor" fillOpacity="0.21" />
    <path d="m163 96 8 27-28 1m28-1-3 21m156-41-7 26 30 2m-30-2 5 21" />
    <path d="m150 140-13 37 26 13 18-42m143 7 20 36 27-16-24-35" fill="currentColor" fillOpacity="0.09" />
    <circle className="oa-m-junta" cx="155" cy="173" r="10" /><circle className="oa-m-junta" cx="344" cy="174" r="10" />
    <path d="m134 185-13 29 24 16 22-18-5-22m176-1-2 31 26 9 17-24-13-19" fill="currentColor" fillOpacity="0.2" />
    <path d="m128 205 20 11 14-12m183-3 20 7m-232 6-3 9m11-5-2 9m213-13 2 9m7-9 2 8" />
    </g>
    <g className="oa-m-pernas">
    <path d="m216 190-13 36 29 11 13-37m5 1 16 35 29-11-22-35" fill="currentColor" fillOpacity="0.17" />
    <circle className="oa-m-junta oa-m-atraso" cx="218" cy="228" r="9" /><circle className="oa-m-junta oa-m-atraso" cx="279" cy="227" r="9" />
    <path d="m204 236-9 27 28 7 11-31m32 0 8 28 29-8-13-25" fill="currentColor" fillOpacity="0.2" />
    <path d="m195 263-22 9 3 10 47-3v-9m51-3 1 12 48-1-2-12-18-7" fill="currentColor" fillOpacity="0.24" />
    <path d="m201 249 26 7m43-1 25-8m-110 29 29-1m70-2 27-1" strokeOpacity="0.6" />
    </g>
    </g>
    <path className="oa-m-fluxo" d="m111 143-13-26H76m273-29 19-25h25M242 212v23" strokeDasharray="3 4" strokeOpacity="0.45" />
    <circle cx="76" cy="117" r="2" /><circle cx="393" cy="63" r="2" />
  </Projecao>
}

function EscudoJessica({ className }: PropriedadesArte) {
  return <Projecao className={className} movimento="escudo-jessica" titulo="Estudo de Jessica Cruz: escudo floral de luz sólida com pétalas cristalinas">
    <g className="oa-m-corpo">
    <path d="M240 53 332 86 345 155Q329 229 240 264 151 229 135 155l13-69Z" fill="currentColor" fillOpacity="0.06" />
    <path className="oa-m-pulso" d="m240 65 81 29 11 61q-16 65-92 97-76-32-92-97l11-61Z" strokeOpacity="0.46" />
    <path d="M240 53v211m-92-178 92 61 92-61m-197 69 105-8 105 8m-105-8-67 71m67-71 67 71" strokeOpacity="0.2" />
    <g className="oa-m-petalas" fill="currentColor" fillOpacity="0.12">
      <path d="M240 149q-51-44 0-86 51 42 0 86Z" />
      <path d="M240 149q-6-67 60-61 6 66-60 61Z" />
      <path d="M240 149q44-51 86 0-42 51-86 0Z" />
      <path d="M240 149q67-6 61 60-66 6-61-60Z" />
      <path d="M240 149q51 44 0 86-51-42 0-86Z" />
      <path d="M240 149q6 67-60 61-6-66 60-61Z" />
      <path d="M240 149q-44 51-86 0 42-51 86 0Z" />
      <path d="M240 149q-67 6-61-60 66-6 61 60Z" />
    </g>
    <g className="oa-m-petalas oa-m-contra" strokeOpacity="0.55" strokeWidth="0.8">
      <path d="m240 63 11 46-11 40-12-39Zm60 25-25 42-35 19 20-37Zm26 61-45 12-41-12 42-12Zm-25 60-42-25-19-35 37 20Zm-61 26-12-45 12-41 12 42Zm-60-25 25-43 35-18-20 37Zm-26-61 45-12 41 12-42 12Zm25-60 43 25 18 35-37-20Z" />
    </g>
    </g>
    <circle className="oa-m-nucleo" cx="240" cy="149" r="23" fill="currentColor" fillOpacity="0.13" />
    <circle className="oa-m-nucleo oa-m-atraso" cx="240" cy="149" r="15" strokeWidth="1.8" />
    <path className="oa-m-nucleo" d="M229 129h22m-22 40h22m-24-41v9m26-9v9m-26 24v9m26-9v9" strokeWidth="2" />
    <path className="oa-m-fluxo" d="m135 155-17-9H93m252 9 19-11h23M240 53V36m0 228v10" strokeDasharray="3 4" strokeOpacity="0.6" />
    <path className="oa-m-pulso" d="M121 184a124 124 0 0 1 0-69m238-1a124 124 0 0 1 0 70" strokeOpacity="0.34" />
    <circle cx="93" cy="146" r="2" /><circle cx="387" cy="144" r="2" />
    <path className="oa-m-pulso oa-m-atraso" d="m178 247-14 8m152-8 14 8m-159-35-13 3m161-3 13 3" strokeOpacity="0.5" />
  </Projecao>
}

function ResgateSimon({ className }: PropriedadesArte) {
  return <Projecao className={className} movimento="resgate-simon" titulo="Estudo de Simon Baz: veículo de resgate de luz sólida em perspectiva">
    <g className="oa-m-suspensao">
    <path d="m96 173 76-33 42-49 101 8 39 58 33 19v43l-73 35-150-20-68-29Z" fill="currentColor" fillOpacity="0.12" />
    <path d="m96 173 143 21 115-37m-115 37 1 47 147-22m-291-46v32l68 29 76 7" />
    <path d="m172 140 111 14 71 3-39-58-101-8Z" fill="currentColor" fillOpacity="0.1" />
    <path d="m214 99 64 8 23 42-116-14Zm71 9 25-1 31 46-34-3Z" fill="currentColor" fillOpacity="0.2" />
    <path d="m278 107 5 47m-69-63 69 63m-111-14 67 54m44-40-44 40m44-40 6 73m65-70v48" strokeOpacity="0.55" />
    <path d="m105 174 52-23 70 13-47 25Z" fill="currentColor" fillOpacity="0.13" />
    <path className="oa-m-nucleo" d="m96 186 37 7v14l-37-13m111 10 24 3v15l-24-3m38-12 28-9v12l-28 10m105-42 28-10v11l-28 10" fill="currentColor" fillOpacity="0.3" />
    <path d="m143 197 52 7v16l-52-9Zm6 6 41 5m-41 0 41 5" strokeOpacity="0.7" />
    <path className="oa-m-nucleo oa-m-atraso" d="m302 167 19-6v16l14-5v15l-14 5v16l-19 6v-17l-14 5v-15l14-4Z" fill="currentColor" fillOpacity="0.27" />
    <path className="oa-m-sinal" d="m230 84 34 4 11 12-48-5Z" fill="currentColor" fillOpacity="0.3" />
    <path className="oa-m-sinal oa-m-atraso" d="m239 86-2 10m15-9-2 10m-22-20-9-7m50 12 10-5m-29 0 2-11" />
    <g fill="currentColor" fillOpacity="0.14">
      <ellipse cx="157" cy="224" rx="22" ry="27" transform="rotate(-14 157 224)" />
      <ellipse cx="337" cy="226" rx="19" ry="26" transform="rotate(15 337 226)" />
    </g>
    <ellipse cx="157" cy="224" rx="12" ry="16" transform="rotate(-14 157 224)" />
    <ellipse cx="337" cy="226" rx="10" ry="15" transform="rotate(15 337 226)" />
    <path className="oa-m-roda oa-m-roda-a" d="m151 211 10 26m-16-15 23 5" strokeOpacity="0.65" />
    <path className="oa-m-roda oa-m-roda-b" d="m341 213-7 25m-7-12 20-4" strokeOpacity="0.65" />
    <path d="m296 177 9-3m17-5 10-4" strokeOpacity="0.65" />
    </g>
    <path className="oa-m-fluxo" d="m103 226-30 8m60 15-29 8m117-14-33 12M316 92l22-18h39" strokeDasharray="9 5" strokeOpacity="0.4" />
    <circle cx="377" cy="74" r="2" />
  </Projecao>
}

function NaveAbin({ className }: PropriedadesArte) {
  return <Projecao className={className} movimento="nave-abin" titulo="Estudo de Abin Sur: nave interestelar de luz sólida com anéis orbitais">
    <g className="oa-m-voo">
    <path d="m109 204 50-56 79-40 137-4-83 69-99 48Z" fill="currentColor" fillOpacity="0.13" />
    <path d="m109 204 84 17 99-48 83-69-98 34Z" fill="currentColor" fillOpacity="0.2" />
    <path d="m159 148 34 73 45-113m-45 113 84-83 98-34m-137 4 39 30m-118 10 118-10" strokeOpacity="0.6" />
    <path className="oa-m-nucleo" d="m228 139 20-24 45-1-22 26-32 11Z" fill="currentColor" fillOpacity="0.28" />
    <path d="m248 115 8 28m-28-4 43 1m-32 11 17-8" />
    <path d="m173 154-8-65 23-14 50 33m-73-19 46 35m-23-49 23 49m-38 30 38-30" fill="currentColor" fillOpacity="0.12" />
    <path d="m246 196 56 30 41-22-51-31m-46 23 66 12 31-4m-31 4-10 18" fill="currentColor" fillOpacity="0.15" />
    <path d="m123 188-41-7 13-18 64-15m-64 15 35 13m63 45-5 27 22-4 36-48" fill="currentColor" fillOpacity="0.09" />
    <path className="oa-m-nucleo oa-m-atraso" d="m123 202 24 7 16-11-25-8Zm45 15 25 4 13-14-23-2Z" fill="currentColor" fillOpacity="0.35" />
    <path className="oa-m-fluxo" d="m127 205-35 18m80-3-34 22m-26-26-31 16m75-3-27 19" strokeOpacity="0.55" strokeDasharray="18 5" />
    </g>
    <ellipse className="oa-m-fluxo oa-m-fluxo-b" cx="242" cy="154" rx="162" ry="77" transform="rotate(-21 242 154)" strokeOpacity="0.24" strokeDasharray="50 7 4 7" />
    <path className="oa-m-pulso" d="M129 88c62-36 166-48 223-12m42 51c-6 45-71 100-149 124" strokeOpacity="0.5" />
    <path className="oa-m-pulso" d="m131 84-2 4 6 2m111 157-1 4 5 1" />
    <circle className="oa-m-nucleo" cx="353" cy="76" r="4" fill="currentColor" fillOpacity="0.3" />
    <circle cx="394" cy="127" r="3" /><circle cx="129" cy="88" r="2" />
    <path className="oa-m-pulso oa-m-atraso" d="m292 113 9-10m-31 66 10-5m-94-28 7 8m42 66 10 3" strokeWidth="2" />
    <path d="m207 66 17-17h47m81 155 22 18h28" strokeOpacity="0.4" />
    <circle cx="271" cy="49" r="2" /><circle cx="402" cy="222" r="2" />
  </Projecao>
}

/** Estudos autorais de luz sólida; os objetos não descrevem ocorrências canônicas. */
export const constructosHumanos = [
  { nome: 'Hal Jordan', titulo: 'Vetor de vontade', descricao: 'Estudo de um jato facetado: asas em projeção, carlinga translúcida e rastros de propulsão.', Arte: JatoHal },
  { nome: 'John Stewart', titulo: 'Arquitetura da luz', descricao: 'Estudo estrutural de uma ponte: tabuleiro, treliças, cabos e pilares revelam o caminho das forças.', Arte: PonteJohn },
  { nome: 'Guy Gardner', titulo: 'Impacto esmeralda', descricao: 'Estudo de um punho de boxe: volumes angulares, articulações e uma braçadeira de energia comprimida.', Arte: PunhoGuy },
  { nome: 'Kyle Rayner', titulo: 'Imaginação mecânica', descricao: 'Estudo de um mecha articulado: armadura prismática, núcleo luminoso e juntas expostas.', Arte: MechaKyle },
  { nome: 'Jessica Cruz', titulo: 'Coragem em flor', descricao: 'Estudo de um escudo floral: oito pétalas cristalinas se abrem em uma superfície de proteção.', Arte: EscudoJessica },
  { nome: 'Simon Baz', titulo: 'Rota de resgate', descricao: 'Estudo de um veículo de socorro: cabine transparente, rodas projetadas e sinalização de assistência.', Arte: ResgateSimon },
  { nome: 'Abin Sur', titulo: 'Travessia interestelar', descricao: 'Estudo de uma nave: casco de luz sólida, aletas prismáticas e arcos de navegação orbital.', Arte: NaveAbin },
]
