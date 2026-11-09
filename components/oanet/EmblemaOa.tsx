import { useId } from "react";

type EmblemaOaProps = { className?: string };

const marcas = Array.from({ length: 72 }, (_, posicao) => ({
  id: `marca-${posicao * 5}`,
  angulo: posicao * 5,
  principal: posicao % 6 === 0,
}));

/** Emblema da Tropa inscrito em um instrumento vetorial de navegação. [COMP-08] */
export function EmblemaOa({ className }: EmblemaOaProps) {
  const id = useId().replace(/:/g, "");
  const halo = `${id}-halo`;
  const metal = `${id}-metal`;
  const brilho = `${id}-brilho`;

  return (
    <svg viewBox="0 0 400 400" className={className} data-oa-motion="emblema" aria-hidden="true" focusable="false" fill="none">
      <defs>
        <radialGradient id={halo}>
          <stop stopColor="var(--oa-energy)" stopOpacity=".24" />
          <stop offset=".58" stopColor="var(--oa-energy)" stopOpacity=".06" />
          <stop offset="1" stopColor="var(--oa-energy)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={metal} x1="90" y1="80" x2="310" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--oa-text)" />
          <stop offset=".35" stopColor="var(--oa-energy)" />
          <stop offset=".72" stopColor="var(--oa-energy-dim)" />
          <stop offset="1" stopColor="var(--oa-energy)" />
        </linearGradient>
        <filter id={brilho} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="luz" />
          <feMerge><feMergeNode in="luz" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle className="oa-vec-emblema-halo" cx="200" cy="200" r="196" fill={`url(#${halo})`} />
      <g stroke="var(--oa-energy)" strokeWidth=".65">
        <circle cx="200" cy="200" r="178" opacity=".35" />
        <circle cx="200" cy="200" r="166" opacity=".2" />
        <g className="oa-vec-emblema-pontilhado"><circle cx="200" cy="200" r="153" strokeDasharray="2 8" opacity=".55" /></g>
        <g className="oa-vec-emblema-cardeais"><path d="M200 7v28M200 365v28M7 200h28M365 200h28" opacity=".8" /></g>
        <path d="m62 62 19 19m238 238 19 19M62 338l19-19M319 81l19-19" opacity=".45" />
        <g className="oa-vec-emblema-marcas">
          {marcas.map(({ id: marcaId, angulo, principal }) => (
            <path key={marcaId} d={`M200 22v${principal ? 12 : 5}`} transform={`rotate(${angulo} 200 200)`} opacity={principal ? ".9" : ".35"} />
          ))}
        </g>
      </g>
      <g className="oa-vec-emblema-varredura" stroke="var(--oa-energy)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M200 29A171 171 0 0 1 285.5 51.9" opacity=".8" />
        <path d="M200 29A171 171 0 0 1 285.5 51.9" opacity=".45" transform="rotate(180 200 200)" />
      </g>
      <g className="oa-emblema-orbita oa-vec-emblema-orbita" stroke="var(--oa-energy)" strokeWidth="2">
        <circle cx="200" cy="200" r="171" strokeDasharray="92 177 42 120 92 177 42 332" transform="rotate(-24 200 200)" opacity=".65" />
        <circle cx="200" cy="200" r="145" strokeDasharray="160 71 32 193" transform="rotate(41 200 200)" opacity=".45" />
      </g>
      <g stroke="var(--oa-line)" strokeWidth="1">
        <path d="M67 155h25l13-13M67 245h25l13 13M333 155h-25l-13-13M333 245h-25l-13 13M155 67v25l-13 13M245 333v-25l13-13" />
        <path d="M51 189v22M349 189v22M189 51h22M189 349h22" />
      </g>
      <circle cx="200" cy="200" r="125" fill="var(--oa-ink)" fillOpacity=".75" stroke="var(--oa-energy)" strokeOpacity=".4" />
      <circle cx="200" cy="200" r="117" stroke="var(--oa-energy)" strokeOpacity=".15" />
      <g filter={`url(#${brilho})`} fill={`url(#${metal})`}>
        <path d="M134 108h132v26H134zM134 266h132v26H134z" />
        <path fillRule="evenodd" d="M200 126a74 74 0 1 0 0 148 74 74 0 0 0 0-148Zm0 25a49 49 0 1 1 0 98 49 49 0 0 1 0-98Z" />
      </g>
      <g stroke="var(--oa-text)" strokeOpacity=".65" strokeWidth=".8">
        <path d="M139 112h122M139 270h122M153 172a53 53 0 0 1 70-20" />
      </g>
      <g className="oa-vec-emblema-losangos" fill="var(--oa-energy)">
        <path d="m200 37 3 5-3 5-3-5zM200 353l3 5-3 5-3-5zM37 200l5-3 5 3-5 3zM353 200l5-3 5 3-5 3z" />
        <circle cx="82" cy="82" r="2" /><circle cx="318" cy="318" r="2" />
      </g>
    </svg>
  );
}
