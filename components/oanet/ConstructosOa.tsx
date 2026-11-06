import { useId } from "react";

type ConstructoOaProps = { className?: string };

const aletas = [-84, -56, -28, 28, 56, 84].map((x) => ({ id: `aleta-${x}`, x }));
const marcasBase = Array.from({ length: 24 }, (_, posicao) => {
  const angulo = posicao * Math.PI / 12;
  return {
    id: `base-${posicao}`,
    // Precisão explícita mantém a hidratação estável entre motores JavaScript.
    percurso: `M${(260 + Math.cos(angulo) * 200).toFixed(4)} ${(520 + Math.sin(angulo) * 41).toFixed(4)}L${(260 + Math.cos(angulo) * 190).toFixed(4)} ${(520 + Math.sin(angulo) * 38).toFixed(4)}`,
  };
});

/** Bateria de energia construída em faces vetoriais, com núcleo e aro metálico. [COMP-08] */
export function BateriaOa({ className }: ConstructoOaProps) {
  const id = useId().replace(/:/g, "");
  const metal = `${id}-metal`;
  const borda = `${id}-borda`;
  const nucleo = `${id}-nucleo`;
  const atmosfera = `${id}-atmosfera`;
  const luz = `${id}-luz`;

  return (
    <svg viewBox="0 0 520 600" className={className} fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={metal} x1="140" y1="210" x2="366" y2="420" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--oa-energy-dim)" /><stop offset=".22" stopColor="var(--oa-surface)" />
          <stop offset=".49" stopColor="var(--oa-line)" /><stop offset=".7" stopColor="var(--oa-ink)" />
          <stop offset="1" stopColor="var(--oa-energy-dim)" />
        </linearGradient>
        <linearGradient id={borda} x1="110" y1="145" x2="398" y2="432" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--oa-text)" /><stop offset=".2" stopColor="var(--oa-energy)" />
          <stop offset=".48" stopColor="var(--oa-energy-dim)" /><stop offset=".73" stopColor="var(--oa-ink)" />
          <stop offset="1" stopColor="var(--oa-energy)" />
        </linearGradient>
        <radialGradient id={nucleo}>
          <stop stopColor="var(--oa-text)" /><stop offset=".28" stopColor="var(--oa-energy)" />
          <stop offset=".72" stopColor="var(--oa-energy-dim)" /><stop offset="1" stopColor="var(--oa-ink)" />
        </radialGradient>
        <radialGradient id={atmosfera}>
          <stop stopColor="var(--oa-energy)" stopOpacity=".32" />
          <stop offset=".45" stopColor="var(--oa-energy)" stopOpacity=".08" />
          <stop offset="1" stopColor="var(--oa-energy)" stopOpacity="0" />
        </radialGradient>
        <filter id={luz} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="aura" />
          <feMerge><feMergeNode in="aura" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="260" cy="295" rx="249" ry="263" fill={`url(#${atmosfera})`} />
      <path d="m225 310-88 241h246l-88-241Z" fill={`url(#${atmosfera})`} opacity=".4" />
      <g stroke="var(--oa-energy)" strokeWidth=".6" opacity=".32">
        <ellipse cx="260" cy="520" rx="211" ry="44" /><ellipse cx="260" cy="520" rx="179" ry="34" />
        <path d="M38 520h52M430 520h52M260 468v13M260 556v14M87 486l28 12M405 542l28 12" />
        {marcasBase.map(({ id: marcaId, percurso }) => <path key={marcaId} d={percurso} />)}
      </g>
      <ellipse cx="260" cy="515" rx="124" ry="20" fill="var(--oa-ink)" opacity=".9" />
      <ellipse cx="260" cy="512" rx="102" ry="11" fill="var(--oa-energy)" opacity=".12" />
      <g stroke={`url(#${borda})`}>
        <path d="M164 237v-78c0-70 41-112 96-112s96 42 96 112v78" strokeWidth="25" />
        <path d="M164 224v-65c0-70 41-112 96-112s96 42 96 112v65" strokeWidth="17" stroke="var(--oa-ink)" />
        <path d="M154 199v-40c0-76 46-122 106-122" strokeWidth="1" stroke="var(--oa-energy)" opacity=".6" />
        <path d="M174 182v-23c0-64 36-102 86-102s86 38 86 102v23" strokeWidth="1" stroke="var(--oa-energy)" opacity=".65" />
      </g>
      <path d="M158 187h23v53h-23zM339 187h23v53h-23z" fill={`url(#${metal})`} stroke="var(--oa-energy-dim)" />
      <path d="m145 434 24-26h182l24 26-15 40-100 22-100-22Z" fill={`url(#${metal})`} stroke="var(--oa-energy-dim)" />
      <path d="m160 474 100 22 100-22v13l-100 23-100-23z" fill="var(--oa-ink)" stroke="var(--oa-line)" />
      <path d="m145 434 115 26 115-26M260 460v36M169 408l91 24 91-24" stroke={`url(#${borda})`} />
      <path d="M168 247h184v168l-23 26H191l-23-26Z" fill={`url(#${metal})`} stroke="var(--oa-energy-dim)" />
      <ellipse cx="260" cy="250" rx="110" ry="36" fill="var(--oa-ink)" />
      <path d="M150 229h220v25c0 20-49 36-110 36s-110-16-110-36Z" fill={`url(#${metal})`} stroke="var(--oa-energy-dim)" />
      <ellipse cx="260" cy="229" rx="110" ry="36" fill={`url(#${metal})`} stroke={`url(#${borda})`} strokeWidth="2" />
      <ellipse cx="260" cy="222" rx="87" ry="23" fill="var(--oa-surface)" stroke="var(--oa-energy-dim)" />
      <path d="m211 218 16-34h66l16 34-49 13Z" fill={`url(#${metal})`} stroke={`url(#${borda})`} />
      <ellipse cx="260" cy="184" rx="33" ry="10" fill="var(--oa-ink)" stroke="var(--oa-energy-dim)" />
      <path d="M245 183v-14h30v14" fill={`url(#${metal})`} stroke="var(--oa-line)" />
      <ellipse cx="260" cy="169" rx="15" ry="5" fill="var(--oa-energy-dim)" />
      <g opacity=".8">
        {aletas.map(({ id: aletaId, x }) => (
          <g key={aletaId}>
            <path d={`M${260 + x} 274v138l${x < 0 ? 6 : -6} 10V278Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".6" />
            <path d={`M${261 + x} 289v101`} stroke="var(--oa-energy)" strokeOpacity=".4" />
          </g>
        ))}
      </g>
      <path d="m202 277 58-18 58 18 16 56-16 67-58 22-58-22-16-67Z" fill={`url(#${metal})`} stroke={`url(#${borda})`} strokeWidth="2" />
      <path d="m209 286 51-16 51 16 13 49-14 57-50 19-50-19-14-57Z" fill="var(--oa-ink)" stroke="var(--oa-energy-dim)" />
      <ellipse cx="260" cy="338" rx="59" ry="64" fill={`url(#${nucleo})`} filter={`url(#${luz})`} />
      <ellipse cx="260" cy="338" rx="57" ry="62" stroke="var(--oa-energy)" strokeWidth="1.4" />
      <ellipse cx="260" cy="338" rx="48" ry="53" stroke="var(--oa-text)" strokeOpacity=".4" strokeWidth=".6" />
      <g fill="var(--oa-ink)">
        <path d="M234 300h52v10h-52zM234 366h52v10h-52z" />
        <path fillRule="evenodd" d="M260 308a30 30 0 1 0 0 60 30 30 0 0 0 0-60Zm0 10a20 20 0 1 1 0 40 20 20 0 0 1 0-40Z" />
      </g>
      <g fill="var(--oa-energy)" filter={`url(#${luz})`}>
        <path d="M163 248c26 13 57 20 97 20s71-7 97-20v2c-26 14-57 21-97 21s-71-7-97-21Z" />
        <path d="m171 452 89 20 89-20v3l-89 20-89-20Z" />
      </g>
      <g stroke="var(--oa-energy)" strokeWidth="1" opacity=".65">
        <path d="M203 303h-9M326 303h-9M203 376h-9M326 376h-9M236 285v-5M284 285v-5M236 397v-5M284 397v-5" />
        <path d="M187 232h15M318 232h15M195 440l25 5M300 445l25-5" />
      </g>
      <g stroke="var(--oa-line)" strokeWidth=".65" opacity=".7">
        <path d="M104 309H67l-19 19H28M400 367h36l18-18h37M122 202H87l-18-18H44M376 457h41l16 16h38" />
        <circle cx="107" cy="309" r="3" /><circle cx="397" cy="367" r="3" />
      </g>
      <g fill="var(--oa-energy)" opacity=".75">
        <circle cx="61" cy="116" r="1" /><circle cx="418" cy="162" r="1.5" /><circle cx="98" cy="410" r="1" />
        <path d="M414 288v10M409 293h10M107 360v8M103 364h8" />
      </g>
    </svg>
  );
}

type TorreOaProps = {
  x: number;
  base: number;
  altura: number;
  largura: number;
  face: string;
  distante?: boolean;
};

function TorreOa({ x, base, altura, largura, face, distante = false }: TorreOaProps) {
  const topo = base - altura;
  const lado = largura * .36;
  const andares = Array.from({ length: Math.floor(altura / 18) }, (_, andar) => ({ id: `andar-${andar}`, y: topo + 14 + andar * 18 }));
  return (
    <g opacity={distante ? ".48" : "1"}>
      <path d={`M${x} ${base}V${topo + 14}l${largura / 2} -14 ${largura / 2} 14v${altura - 14}Z`} fill={face} stroke="var(--oa-line)" strokeWidth=".7" />
      <path d={`M${x + largura} ${base}l${lado} -12V${topo + 3}l-${lado} 11Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".65" />
      <path d={`M${x} ${topo + 14}l${largura / 2} -14 ${lado} -11 -${largura / 2} 14Z`} fill="var(--oa-energy-dim)" opacity=".35" />
      <path d={`M${x + largura / 2} ${topo}l${lado} -11 ${largura / 2} 14 -${lado} 11Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".5" />
      <path d={`M${x + largura / 2} ${topo}v-24M${x + 4} ${base - 3}V${topo + 20}`} stroke="var(--oa-energy)" strokeOpacity=".4" strokeWidth=".7" />
      {andares.map(({ id: andarId, y }) => (
        <g key={andarId}>
          <path d={`M${x + 7} ${y}h${largura - 14}`} stroke="var(--oa-energy)" strokeOpacity={distante ? ".22" : ".32"} strokeWidth="1" />
          <path d={`M${x + largura + 3} ${y - 1}l${lado - 6} -8`} stroke="var(--oa-energy)" strokeOpacity=".17" />
          <path d={`M${x + largura / 2 - 1} ${y + 4}h2v5h-2Z`} fill="var(--oa-energy)" opacity=".45" />
        </g>
      ))}
      <path d={`M${x - 4} ${base}h${largura + 8}v6h-${largura + 8}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".5" />
    </g>
  );
}

const estrelas = Array.from({ length: 92 }, (_, posicao) => ({
  id: `estrela-${posicao}`, x: (posicao * 173 + 19) % 1440,
  y: (posicao * 97 + 11) % 410, raio: posicao % 11 === 0 ? 1.5 : .6,
}));
const torresDistantes = [
  { x: 44, altura: 112, largura: 26 }, { x: 101, altura: 190, largura: 30 },
  { x: 165, altura: 144, largura: 32 }, { x: 226, altura: 235, largura: 35 },
  { x: 293, altura: 139, largura: 25 }, { x: 343, altura: 185, largura: 34 },
  { x: 421, altura: 254, largura: 27 }, { x: 489, altura: 190, largura: 42 },
  { x: 562, altura: 304, largura: 35 }, { x: 642, altura: 204, largura: 38 },
  { x: 710, altura: 262, largura: 34 }, { x: 790, altura: 175, largura: 29 },
  { x: 1018, altura: 249, largura: 37 }, { x: 1097, altura: 173, largura: 34 },
  { x: 1160, altura: 290, largura: 38 }, { x: 1230, altura: 183, largura: 28 },
  { x: 1310, altura: 246, largura: 35 }, { x: 1392, altura: 137, largura: 24 },
];
const torresProximas = [
  { x: -26, altura: 189, largura: 65 }, { x: 69, altura: 139, largura: 49 },
  { x: 153, altura: 241, largura: 60 }, { x: 264, altura: 158, largura: 54 },
  { x: 366, altura: 283, largura: 68 }, { x: 483, altura: 163, largura: 57 },
  { x: 603, altura: 230, largura: 58 }, { x: 724, altura: 164, largura: 59 },
  { x: 1096, altura: 242, largura: 65 }, { x: 1220, altura: 187, largura: 58 },
  { x: 1334, altura: 302, largura: 72 },
];

/** Panorama arquitetônico de Oa, desenhado em camadas determinísticas de SVG. [COMP-08] */
export function CidadeOa({ className }: ConstructoOaProps) {
  const id = useId().replace(/:/g, "");
  const ceu = `${id}-ceu`;
  const halo = `${id}-halo`;
  const torre = `${id}-torre`;
  const horizonte = `${id}-horizonte`;
  const luz = `${id}-luz`;
  const fade = `${id}-fade`;

  return (
    <svg viewBox="0 0 1440 720" className={className} fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={ceu} x1="0" y1="0" x2="0" y2="720" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--oa-ink)" /><stop offset=".58" stopColor="var(--oa-surface)" /><stop offset="1" stopColor="var(--oa-ink)" />
        </linearGradient>
        <radialGradient id={halo}>
          <stop stopColor="var(--oa-energy)" stopOpacity=".28" /><stop offset=".5" stopColor="var(--oa-energy-dim)" stopOpacity=".12" />
          <stop offset="1" stopColor="var(--oa-energy)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={torre} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="var(--oa-ink)" /><stop offset=".28" stopColor="var(--oa-surface)" />
          <stop offset=".65" stopColor="var(--oa-energy-dim)" /><stop offset="1" stopColor="var(--oa-ink)" />
        </linearGradient>
        <linearGradient id={horizonte} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--oa-energy-dim)" stopOpacity="0" /><stop offset=".5" stopColor="var(--oa-energy)" stopOpacity=".18" />
          <stop offset="1" stopColor="var(--oa-energy-dim)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={fade} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--oa-ink)" stopOpacity="0" /><stop offset="1" stopColor="var(--oa-ink)" />
        </linearGradient>
        <filter id={luz} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="aura" /><feMerge><feMergeNode in="aura" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M0 0h1440v720H0z" fill={`url(#${ceu})`} />
      <ellipse cx="925" cy="280" rx="550" ry="420" fill={`url(#${halo})`} />
      <g fill="var(--oa-text)" opacity=".5">
        {estrelas.map(({ id: estrelaId, x, y, raio }) => <circle key={estrelaId} cx={x} cy={y} r={raio} />)}
      </g>
      <g stroke="var(--oa-energy)" strokeWidth=".7">
        <circle cx="925" cy="280" r="229" strokeOpacity=".13" />
        <circle cx="925" cy="280" r="239" strokeOpacity=".05" />
        <circle cx="925" cy="280" r="215" strokeDasharray="1 10" strokeOpacity=".3" />
        <path d="M708 203a229 229 0 0 1 412-48M1101 427a229 229 0 0 1-315 36" strokeOpacity=".4" />
        <path d="M925 29v24M674 280h23M1153 280h23M750 103l17 17M1084 439l17 17" strokeOpacity=".45" />
      </g>
      <g opacity=".3" fill="var(--oa-energy-dim)">
        <path d="m0 436 60-28 80 16 69-51 41 19 70-61 52 49 56-21 83 51 43-15 81 31 58-43 66 44 63-22 84 22 99-44 54 25 42-19 70 43 76-26 48 20 80-19 66 32v137H0Z" />
      </g>
      <g>
        {torresDistantes.map(({ x, altura, largura }) => <TorreOa key={`distante-${x}`} x={x} base={526} altura={altura} largura={largura} face={`url(#${torre})`} distante />)}
      </g>
      <path d="M0 450h1440v130H0z" fill={`url(#${horizonte})`} />
      <g stroke="var(--oa-line)" strokeWidth="1">
        <path d="M0 527c261-37 510-40 713-15s476 25 727-19v19c-251 44-524 42-727 17S261 507 0 544Z" fill="var(--oa-ink)" />
        <path d="M0 527c261-37 510-40 713-15s476 25 727-19" stroke="var(--oa-energy)" strokeOpacity=".45" />
        {[90, 210, 330, 450, 570, 690, 810, 1120, 1240, 1360].map((x) => <path key={`pilier-${x}`} d={`M${x} 532v41m-5-41v41`} strokeOpacity=".5" />)}
      </g>
      <g>
        {torresProximas.map(({ x, altura, largura }) => <TorreOa key={`proche-${x}`} x={x} base={581} altura={altura} largura={largura} face={`url(#${torre})`} />)}
      </g>
      <g>
        <path d="m796 565 31-37h202l36 37v25H796Z" fill="var(--oa-ink)" stroke="var(--oa-line)" />
        <path d="m813 545 28-31h172l29 31Z" fill={`url(#${torre})`} stroke="var(--oa-energy-dim)" />
        <path d="m833 524 16-31h154l20 31Z" fill={`url(#${torre})`} stroke="var(--oa-line)" />
        <path d="M850 493V352l27-27h96l29 27v141Z" fill={`url(#${torre})`} stroke="var(--oa-energy-dim)" />
        <path d="m862 351 15-26h96l17 26Z" fill="var(--oa-energy-dim)" opacity=".5" />
        <path d="M877 325V201l19-30h58l19 30v124Z" fill={`url(#${torre})`} stroke="var(--oa-energy-dim)" />
        <path d="m896 171 12-43h34l12 43Z" fill={`url(#${torre})`} stroke="var(--oa-energy-dim)" />
        <path d="M918 128V85l7-37 7 37v43" fill="var(--oa-energy-dim)" stroke="var(--oa-energy)" strokeWidth=".7" />
        <path d="M897 213v98M910 193v123M925 180v138M940 193v123M954 213v98M866 365v116M984 365v116" stroke="var(--oa-energy)" strokeOpacity=".45" strokeWidth="1.5" />
        <g stroke="var(--oa-energy-dim)" strokeWidth="1">
          {[219, 239, 259, 279, 299].map((y) => <path key={`central-haut-${y}`} d={`M880 ${y}h90m-86 5h82`} />)}
          {[373, 396, 419, 442, 465].map((y) => <path key={`central-bas-${y}`} d={`M853 ${y}h146m-138 4h130`} />)}
        </g>
        <path d="M893 493v-95a32 32 0 0 1 64 0v95" fill="var(--oa-ink)" stroke="var(--oa-energy)" strokeOpacity=".5" />
        <path d="M907 493v-95a18 18 0 0 1 36 0v95" fill="var(--oa-energy)" opacity=".12" />
        <g fill="var(--oa-energy)" filter={`url(#${luz})`}>
          <path d="M876 321h98v3h-98zM848 349h155v3H848zM831 520h194v2H831z" />
          <path d="M916 133h18v2h-18zM923 69h4v26h-4zM913 492v-88h3v88M934 492v-88h3v88" />
        </g>
        <g stroke="var(--oa-energy-dim)" fill="var(--oa-ink)">
          <path d="M813 493v-84l12-43 12 43v84M1015 493v-84l12-43 12 43v84" />
          <path d="M805 493h40v5h-40zM1007 493h40v5h-40z" />
        </g>
        <path d="m909 542-38 79h111l-39-79Z" fill="var(--oa-energy)" opacity=".09" />
        <path d="m916 549-13 72M935 549l13 72" stroke="var(--oa-energy)" strokeOpacity=".5" />
        {[0, 1, 2, 3, 4].map((etapa) => <path key={`marche-${etapa}`} d={`M${858 - etapa * 8} ${552 + etapa * 12}h${138 + etapa * 16}`} stroke="var(--oa-energy-dim)" strokeWidth="2" />)}
      </g>
      <path d="M0 600c320-54 543 20 760 10s377-55 680-26v136H0Z" fill="var(--oa-ink)" />
      <g stroke="var(--oa-line)" strokeWidth=".6" opacity=".65">
        <path d="m0 697 913-83M263 720l650-106M624 720l289-106M1103 720 939 614M1440 682l-501-68M0 648c485-14 891 2 1440-22M0 687c485-27 891 12 1440-3" />
      </g>
      <path d="M0 572h1440v148H0z" fill={`url(#${fade})`} />
      <path d="M0 499h1440" stroke="var(--oa-energy)" strokeOpacity=".08" />
      <g stroke="var(--oa-energy)" strokeWidth="1" opacity=".45">
        <path d="m1157 156 42-14 18 2-42 14ZM591 304l31-10 12 2-31 10ZM304 209l24-8 10 2-24 8Z" />
      </g>
    </svg>
  );
}
