import { useId, type ReactNode } from 'react'

type ArteProps = { className?: string }

/** Base de projeção compartilhada; cada volume é um estudo artístico original. */
function Holograma({ titulo, movimento, className, children }: ArteProps & { titulo: string; movimento: string; children: ReactNode }) {
  const id = useId()
  return <svg className={className} data-oa-motion={movimento} viewBox="0 0 480 320" role="img" aria-labelledby={`${id}-titulo`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
    <title id={`${id}-titulo`}>{`${titulo} — estudo artístico de luz sólida`}</title>
    <defs>
      <radialGradient id={`${id}-aura`}>
        <stop stopColor="currentColor" stopOpacity=".13" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="240" cy="161" rx="194" ry="143" fill={`url(#${id}-aura)`} stroke="none" />
    <g className="oa-m-grade">
    <g opacity=".19" strokeWidth=".7">
      <path d="M83 252 240 211 397 252 240 300Z M122 262 279 221M161 273 318 231M201 283 357 242M123 242 280 283M162 232 319 273M201 222 358 262" />
      <path d="M81 76V52h24M375 52h24v24M81 219v24h24M375 243h24v-24" />
      <path d="M240 33V22M234 28h12M60 157H49M54 151v12M420 157h11M426 151v12" />
      <path className="oa-m-raios" d="m133 258 40-98M347 258l-40-98M193 270l24-79M287 270l-24-79" strokeDasharray="3 8" />
    </g>
    </g>
    <g opacity=".47">
      <ellipse cx="240" cy="265" rx="112" ry="23" />
      <ellipse className="oa-m-orbita" cx="240" cy="265" rx="92" ry="16" strokeDasharray="24 7 3 7" />
      <path d="M128 265v7c0 13 50 24 112 24s112-11 112-24v-7M157 281v7M323 281v7M240 288v8" />
      <path d="M109 265H94m292 0h-15M240 236v-7M240 300v6" />
    </g>
    <ellipse className="oa-m-varredura-plataforma" cx="240" cy="265" rx="112" ry="23" pathLength="100" strokeWidth="2.4" />
    {children}
    <g className="oa-m-sinais">
    <g opacity=".55" strokeWidth="1">
      <path d="M92 99h20m-20 5h11M368 205h20m-11 5h11M117 224h20" />
      <circle cx="116" cy="99" r="2" fill="currentColor" stroke="none" />
      <circle cx="364" cy="205" r="2" fill="currentColor" stroke="none" />
    </g>
    </g>
  </svg>
}

function MarteloKilowog({ className }: ArteProps) {
  return <Holograma className={className} movimento="kilowog-martelo" titulo="Kilowog · Martelo de impacto">
    <ellipse className="oa-m-impacto" cx="240" cy="265" rx="112" ry="23" strokeWidth="2.2" />
    <g className="oa-m-recuo">
    <g transform="rotate(-24 240 164)">
      <path d="M226 133h25v102l-12 17-13-9Z" fill="currentColor" fillOpacity=".15" />
      <path d="m226 133 10 7v102l-10-9M236 140l15-7M226 160h25m-25 14h25m-25 14h25m-25 14h25m-25 14h25" opacity=".65" />
    <g className="oa-m-pulso">
      <path d="m146 80 30-19h137l24 22v58l-29 18H170l-24-23Z" fill="currentColor" fillOpacity=".13" />
    </g>
      <path d="m146 80 28 20h139l24-17M174 100v59m139-59v55M146 80v56l28 23M176 61v24l-18 7M294 61v24l32 8" />
      <path d="M174 100h139v55H174Z" fill="currentColor" fillOpacity=".09" />
    <g className="oa-m-nucleo">
      <path d="m189 110 15 17-15 17m106-34-15 17 15 17M218 110h38v34h-38Z" opacity=".8" />
    </g>
    <g className="oa-m-nucleo oa-m-atraso">
      <path d="M220 115h34m-34 23h34M229 117v19m16-19v19" strokeWidth="3" />
    </g>
    <g className="oa-m-pulso oa-m-atraso">
      <path d="M135 78v59m-8-48v38M347 85v46m9-36v25" opacity=".37" />
    </g>
    </g>
    </g>
  </Holograma>
}

function InstrumentoSalaak({ className }: ArteProps) {
  return <Holograma className={className} movimento="salaak-astrolabio" titulo="Salaak · Astrolábio de quatro braços">
    <g className="oa-m-flutua">
    <g className="oa-m-pulso">
      <ellipse cx="240" cy="149" rx="112" ry="43" transform="rotate(-28 240 149)" opacity=".5" />
    </g>
      <ellipse className="oa-m-fluxo" cx="240" cy="149" rx="88" ry="67" transform="rotate(29 240 149)" strokeDasharray="4 5" opacity=".5" />
    <g className="oa-m-nucleo">
      <path d="m240 105 36 22v46l-36 22-36-22v-46Z" fill="currentColor" fillOpacity=".13" />
    </g>
      <path d="m204 127 36 23 36-23m-36 23v45M240 105v45" />
    <g className="oa-m-nucleo">
      <circle cx="240" cy="149" r="21" fill="currentColor" fillOpacity=".12" />
    </g>
    <g className="oa-m-articulacao">
      <path d="m210 123-31-35-40 8-7-18 53-13 44 45M268 123l31-35 40 8 7-18-53-13-44 45M210 174l-31 35-40-8-7 18 53 13 44-45M268 174l31 35 40-8 7 18-53 13-44-45" fill="currentColor" fillOpacity=".1" />
      <path d="m140 85 39-9 39 40m121-31-40-9-38 40m-121 94 39 10 39-40m121 30-40 10-38-40" opacity=".7" />
    <g className="oa-m-junta">
      <circle cx="132" cy="81" r="11" /><circle cx="347" cy="81" r="11" />
    </g>
      <circle cx="132" cy="216" r="11" /><circle cx="347" cy="216" r="11" />
      <path d="M122 81h20m-10-10v20m205-10h20m-10-10v20M122 216h20m-10-10v20m205-10h20m-10-10v20" opacity=".55" />
    </g>
    <g className="oa-m-nucleo oa-m-atraso">
      <circle cx="240" cy="149" r="7" fill="currentColor" fillOpacity=".45" />
    </g>
      <path d="M240 86V59m-6 5h12M240 211v24m-6-5h12" />
    </g>
  </Holograma>
}

function PrismaArisia({ className }: ArteProps) {
  return <Holograma className={className} movimento="arisia-prisma" titulo="Arisia Rrab · Prisma estelar">
    <circle className="oa-m-fluxo" cx="240" cy="145" r="99" opacity=".18" strokeDasharray="2 8" />
    <g className="oa-m-pulso">
    <ellipse cx="240" cy="145" rx="126" ry="32" transform="rotate(-18 240 145)" opacity=".45" />
    </g>
    <g className="oa-m-prisma">
    <path d="m240 39 23 72 76-19-50 58 50 59-76-19-23 72-24-72-75 19 50-59-50-58 75 19Z" fill="currentColor" fillOpacity=".1" />
    <g className="oa-m-nucleo">
    <path d="m240 67 35 66-35 88-36-88Z" fill="currentColor" fillOpacity=".17" />
    </g>
    <path d="m240 39 1 111 22-39m-22 39 48 0 50-58m-98 58 22 40 76 19m-98-59-1 112m1-112-25 40-75 19m100-59-50 0-50-58m100 58-25-39" />
    <path d="m204 133 36 17 35-17m-35 17v71M240 67v83" opacity=".65" />
    </g>
    <g className="oa-m-brilho">
    <path d="m123 62 4 9 9 4-9 4-4 9-4-9-9-4 9-4ZM359 204l4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" fill="currentColor" fillOpacity=".25" />
    </g>
    <g className="oa-m-pulso oa-m-atraso">
    <circle cx="325" cy="59" r="3" /><circle cx="157" cy="231" r="2" />
    </g>
  </Holograma>
}

function NaveTomarRe({ className }: ArteProps) {
  return <Holograma className={className} movimento="tomar-re-nave" titulo="Tomar-Re · Nave de asas solares">
    <g className="oa-m-voo">
    <g className="oa-m-asas">
    <path d="m240 61 27 64 126 44-41 21-96-22-16 65-17-65-95 22-41-21 126-44Z" fill="currentColor" fillOpacity=".11" />
    <g className="oa-m-nucleo">
    <path d="m240 61 0 172 16-65 11-43Zm0 42 17 42-17 24-18-24Z" fill="currentColor" fillOpacity=".2" />
    </g>
    <path d="m213 125-85 65 95-22m44-43 85 65-96-22M87 169l136-20m170 20-137-20M128 190l76-27m148 27-77-27" />
    <path d="m117 165 74-23-30 27m202-4-74-23 30 27M168 185l30-11m114 11-30-11" opacity=".65" />
    </g>
    <g className="oa-m-nucleo oa-m-atraso">
    <path d="m227 98 13-25 13 25-13 14Z" fill="currentColor" fillOpacity=".27" />
    </g>
    <g className="oa-m-pulso">
    <path d="m206 191-9 30m19-24-4 37m62-43 9 30m-19-24 4 37" opacity=".7" />
    </g>
    </g>
    <ellipse className="oa-m-fluxo" cx="240" cy="157" rx="157" ry="67" strokeDasharray="35 8 3 8" opacity=".23" />
    <g className="oa-m-pulso oa-m-atraso">
    <path d="M240 40v-8M106 137l-15-5m283 5 15-5" opacity=".6" />
    </g>
  </Holograma>
}

function EscudoKatma({ className }: ArteProps) {
  return <Holograma className={className} movimento="katma-egide" titulo="Katma Tui · Égide e lâmina">
    <g className="oa-m-escudo">
    <path d="m222 58 86 27-10 95-76 67-76-67-10-95Z" fill="currentColor" fillOpacity=".11" />
    <path d="m222 76 67 22-9 72-58 55-58-55-9-72Z" fill="currentColor" fillOpacity=".08" />
    <path d="M222 58v189m-86-162 86 39 86-39m-86 39-76 56m76-56 76 56" opacity=".65" />
    <g className="oa-m-nucleo">
    <path d="m222 99 24 36-24 43-24-43Z" fill="currentColor" fillOpacity=".23" />
    </g>
    <g className="oa-m-nucleo oa-m-atraso">
    <path d="m222 99 0 79m-24-43h48" />
    </g>
    </g>
    <g className="oa-m-lamina">
    <g transform="rotate(30 313 151)">
      <path d="m313 43 12 32-5 101-7 17-7-17-5-101Z" fill="currentColor" fillOpacity=".18" />
      <path d="M313 43v150m-28-3h56l-7 10h-42ZM308 200h10v38h-10Z" fill="currentColor" fillOpacity=".13" />
      <path d="M309 209h8m-8 10h8m-8 10h8" />
      <circle cx="313" cy="244" r="6" />
    </g>
    </g>
    <g className="oa-m-pulso">
    <path d="m127 106-4 65 26 28M148 211l22 18" opacity=".35" />
    </g>
  </Holograma>
}

function InstrumentoSoranik({ className }: ArteProps) {
  return <Holograma className={className} movimento="soranik-camara" titulo="Soranik Natu · Câmara de diagnóstico">
    <ellipse className="oa-m-fluxo oa-m-fluxo-b" cx="240" cy="117" rx="105" ry="62" opacity=".35" strokeDasharray="15 6" />
    <path d="M146 117v65c0 36 42 65 94 65s94-29 94-65v-65" fill="currentColor" fillOpacity=".05" />
    <ellipse cx="240" cy="117" rx="94" ry="53" />
    <ellipse cx="240" cy="117" rx="76" ry="40" opacity=".65" />
    <ellipse className="oa-m-varredura-vertical" cx="240" cy="117" rx="94" ry="53" strokeWidth="2.2" />
    <path className="oa-m-fluxo" d="M146 147c0 35 42 64 94 64s94-29 94-64M146 178c0 35 42 64 94 64s94-29 94-64" opacity=".38" strokeDasharray="3 5" />
    <g className="oa-m-nucleo">
    <path d="M224 87h32v33h32v31h-32v33h-32v-33h-32v-31h32Z" fill="currentColor" fillOpacity=".16" />
    </g>
    <g className="oa-m-pulso">
    <path d="m256 87 10-7h-32l-10 7m42-7v33h32v31l-10 7m10-38-10 7m-22-7-10 7" opacity=".6" />
    </g>
    <path d="M86 165h54l12-16 13 37 15-59 17 57 12-19h55" strokeWidth="2" />
    <path className="oa-m-eletro" d="M86 165h54l12-16 13 37 15-59 17 57 12-19h55" pathLength="100" strokeWidth="3" />
    <g className="oa-m-pulso oa-m-atraso">
    <path d="M357 97v82m-6-82h12m-12 20h8m-8 21h12m-12 20h8m-8 21h12" opacity=".5" />
    </g>
    <g className="oa-m-nucleo">
    <circle cx="240" cy="230" r="4" fill="currentColor" fillOpacity=".5" />
    </g>
  </Holograma>
}

function JaulaSinestro({ className }: ArteProps) {
  return <Holograma className={className} movimento="sinestro-prisao" titulo="Sinestro · Prisão poliédrica">
    <g className="oa-m-respira">
    <path d="m240 42 93 48 0 111-93 49-93-49V90Z" fill="currentColor" fillOpacity=".06" />
    <path d="m147 90 93 52 93-52m-93 52v108M240 42v105m-93 54 93-54 93 54" />
    <path d="m240 65 73 38v85l-73 39-73-39v-85Z" opacity=".6" />
    <g className="oa-m-barras">
    <path d="M167 103v85m18-75v84m18-74v84m19-74v84m36-84v84m19-94v84m18-94v84m18-94v85" strokeWidth="2.5" opacity=".7" />
    </g>
    <path d="m147 122 93 51 93-51m-186 39 93 51 93-51m-166 27 73-41 73 41" opacity=".55" />
    <path d="m240 42 93 48-20 13-73-38-73 38-20-13Zm-93 159 93 49 93-49-20-13-73 39-73-39Z" fill="currentColor" fillOpacity=".15" />
    </g>
    <g className="oa-m-tensao">
    <g className="oa-m-nucleo">
    <circle cx="240" cy="146" r="17" fill="currentColor" fillOpacity=".17" />
    <path d="m234 142 6-5 6 5v10h-12Zm6-5v-5" />
    </g>
    </g>
    <path className="oa-m-fluxo" d="M134 90v112m212-112v112" opacity=".3" strokeDasharray="2 6" />
  </Holograma>
}

function LaminasLaira({ className }: ArteProps) {
  return <Holograma className={className} movimento="laira-laminas" titulo="Laira · Lâminas em órbita">
    <ellipse className="oa-m-fluxo" cx="240" cy="156" rx="126" ry="81" transform="rotate(-20 240 156)" opacity=".25" strokeDasharray="29 8 3 8" />
    <g className="oa-m-orbitando">
    <g transform="rotate(-35 240 151)">
      <path d="M197 46c-41 37-57 109-24 147l21-6c-21-45-18-85 3-141Z" fill="currentColor" fillOpacity=".15" />
      <path d="M197 46c-28 60-29 101-13 141M173 193l9 18 19-8-7-16Z" fill="currentColor" fillOpacity=".23" />
      <path d="m183 208 16 40 10-5-15-40m5 45 8 5 8-4-6-6" />
      <path d="M283 46c41 37 57 109 24 147l-21-6c21-45 18-85-3-141Z" fill="currentColor" fillOpacity=".15" />
      <path d="M283 46c28 60 29 101 13 141m11 6-9 18-19-8 7-16Z" fill="currentColor" fillOpacity=".23" />
      <path d="m297 208-16 40-10-5 15-40m-5 45-8 5-8-4 6-6" />
      <path d="m160 119-5 24m168-24 5 24M191 218l8-4m-4 12 7-3m87-5-8-4m4 12-7-3" opacity=".65" />
    </g>
    </g>
    <g className="oa-m-nucleo">
    <path d="m236 140 9-6 9 6v12l-9 6-9-6Z" opacity=".6" />
    </g>
  </Holograma>
}

function EstilingueChp({ className }: ArteProps) {
  return <Holograma className={className} movimento="chp-estilingue" titulo="Ch'p · Estilingue de bolota">
    <g className="oa-m-forquilha">
    <path d="m201 238 12-86-48-61 22-20 51 57 45-63 24 19-43 72-7 88Z" fill="currentColor" fillOpacity=".13" />
    <path d="m187 71 41 77-15 88m70-171-30 84-8 93M228 148l25 1 11 7m-51-4 15-4" />
    </g>
    <path className="oa-m-elastico" d="m165 91 77 10 65-17m-120-13 54 27 42-33" strokeWidth="3" />
    <g className="oa-m-pulso">
    <path d="m214 205 39 5m-41 5 40 5m-41 5 40 5m-40 4 40 5" opacity=".65" />
    </g>
    <g className="oa-m-bolota">
    <path d="M221 88c-4-17 5-31 21-32 17-1 26 14 23 30l-21 21Z" fill="currentColor" fillOpacity=".17" />
    <path d="M216 64c7-17 40-20 53-3l-5 10-43 2Z" fill="currentColor" fillOpacity=".24" />
    <path d="m239 50 5-13 8 2-7 12m-22 10 9 10m0-15 12 14m0-15 13 14M242 76l2 31" />
    </g>
    <path className="oa-m-fluxo" d="M320 120c39 30 31 74-12 100m12-82c22 21 16 49-8 65M145 115l-10 16m16-5-10 16" opacity=".38" strokeDasharray="3 5" />
    <g className="oa-m-pulso oa-m-atraso">
    <circle cx="335" cy="83" r="4" /><circle cx="151" cy="215" r="3" />
    </g>
  </Holograma>
}

function MachadoBoodikka({ className }: ArteProps) {
  return <Holograma className={className} movimento="boodikka-machado" titulo="Boodikka · Machado de cerco">
    <ellipse className="oa-m-impacto" cx="240" cy="265" rx="112" ry="23" strokeWidth="2.2" />
    <g className="oa-m-recuo">
    <g transform="rotate(20 240 157)">
      <path d="M232 47h16v197l-8 11-8-11Z" fill="currentColor" fillOpacity=".2" />
      <path d="M240 47v208m-8-41h16m-16 10h16m-16 10h16m-16 10h16" />
      <path d="M228 88c-43 1-62-19-78-35 7 31-1 73-23 103 29 21 68 13 101-4ZM252 88c43 1 62-19 78-35-7 31 1 73 23 103-29 21-68 13-101-4Z" fill="currentColor" fillOpacity=".13" />
      <path d="M150 53c24 40 10 82-23 103m203-103c-24 40-10 82 23 103M159 91l69 22-65 32m158-54-69 22 65 32" />
    <g className="oa-m-pulso">
      <path d="m171 89 4 49 53-25m81-24-4 49-53-25" fill="currentColor" fillOpacity=".12" />
    </g>
    <g className="oa-m-nucleo">
      <path d="m222 97 18-11 18 11v41l-18 11-18-11Z" fill="currentColor" fillOpacity=".2" />
    </g>
    <g className="oa-m-pulso oa-m-atraso">
      <path d="m222 97 18 11 18-11m-18 11v41" />
    </g>
    <g className="oa-m-pulso">
      <path d="M118 149c16-28 23-54 21-79m223 79c-16-28-23-54-21-79" opacity=".35" />
    </g>
    </g>
    </g>
  </Holograma>
}

function EscudoKeHaan({ className }: ArteProps) {
  return <Holograma className={className} movimento="kehaan-bastiao" titulo="Ke'Haan · Bastião de aríete">
    <ellipse className="oa-m-impacto" cx="240" cy="265" rx="112" ry="23" strokeWidth="2.2" />
    <g className="oa-m-golpe">
    <path d="m240 80 77 27-8 85-69 52-69-52-8-85Z" fill="currentColor" fillOpacity=".12" />
    <path d="m240 97 59 21-8 64-51 42-51-42-8-64Z" />
    <path d="M240 80v164m-77-137 77 47 77-47m-77 47-69 38m69-38 69 38" opacity=".55" />
    <path className="oa-m-chifres" d="M216 130c-40-3-73-37-50-65 16-20 45-10 40 10-3 12-21 16-29 3 1 23 26 33 47 27M264 130c40-3 73-37 50-65-16-20-45-10-40 10 3 12 21 16 29 3-1 23-26 33-47 27" fill="currentColor" fillOpacity=".16" />
    <g className="oa-m-nucleo">
    <path d="m224 106 16 15 16-15 9 38-25 48-25-48Z" fill="currentColor" fillOpacity=".16" />
    </g>
    <g className="oa-m-nucleo oa-m-atraso">
    <path d="m215 144 25 10 25-10m-25-23v71m-24-62 12 8m36-8-12 8m-18 33h12" />
    </g>
    <g className="oa-m-pulso">
    <path d="M160 207l28 21m132-21-28 21M137 126l6 56m194-56-6 56" opacity=".4" />
    </g>
    <g className="oa-m-nucleo">
    <circle cx="240" cy="207" r="4" />
    </g>
    </g>
  </Holograma>
}

function PunhoHannu({ className }: ArteProps) {
  return <Holograma className={className} movimento="hannu-punho" titulo="Hannu · Punho monolítico">
    <ellipse className="oa-m-impacto" cx="240" cy="265" rx="112" ry="23" strokeWidth="2.2" />
    <g className="oa-m-soco">
    <path d="m176 113 16-34 32-8 20 10 26-12 25 14 24 0 17 26-2 58-25 47-14 31-75 1-22-33-31-24-13-43Z" fill="currentColor" fillOpacity=".14" />
    <path d="m192 79 5 62 23 18 4-88m20 10-1 72 26-5 1-79m25 14-4 61 25-12 3-49m-95 76 19-6 26-5 22-4 25-12 20-23" />
    <path d="m176 113 21 28-9 27 20 28 21-5 20-29 22-2 14 24-17 25-48 37m-66-100 34 22m20 28 12 50m75-1-27-36 41 5M285 184l24 30" />
    <g className="oa-m-nucleo">
    <path d="m167 189 21-21 20 28-10 17m22 33 48-37 27 36" fill="currentColor" fillOpacity=".15" />
    </g>
    <g className="oa-m-pulso">
    <path d="m207 95 4 31m45-35-3 38m30-30-2 26m43-21-1 15M227 211l12-11m-8 29 13-13" opacity=".6" />
    </g>
    <g className="oa-m-pulso oa-m-atraso">
    <path d="m137 141-15-12m12 40-18-3m229-30 16-13m-17 39 20-3" opacity=".45" />
    </g>
    <g className="oa-m-pulso">
    <path d="m181 56 8-12m153 153 14 8" strokeWidth="2.5" opacity=".4" />
    </g>
    </g>
  </Holograma>
}

function DragaoIsamot({ className }: ArteProps) {
  return <Holograma className={className} movimento="isamot-draco" titulo="Isamot Kol · Draco de luz">
    <g className="oa-m-corpo">
    <g className="oa-m-asas">
    <path d="m237 146-26-51-62-46 8 53-51 16 70 20 39 42m33-39 24-53 59-43-6 55 48 18-69 19-37 44" fill="currentColor" fillOpacity=".1" />
    <path d="m149 49 45 72-37-19m37 19-88-3m88 3 21 59m116-135-43 75 37-20m-37 20 85-2m-85 2-21 61" opacity=".75" />
    </g>
    <path d="m219 112 12-26-6-26 21 17 21-16-6 26 15 22-20 19 6 41 26 40-25 20-32-18-12-41Z" fill="currentColor" fillOpacity=".16" />
    <path d="m231 86 16 10 14-9m-42 25 28-16 29 13-29 15-28-12m28 12-3 43 19 42-32 2m13-44-25 3m43-1 21 8-8 18m-56-26-21 10 9 17" />
    <path className="oa-m-cauda" d="M263 229c58 15 87-17 64-35-13-10-27-5-28 6 16-8 21 8 5 12l-16-3" fill="currentColor" fillOpacity=".12" />
    <g className="oa-m-nucleo">
    <path d="m233 105 5 2m19-3-5 3m-11 22-10 8 12 8-11 9 12 8" strokeWidth="2" />
    </g>
    <path d="m225 210-26 12 10 10 22-5m32-2 16 14 11-5-7-11" />
    </g>
    <g className="oa-m-pulso">
    <path d="m244 60 0-16m-8 4 8-8 8 8" opacity=".35" />
    </g>
  </Holograma>
}

function JardimMedphyll({ className }: ArteProps) {
  return <Holograma className={className} movimento="medphyll-jardim" titulo="Medphyll · Jardim orbital">
    <g className="oa-m-pulso">
    <ellipse cx="240" cy="218" rx="80" ry="22" fill="currentColor" fillOpacity=".08" />
    </g>
    <g className="oa-m-brotar">
    <path d="M240 231c-21-26-11-51-4-76s-14-58 5-88M235 183c-31-4-57-24-60-58m65 80c34-9 47-29 54-65M234 151c24-14 36-37 36-59" strokeWidth="3" />
    <g className="oa-m-folhas">
    <path d="M236 117c-31-1-53-17-44-48 29 2 48 21 44 48Zm5-26c-7-27 1-51 26-56 10 27-1 49-26 56ZM215 167c-33 11-63-4-66-34 33-8 58 2 66 34ZM271 185c-8-33 7-58 37-60 5 31-10 53-37 60ZM258 130c-3-25 12-43 37-43 0 25-13 40-37 43Z" fill="currentColor" fillOpacity=".14" />
    </g>
    <path d="m192 69 44 48m5-26 26-56m-118 98 66 34m56 18 37-60m-50 5 37-43" />
    <path d="m208 88 0 15 17-1m26-44 3 13 12-8m-96 79 7 17 19-6m92-7 3 19 12-11m-31-49 4 12 13-7" opacity=".65" />
    </g>
    <g className="oa-m-pulso oa-m-atraso">
    <path d="M240 231c-40 10-59 8-65-3m65 3c24 14 54 14 66 2m-66-2-22 15m22-15 14 16" opacity=".7" />
    </g>
    <ellipse className="oa-m-fluxo" cx="240" cy="151" rx="113" ry="86" transform="rotate(22 240 151)" opacity=".25" strokeDasharray="12 8" />
    <g className="oa-m-brilho">
    <circle cx="137" cy="112" r="4" /><circle cx="322" cy="190" r="3" />
    </g>
  </Holograma>
}

function SinoRotLopFan({ className }: ArteProps) {
  return <Holograma className={className} movimento="rot-lop-fan-sino" titulo="Rot Lop Fan · Sino de ressonância">
    <g className="oa-m-sino">
    <path d="M188 100c0-30 104-30 104 0l6 68 22 33c-21 33-139 33-160 0l22-33Z" fill="currentColor" fillOpacity=".11" />
    <ellipse cx="240" cy="100" rx="52" ry="20" />
    <path d="M188 100c8 23 97 23 104 0M182 168c13 25 103 25 116 0M160 201c31 17 130 17 160 0" />
    <ellipse cx="240" cy="206" rx="65" ry="15" fill="currentColor" fillOpacity=".09" />
    <path d="M213 84V65c0-23 54-23 54 0v19m-42-4V66c0-10 30-10 30 0v14M240 123v88m-11 3 11-10 11 10-11 16Z" fill="currentColor" fillOpacity=".15" />
    <path d="M205 116v53m70-53v53M217 123v48m46-48v48" opacity=".4" />
    </g>
    <g className="oa-m-ressoa">
    <path d="M150 106c-31 22-31 72 0 94m180-94c31 22 31 72 0 94M129 88c-47 35-47 95 0 130m222-130c47 35 47 95 0 130M109 69c-63 48-63 120 0 166m262-166c63 48 63 120 0 166" opacity=".45" />
    </g>
    <g className="oa-m-pulso">
    <path d="M83 139v26m12-35v43m290-43v43m12-34v26" opacity=".7" strokeWidth="2" />
    </g>
    <g className="oa-m-brilho">
    <path d="M199 61h9m-4-5v10m69-5h9m-4-5v10" opacity=".5" />
    </g>
  </Holograma>
}

function AsasBzzd({ className }: ArteProps) {
  return <Holograma className={className} movimento="bzzd-asas" titulo="Bzzd · Asas de microcosmo">
    <g className="oa-m-asas">
    <path d="M228 131C170 40 88 52 111 107c16 38 75 52 117 42ZM252 131C310 40 392 52 369 107c-16 38-75 52-117 42Z" fill="currentColor" fillOpacity=".13" />
    <path d="M227 153c-66-4-111 49-75 67 32 16 59-22 78-50m23-17c66-4 111 49 75 67-32 16-59-22-78-50" fill="currentColor" fillOpacity=".1" />
    <path d="m228 143-117-36 62-21 55 57m-55-57 6 42m-68-21 48 33 20-12m73 15 117-36-62-21-55 57m55-57-6 42m68-21-48 33-20-12m-73 32-76 58 38-9 38-49m25 0 76 58-38-9-38-49" opacity=".75" />
    </g>
    <g className="oa-m-corpo">
    <path d="m230 125 10-12 10 12 7 40-17 61-17-61Z" fill="currentColor" fillOpacity=".23" />
    <path d="M240 113v113m-14-76h28m-30 14h32m-28 14h24m-20 14h16m-12 14h8" />
    <g className="oa-m-nucleo">
    <circle cx="240" cy="106" r="13" fill="currentColor" fillOpacity=".2" />
    </g>
    <path d="m232 96-12-18-8 3m36 15 12-18 8 3m-43 55-20 13-8 26m58-39 20 13 8 26m-58-13-13 26-3 23m46-49 13 26 3 23" />
    </g>
    <ellipse className="oa-m-fluxo" cx="240" cy="148" rx="163" ry="102" strokeDasharray="3 10" opacity=".22" />
  </Holograma>
}

function EscudoTomarTu({ className }: ArteProps) {
  return <Holograma className={className} movimento="tomar-tu-escudo" titulo="Tomar-Tu · Escudo de plumagem">
    <g className="oa-m-corpo">
    <path d="m240 62 81 28 20 62-36 62-65 34-65-34-36-62 20-62Z" fill="currentColor" fillOpacity=".08" />
    <g className="oa-m-pulso">
    <path d="m240 78 68 25 16 48-32 52-52 28-52-28-32-52 16-48Z" />
    </g>
    <g className="oa-m-penas">
    <path d="m240 105-26 26 8 29-47-37 14 45 42 31 9 32 9-32 42-31 14-45-47 37 8-29Z" fill="currentColor" fillOpacity=".17" />
    <path d="m240 105 0 126m-26-100 26 14 26-14m-26 14 18 15-18 20-18-20Z" />
    <path d="m175 123 56 76m-47-48 44 30m-39-13 42 13m74-58-56 76m47-48-44 30m39-13-42 13" />
    </g>
    <g className="oa-m-pulso oa-m-atraso">
    <path d="m159 90 29 25m133-25-29 25m-117 99 23-28m107 28-23-28M240 62v16" opacity=".55" />
    </g>
    <g className="oa-m-nucleo">
    <path d="m214 131 10-2 7 7m35-5-10-2-7 7M233 153l7 10 7-10" strokeWidth="2" />
    </g>
    <g className="oa-m-pulso">
    <path d="M126 146v25l27 43m201-68v25l-27 43" opacity=".3" />
    </g>
    </g>
  </Holograma>
}

function LancaVath({ className }: ArteProps) {
  return <Holograma className={className} movimento="vath-lanca" titulo="Vath Sarn · Lança de vanguarda">
    <g className="oa-m-lanca">
    <g transform="rotate(35 240 154)">
      <path d="m240 30 30 62-18 36h-24l-18-36Z" fill="currentColor" fillOpacity=".16" />
      <path d="M240 30v98m-30-36 30 17 30-17m-30 17-12 19m12-19 12 19" />
      <path d="M234 128h12v119h-12Z" fill="currentColor" fillOpacity=".18" />
      <path d="M240 128v119m-6-106h12m-12 13h12m-12 13h12m-12 13h12m-12 13h12m-12 13h12m-12 13h12m-12 13h12" opacity=".7" />
      <path d="m228 128-26-13-6 11 30 19h28l30-19-6-11-26 13m-18 119-8 14 14 17 14-17-8-14Z" fill="currentColor" fillOpacity=".12" />
      <path d="m214 76-9 21 13 25m48-46 9 21-13 25M240 247v31" opacity=".5" />
    </g>
    </g>
    <g className="oa-m-pulso">
    <path d="m141 144 17-23 10 32-17 23Zm172 31 17-23 10 32-17 23Z" fill="currentColor" fillOpacity=".08" />
    </g>
    <path className="oa-m-fluxo" d="m158 121-7 55m179-24-7 55M120 192l34-47m165-27 34-47" opacity=".35" strokeDasharray="3 5" />
    <ellipse className="oa-m-fluxo oa-m-fluxo-b" cx="240" cy="158" rx="101" ry="68" transform="rotate(-26 240 158)" strokeDasharray="42 13" opacity=".22" />
  </Holograma>
}

/** Estudos para a galeria; os objetos não são afirmações sobre o cânone. */
export const constructosCosmicos = [
  { nome: 'Kilowog', titulo: 'Martelo de impacto', descricao: 'Estudo de massa e potência: cabeça facetada, cabo reforçado e núcleo de luz sólida.', Arte: MarteloKilowog },
  { nome: 'Salaak', titulo: 'Astrolábio de quatro braços', descricao: 'Estudo de precisão orbital em quatro eixos, com articulações e um núcleo poliédrico suspenso.', Arte: InstrumentoSalaak },
  { nome: 'Arisia Rrab', titulo: 'Prisma estelar', descricao: 'Estudo de uma estrela cristalina: seis pontas irradiam de um prisma atravessado por uma órbita.', Arte: PrismaArisia },
  { nome: 'Tomar-Re', titulo: 'Nave de asas solares', descricao: 'Estudo de voo com perfil aviano, fuselagem de cristal e asas abertas em planos de energia.', Arte: NaveTomarRe },
  { nome: 'Katma Tui', titulo: 'Égide e lâmina', descricao: 'Estudo de equilíbrio entre proteção e precisão, com um escudo prismático e uma lâmina suspensa.', Arte: EscudoKatma },
  { nome: 'Soranik Natu', titulo: 'Câmara de diagnóstico', descricao: 'Estudo de um instrumento médico holográfico, com planos de varredura e sinal de monitoramento.', Arte: InstrumentoSoranik },
  { nome: 'Sinestro', titulo: 'Prisão poliédrica', descricao: 'Estudo geométrico de contenção: uma grade hexagonal envolve um núcleo sob tensão.', Arte: JaulaSinestro },
  { nome: 'Laira', titulo: 'Lâminas em órbita', descricao: 'Estudo de movimento contido em duas lâminas curvas, espelhadas ao redor de um pequeno núcleo.', Arte: LaminasLaira },
  { nome: "Ch'p", titulo: 'Estilingue de bolota', descricao: 'Estudo lúdico de um estilingue bifurcado com uma bolota facetada pronta para a projeção.', Arte: EstilingueChp },
  { nome: 'Boodikka', titulo: 'Machado de cerco', descricao: 'Estudo de força em duas lâminas largas, com arestas curvas e encaixe central de cristal.', Arte: MachadoBoodikka },
  { nome: "Ke'Haan", titulo: 'Bastião de aríete', descricao: 'Estudo de defesa com uma cabeça de aríete geométrica e chifres envolvendo a face do escudo.', Arte: EscudoKeHaan },
  { nome: 'Hannu', titulo: 'Punho monolítico', descricao: 'Estudo de um punho esculpido em fragmentos translúcidos, com juntas e fraturas de luz.', Arte: PunhoHannu },
  { nome: 'Isamot Kol', titulo: 'Draco de luz', descricao: 'Estudo de uma criatura alada: membranas trianguladas, cauda em espiral e corpo de cristal.', Arte: DragaoIsamot },
  { nome: 'Medphyll', titulo: 'Jardim orbital', descricao: 'Estudo de crescimento vegetal em luz sólida, com folhas facetadas, raízes e ramos entrelaçados.', Arte: JardimMedphyll },
  { nome: 'Rot Lop Fan', titulo: 'Sino de ressonância', descricao: 'Estudo sonoro de um sino suspenso, com ondas concêntricas convertidas em linhas de luz.', Arte: SinoRotLopFan },
  { nome: 'Bzzd', titulo: 'Asas de microcosmo', descricao: 'Estudo de escala: quatro asas com nervuras prismáticas cercam um corpo diminuto de energia.', Arte: AsasBzzd },
  { nome: 'Tomar-Tu', titulo: 'Escudo de plumagem', descricao: 'Estudo de uma égide aviana, com penas angulares sobrepostas e um eixo central de cristal.', Arte: EscudoTomarTu },
  { nome: 'Vath Sarn', titulo: 'Lança de vanguarda', descricao: 'Estudo de uma lança longa com ponta facetada e aletas de estabilização em planos de luz.', Arte: LancaVath },
]
