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
    <svg viewBox="0 0 520 600" className={className} data-oa-motion="bateria" fill="none" aria-hidden="true" focusable="false">
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
      <ellipse className="oa-vec-bateria-atmosfera" cx="260" cy="295" rx="249" ry="263" fill={`url(#${atmosfera})`} />
      <path className="oa-vec-bateria-cone" d="m225 310-88 241h246l-88-241Z" fill={`url(#${atmosfera})`} opacity=".4" />
      <g stroke="var(--oa-energy)" strokeWidth=".6" opacity=".32">
        <ellipse cx="260" cy="520" rx="211" ry="44" /><ellipse cx="260" cy="520" rx="179" ry="34" />
        <path d="M38 520h52M430 520h52M260 468v13M260 556v14M87 486l28 12M405 542l28 12" />
        <g className="oa-vec-bateria-base">
          {marcasBase.map(({ id: marcaId, percurso }) => <path key={marcaId} d={percurso} />)}
        </g>
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
        {aletas.map(({ id: aletaId, x }, posicao) => (
          <g key={aletaId}>
            <path d={`M${260 + x} 274v138l${x < 0 ? 6 : -6} 10V278Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".6" />
            <path d={`M${261 + x} 289v101`} stroke="var(--oa-energy)" strokeOpacity=".4" />
            <path className={`oa-vec-bateria-fluxo oa-vec-bateria-fluxo-${posicao % 3}`} d={`M${261 + x} 289v101`} stroke="var(--oa-energy)" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        ))}
      </g>
      <path d="m202 277 58-18 58 18 16 56-16 67-58 22-58-22-16-67Z" fill={`url(#${metal})`} stroke={`url(#${borda})`} strokeWidth="2" />
      <path d="m209 286 51-16 51 16 13 49-14 57-50 19-50-19-14-57Z" fill="var(--oa-ink)" stroke="var(--oa-energy-dim)" />
      <ellipse cx="260" cy="338" rx="59" ry="64" fill={`url(#${nucleo})`} filter={`url(#${luz})`} />
      <ellipse className="oa-vec-bateria-onda" cx="260" cy="338" rx="57" ry="62" stroke="var(--oa-energy)" strokeWidth="1" />
      <ellipse className="oa-vec-bateria-pulso" cx="260" cy="338" rx="57" ry="62" fill="var(--oa-energy)" />
      <ellipse className="oa-vec-bateria-anel" cx="260" cy="338" rx="57" ry="62" stroke="var(--oa-energy)" strokeWidth="1.4" />
      <ellipse cx="260" cy="338" rx="48" ry="53" stroke="var(--oa-text)" strokeOpacity=".4" strokeWidth=".6" />
      <g fill="var(--oa-ink)">
        <path d="M234 300h52v10h-52zM234 366h52v10h-52z" />
        <path fillRule="evenodd" d="M260 308a30 30 0 1 0 0 60 30 30 0 0 0 0-60Zm0 10a20 20 0 1 1 0 40 20 20 0 0 1 0-40Z" />
      </g>
      <g fill="var(--oa-energy)" filter={`url(#${luz})`}>
        <path d="M163 248c26 13 57 20 97 20s71-7 97-20v2c-26 14-57 21-97 21s-71-7-97-21Z" />
        <path d="m171 452 89 20 89-20v3l-89 20-89-20Z" />
      </g>
      <g className="oa-vec-bateria-contatos" stroke="var(--oa-energy)" strokeWidth="1" opacity=".65">
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

type TipoPredioOa = "cupula" | "agulha" | "escalonada" | "gemeas" | "arco" | "bloco" | "lamina" | "mastro";
type PlanoPredioOa = "fundo" | "medio" | "frente";

type PredioOa = {
  id: string;
  tipo: TipoPredioOa;
  plano: PlanoPredioOa;
  x: number;
  base: number;
  largura: number;
  altura: number;
  variante: 0 | 1 | 2;
};

type PassarelaOa = {
  id: string;
  x1: number;
  x2: number;
  y: number;
  arco?: number;
  fluxo?: 0 | 1 | 2;
};

const estrelas = Array.from({ length: 92 }, (_, posicao) => ({
  id: `estrela-${posicao}`, x: (posicao * 173 + 19) % 1440,
  y: (posicao * 97 + 11) % 410, raio: posicao % 11 === 0 ? 1.5 : .6,
})).filter(({ x, y }) => (x - 925) * (x - 925) + (y - 290) * (y - 290) > 226 * 226);

// Plano 1 (fundo, base 524): agrupamentos distantes esmaecidos na bruma atmosférica.
const prediosFundo: PredioOa[] = [
  { id: "f-bloco-1", tipo: "bloco", plano: "fundo", x: 12, base: 524, largura: 84, altura: 58, variante: 0 },
  { id: "f-agulha-1", tipo: "agulha", plano: "fundo", x: 118, base: 524, largura: 20, altura: 128, variante: 0 },
  { id: "f-cupula-1", tipo: "cupula", plano: "fundo", x: 152, base: 524, largura: 64, altura: 82, variante: 0 },
  { id: "f-arco-1", tipo: "arco", plano: "fundo", x: 298, base: 524, largura: 64, altura: 148, variante: 0 },
  { id: "f-escalonada-1", tipo: "escalonada", plano: "fundo", x: 374, base: 524, largura: 54, altura: 186, variante: 2 },
  { id: "f-agulha-2", tipo: "agulha", plano: "fundo", x: 526, base: 524, largura: 22, altura: 228, variante: 1 },
  { id: "f-agulha-3", tipo: "agulha", plano: "fundo", x: 596, base: 524, largura: 26, altura: 324, variante: 2 },
  { id: "f-lamina-1", tipo: "lamina", plano: "fundo", x: 632, base: 524, largura: 48, altura: 218, variante: 0 },
  { id: "f-cupula-2", tipo: "cupula", plano: "fundo", x: 696, base: 524, largura: 62, altura: 118, variante: 1 },
  { id: "f-agulha-4", tipo: "agulha", plano: "fundo", x: 1054, base: 524, largura: 22, altura: 168, variante: 1 },
  { id: "f-escalonada-2", tipo: "escalonada", plano: "fundo", x: 1126, base: 524, largura: 58, altura: 242, variante: 1 },
  { id: "f-agulha-5", tipo: "agulha", plano: "fundo", x: 1196, base: 524, largura: 26, altura: 304, variante: 2 },
  { id: "f-cupula-3", tipo: "cupula", plano: "fundo", x: 1244, base: 524, largura: 72, altura: 124, variante: 2 },
  { id: "f-lamina-2", tipo: "lamina", plano: "fundo", x: 1344, base: 524, largura: 48, altura: 196, variante: 1 },
];

// Plano 2 (médio, base 556): complexos intermediários sobre o viaduto, criando sobreposição real com a frente.
const prediosMedios: PredioOa[] = [
  { id: "m-cupula-1", tipo: "cupula", plano: "medio", x: 56, base: 556, largura: 78, altura: 88, variante: 0 },
  { id: "m-mastro-1", tipo: "mastro", plano: "medio", x: 138, base: 556, largura: 46, altura: 134, variante: 0 },
  { id: "m-agulha-1", tipo: "agulha", plano: "medio", x: 312, base: 556, largura: 26, altura: 262, variante: 0 },
  { id: "m-arco-1", tipo: "arco", plano: "medio", x: 398, base: 556, largura: 64, altura: 172, variante: 1 },
  { id: "m-lamina-1", tipo: "lamina", plano: "medio", x: 544, base: 556, largura: 52, altura: 192, variante: 1 },
  { id: "m-mastro-2", tipo: "mastro", plano: "medio", x: 632, base: 556, largura: 58, altura: 228, variante: 2 },
  { id: "m-bloco-1", tipo: "bloco", plano: "medio", x: 734, base: 556, largura: 76, altura: 88, variante: 1 },
  { id: "m-arco-2", tipo: "arco", plano: "medio", x: 1038, base: 556, largura: 68, altura: 164, variante: 0 },
  { id: "m-mastro-3", tipo: "mastro", plano: "medio", x: 1188, base: 556, largura: 56, altura: 222, variante: 1 },
  { id: "m-agulha-2", tipo: "agulha", plano: "medio", x: 1346, base: 556, largura: 28, altura: 254, variante: 2 },
];

// Plano 3 (primeiro plano, base 584): 4 agrupamentos densos com sobreposição e respiros abertos entre eles.
const prediosFrente: PredioOa[] = [
  // Agrupamento 1 (extrema esquerda, baixo e calmo para o texto do portal)
  { id: "p-bloco-1", tipo: "bloco", plano: "frente", x: -16, base: 584, largura: 102, altura: 70, variante: 0 },
  { id: "p-escalonada-1", tipo: "escalonada", plano: "frente", x: 92, base: 584, largura: 58, altura: 106, variante: 1 },
  // Respiro aberto em x = 150..210, seguido de galeria baixa em x = 208..286
  { id: "p-bloco-2", tipo: "bloco", plano: "frente", x: 208, base: 584, largura: 78, altura: 54, variante: 2 },
  // Agrupamento 2 (centro-esquerda, visível na borda esquerda da barra lateral: gêmeas + grande domo geodésico)
  { id: "p-gemeas-1", tipo: "gemeas", plano: "frente", x: 326, base: 584, largura: 98, altura: 216, variante: 0 },
  { id: "p-cupula-1", tipo: "cupula", plano: "frente", x: 416, base: 584, largura: 96, altura: 108, variante: 0 },
  // Respiro aberto em x = 512..568 (viaduto e passarela suspensa visíveis)
  // Agrupamento 3 (subida dramática até o zigurate alto e descida em cascata com arco e astrolábio junto ao planeta)
  { id: "p-escalonada-2", tipo: "escalonada", plano: "frente", x: 568, base: 584, largura: 80, altura: 284, variante: 0 },
  { id: "p-arco-1", tipo: "arco", plano: "frente", x: 654, base: 584, largura: 74, altura: 162, variante: 2 },
  { id: "p-cupula-2", tipo: "cupula", plano: "frente", x: 722, base: 584, largura: 68, altura: 138, variante: 1 },
  // Agrupamento 4 (direita da Sede Central: lâmina cristalina + estação baixa + gêmeas + cúpula)
  { id: "p-lamina-1", tipo: "lamina", plano: "frente", x: 1080, base: 584, largura: 66, altura: 236, variante: 0 },
  { id: "p-bloco-3", tipo: "bloco", plano: "frente", x: 1140, base: 584, largura: 88, altura: 82, variante: 1 },
  { id: "p-gemeas-2", tipo: "gemeas", plano: "frente", x: 1268, base: 584, largura: 102, altura: 258, variante: 1 },
  { id: "p-cupula-3", tipo: "cupula", plano: "frente", x: 1364, base: 584, largura: 80, altura: 136, variante: 2 },
];

const passarelasUrbanas: PassarelaOa[] = [
  { id: "passarela-1", x1: 146, x2: 214, y: 540, arco: 8 },
  { id: "passarela-2", x1: 280, x2: 332, y: 538, arco: 9, fluxo: 1 },
  { id: "passarela-3", x1: 498, x2: 574, y: 454, arco: 14, fluxo: 0 },
  { id: "passarela-4", x1: 642, x2: 662, y: 446, arco: 8, fluxo: 2 },
  { id: "passarela-5", x1: 784, x2: 834, y: 482, arco: 10, fluxo: 1 },
  { id: "passarela-6", x1: 1018, x2: 1086, y: 474, arco: 12, fluxo: 2 },
  { id: "passarela-7", x1: 1216, x2: 1274, y: 462, arco: 12, fluxo: 0 },
];

const arcosViaduto = [36, 156, 236, 356, 512, 612, 712, 1054, 1184, 1304];

function DesenhoPassarela({ x1, x2, y, arco = 10, fluxo }: PassarelaOa) {
  const xm = ((x1 + x2) / 2).toFixed(4);
  const ym = (y + arco).toFixed(4);
  return (
    <g>
      <path d={`M${x1} ${y}h${x2 - x1}v4H${x1}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".65" />
      <path d={`M${x1} ${y + 4}Q${xm} ${ym} ${x2} ${y + 4}`} stroke="var(--oa-energy-dim)" strokeWidth=".8" />
      <path d={`M${x1} ${y}h${x2 - x1}`} stroke="var(--oa-energy)" strokeOpacity=".65" strokeWidth="1" />
      {fluxo !== undefined && (
        <path className={`oa-vec-cidade-fluxo oa-vec-cidade-fluxo-${fluxo}`} d={`M${x1} ${y + 1}h${x2 - x1}`} stroke="var(--oa-energy)" strokeWidth="1.2" />
      )}
    </g>
  );
}

function PredioCidadeOa({
  predio,
  faceCurva,
  facePlana,
  faceFundo,
}: {
  predio: PredioOa;
  faceCurva: string;
  facePlana: string;
  faceFundo: string;
}) {
  const { tipo, plano, x, base, largura, altura, variante } = predio;
  const topo = base - altura;
  const cx = Math.round(x + largura / 2);
  const opacidade = plano === "fundo" ? ".46" : plano === "medio" ? ".78" : "1";
  const detalheVivo = plano !== "fundo";
  const face = plano === "fundo" ? faceFundo : (tipo === "cupula" || tipo === "agulha") ? faceCurva : facePlana;
  const classeFarol = `oa-vec-cidade-farol oa-vec-cidade-farol-${variante}`;
  const classeJanela = `oa-vec-cidade-janela oa-vec-cidade-janela-${variante}`;

  if (tipo === "cupula") {
    // Variante 1: Observatório Esférico / Astrolábio em berço curvo (silhueta de orbe suspenso).
    if (variante === 1) {
      const rOrbe = Math.round(largura * .38);
      const cyOrbe = topo + rOrbe + 14;
      const yPedestal = cyOrbe + Math.round(rOrbe * .65);
      return (
        <g opacity={opacidade}>
          <path d={`M${x + 4} ${base}l8 -${base - yPedestal}h${largura - 24}l8 ${base - yPedestal}Z`} fill={facePlana} stroke="var(--oa-line)" strokeWidth=".8" />
          <path d={`M${x + 2} ${yPedestal}C${x - 4} ${cyOrbe} ${x + 4} ${topo + 16} ${cx - rOrbe + 4} ${topo + 18}M${x + largura - 2} ${yPedestal}C${x + largura + 4} ${cyOrbe} ${x + largura - 4} ${topo + 16} ${cx + rOrbe - 4} ${topo + 18}`} stroke="var(--oa-energy-dim)" strokeWidth="2.2" />
          <circle cx={cx} cy={cyOrbe} r={rOrbe} fill={face} stroke="var(--oa-energy)" strokeOpacity=".75" strokeWidth=".95" />
          <ellipse cx={cx} cy={cyOrbe} rx={rOrbe + 5} ry={Math.max(5, Math.round(rOrbe * .28))} stroke="var(--oa-energy)" strokeOpacity=".8" strokeWidth="1.2" />
          {detalheVivo && (
            <g>
              <ellipse cx={cx} cy={cyOrbe} rx={Math.max(5, Math.round(rOrbe * .46))} ry={rOrbe - 1} stroke="var(--oa-energy-dim)" strokeWidth=".75" />
              <circle className={classeJanela} cx={cx} cy={cyOrbe} r={Math.max(4, Math.round(rOrbe * .24))} fill="var(--oa-energy)" opacity=".55" />
              <path d={`M${cx} ${topo + 14}V${topo - 8}M${x + 14} ${base - 8}V${yPedestal + 8}M${x + largura - 14} ${base - 8}V${yPedestal + 8}`} stroke="var(--oa-energy)" strokeOpacity=".6" strokeWidth=".9" />
              <circle className={classeFarol} cx={cx} cy={topo - 9} r="2" fill="var(--oa-energy)" />
            </g>
          )}
          <path d={`M${x - 2} ${yPedestal}h${largura + 4}`} stroke="var(--oa-energy)" strokeWidth="1.2" />
          <path d={`M${x - 4} ${base - 4}h${largura + 8}v5h-${largura + 8}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".55" />
        </g>
      );
    }

    // Variantes 0 e 2: Grande Domo Geodésico Largo (0) ou Cúpula Escalonada com Dupla Antena (2).
    const tamborTopo = base - Math.round(altura * (variante === 0 ? .34 : .46));
    const raioX = Math.round((largura - 6) / 2);
    const raioY = tamborTopo - topo;
    const xDomoEsq = x + 3;
    const xDomoDir = x + largura - 3;
    const rInterno = Math.max(8, Math.round(raioX * .56));
    return (
      <g opacity={opacidade}>
        <path d={`M${x - 4} ${base}l6 -${Math.round(altura * .3)}h${largura - 4}l6 ${Math.round(altura * .3)}Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".65" />
        <path d={`M${x} ${base}V${tamborTopo}h${largura}V${base}Z`} fill={facePlana} stroke="var(--oa-line)" strokeWidth=".75" />
        <path d={`M${xDomoEsq} ${tamborTopo}A${raioX} ${raioY} 0 0 1 ${xDomoDir} ${tamborTopo}Z`} fill={face} stroke="var(--oa-energy-dim)" strokeWidth=".95" />
        <path d={`M${cx - rInterno} ${tamborTopo}A${rInterno} ${Math.max(8, raioY - 2)} 0 0 1 ${cx + rInterno} ${tamborTopo}M${xDomoEsq + 6} ${tamborTopo - Math.round(raioY * .42)}h${largura - 18}`} stroke="var(--oa-energy)" strokeOpacity=".38" strokeWidth=".75" />
        <path d={`M${x - 3} ${tamborTopo - 2}h${largura + 6}v4h-${largura + 6}Z`} fill="var(--oa-surface)" stroke="var(--oa-energy)" strokeOpacity=".75" strokeWidth=".75" />
        {variante === 0 ? (
          <g>
            <path d={`M${cx} ${topo}L${cx - rInterno} ${tamborTopo}M${cx} ${topo}L${cx + rInterno} ${tamborTopo}M${cx - rInterno} ${tamborTopo - Math.round(raioY * .42)}L${cx} ${tamborTopo}L${cx + rInterno} ${tamborTopo - Math.round(raioY * .42)}`} stroke="var(--oa-energy-dim)" strokeWidth=".7" />
            <ellipse cx={cx} cy={topo} rx={Math.round(largura * .18)} ry="3.5" fill="var(--oa-surface)" stroke="var(--oa-energy)" strokeWidth=".8" />
          </g>
        ) : (
          <path d={`M${cx - 10} ${topo + 3}l-5 -18M${cx + 10} ${topo + 3}l5 -14M${cx - 14} ${topo - 7}h28`} stroke="var(--oa-energy)" strokeOpacity=".75" strokeWidth=".8" />
        )}
        {detalheVivo && (
          <g>
            <path className={classeJanela} d={`M${x + 12} ${tamborTopo + 8}h${largura - 24}v4H${x + 12}Z`} fill="var(--oa-energy)" opacity=".5" />
            <path d={`M${x + 14} ${base}v-18h6v18ZM${cx - 4} ${base}v-22h8v22ZM${x + largura - 20} ${base}v-18h6v18Z`} fill="var(--oa-ink)" stroke="var(--oa-energy-dim)" strokeWidth=".7" />
          </g>
        )}
        <path d={`M${x - 6} ${base - 4}h${largura + 12}v5h-${largura + 12}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".55" />
      </g>
    );
  }

  if (tipo === "agulha") {
    const ombro1 = base - Math.round(altura * .28);
    const ombro2 = base - Math.round(altura * .66);
    const pontaBase = topo + 34;
    const m1 = Math.max(4, Math.round(largura * .34));
    const m2 = Math.max(3, Math.round(largura * .16));
    return (
      <g opacity={opacidade}>
        <path d={`M${x - 5} ${base}l5 -${Math.round(altura * .2)}h${largura}l5 ${Math.round(altura * .2)}Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".6" />
        <path d={`M${x} ${base}L${cx - m1} ${ombro1}L${cx - m2} ${ombro2}L${cx - 2} ${pontaBase}L${cx} ${topo}L${cx + 2} ${pontaBase}L${cx + m2} ${ombro2}L${cx + m1} ${ombro1}L${x + largura} ${base}Z`} fill={face} stroke="var(--oa-energy-dim)" strokeWidth=".75" />
        <path d={`M${cx} ${base}V${topo}`} stroke="var(--oa-energy)" strokeOpacity={detalheVivo ? ".65" : ".38"} strokeWidth="1.1" />
        {detalheVivo && (
          <g>
            <path className={`oa-vec-cidade-fluxo oa-vec-cidade-fluxo-${variante}`} d={`M${cx} ${base - 14}V${pontaBase}`} stroke="var(--oa-energy)" strokeWidth="1.5" strokeLinecap="round" />
            <path d={`M${cx - m1 - 2} ${ombro1}h${m1 * 2 + 4}M${cx - m2 - 3} ${ombro2}h${m2 * 2 + 6}`} stroke="var(--oa-energy)" strokeWidth="1.2" />
            <path className={classeJanela} d={`m${cx} ${ombro1 - 24} 5 6-5 6-5-6Zm0 -42 4 5-4 5-4-5Z`} fill="var(--oa-energy)" opacity=".65" />
            <circle className={classeFarol} cx={cx} cy={topo} r="2.2" fill="var(--oa-energy)" />
          </g>
        )}
      </g>
    );
  }

  if (tipo === "escalonada") {
    const y1 = base - Math.round(altura * .38);
    const y2 = base - Math.round(altura * .7);
    const y3 = topo + 16;
    const recEsq1 = variante === 1 ? 4 : 10;
    const recDir1 = variante === 2 ? 4 : 10;
    const recEsq2 = variante === 1 ? 10 : 20;
    const recDir2 = variante === 2 ? 10 : 20;
    const lado = Math.round(largura * .22);
    const x2Esq = x + recEsq1;
    const x2Dir = x + largura - recDir1;
    const x3Esq = x + recEsq2;
    const x3Dir = x + largura - recDir2;
    const xm3 = Math.round((x3Esq + x3Dir) / 2);
    return (
      <g opacity={opacidade}>
        <path d={`M${x + largura} ${base}l${lado} -10V${y1 - 8}l-${lado} 10Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".6" />
        <path d={`M${x2Dir} ${y1}l${Math.round(lado * .8)} -8V${y2 - 6}l-${Math.round(lado * .8)} 8Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".55" />
        <path d={`M${x} ${base}V${y1}h${largura}V${base}Z`} fill={face} stroke="var(--oa-line)" strokeWidth=".75" />
        <path d={`M${x2Esq} ${y1}V${y2}h${x2Dir - x2Esq}V${y1}Z`} fill={face} stroke="var(--oa-energy-dim)" strokeWidth=".75" />
        <path d={`M${x3Esq} ${y2}V${y3}l8 -16h${Math.max(8, x3Dir - x3Esq - 16)}l8 16V${y2}Z`} fill={face} stroke="var(--oa-energy-dim)" strokeWidth=".75" />
        <path d={`M${x - 2} ${y1}h${largura + 4}M${x2Esq - 2} ${y2}h${x2Dir - x2Esq + 4}M${x3Esq} ${y3}h${x3Dir - x3Esq}`} stroke="var(--oa-energy)" strokeOpacity=".8" strokeWidth="1.4" />
        <path d={`M${xm3 - 6} ${topo}v-18M${xm3 + 6} ${topo}v-12`} stroke="var(--oa-energy)" strokeOpacity=".6" strokeWidth=".8" />
        {detalheVivo && (
          <g>
            <path d={`M${x + 12} ${base - 6}V${y1 + 6}M${x + 24} ${base - 6}V${y1 + 6}M${x + largura - 12} ${base - 6}V${y1 + 6}M${x + largura - 24} ${base - 6}V${y1 + 6}`} stroke="var(--oa-energy-dim)" strokeOpacity=".55" strokeWidth="1" />
            <path d={`M${x2Esq + 10} ${y1 - 5}V${y2 + 6}M${xm3} ${y1 - 5}V${y3 + 4}M${x2Dir - 10} ${y1 - 5}V${y2 + 6}`} stroke="var(--oa-energy)" strokeOpacity=".42" strokeWidth="1.1" />
            <g className={classeJanela} fill="var(--oa-energy)" opacity=".55">
              <path d={`M${xm3 - 9} ${y2 - 22}h6v12h-6ZM${xm3 + 3} ${y2 - 22}h6v12h-6ZM${xm3 - 9} ${y2 - 42}h6v12h-6ZM${xm3 + 3} ${y2 - 42}h6v12h-6Z`} />
              <path d={`M${xm3 - 4} ${y1 - 28}h8v18h-8Z`} />
            </g>
          </g>
        )}
        <path d={`M${x - 5} ${base - 5}h${largura + 10}v6h-${largura + 10}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".6" />
      </g>
    );
  }

  if (tipo === "gemeas") {
    const w1 = Math.round(largura * .37);
    const w2 = Math.round(largura * .35);
    const x2 = x + largura - w2;
    const h2 = Math.round(altura * (variante === 0 ? .78 : .86));
    const topo2 = base - h2;
    const yPonte1 = base - Math.round(h2 * .68);
    const yPonte2 = base - Math.round(h2 * .36);
    const xPonte1 = x + w1;
    const wPonte = x2 - xPonte1;
    const xmPonte = Math.round((xPonte1 + x2) / 2);
    const cx1 = x + Math.round(w1 / 2);
    const cx2 = x2 + Math.round(w2 / 2);
    return (
      <g opacity={opacidade}>
        <path d={`M${x} ${base}V${topo + 16}l6 -8h${w1 - 12}l6 8V${base}Z`} fill={face} stroke="var(--oa-energy-dim)" strokeWidth=".8" />
        <path d={`M${x + 5} ${topo + 8}l4 -8h${w1 - 18}l4 8Z`} fill="var(--oa-surface)" stroke="var(--oa-energy)" strokeOpacity=".7" strokeWidth=".7" />
        <path d={`M${x + w1} ${base}l7 -8V${topo + 10}l-7 6Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".6" />
        <path d={`M${x2} ${base}V${topo2 + 10}l5 -10h${w2 - 10}l5 10V${base}Z`} fill={face} stroke="var(--oa-line)" strokeWidth=".8" />
        <path d={`M${x2 + w2} ${base}l7 -8V${topo2 + 4}l-7 6Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".6" />
        <path d={`M${xPonte1} ${yPonte1}h${wPonte}v7h-${wPonte}ZM${xPonte1} ${yPonte2}h${wPonte}v5h-${wPonte}Z`} fill="var(--oa-surface)" stroke="var(--oa-energy-dim)" strokeWidth=".7" />
        <path d={`M${xmPonte - 6} ${yPonte1 - 4}h12v15h-12Z`} fill="var(--oa-ink)" stroke="var(--oa-energy)" strokeOpacity=".7" strokeWidth=".75" />
        <path d={`M${xPonte1} ${yPonte1}h${wPonte}M${xPonte1} ${yPonte2}h${wPonte}`} stroke="var(--oa-energy)" strokeWidth="1.2" />
        <path d={`M${xPonte1} ${yPonte1 + 7}Q${xmPonte} ${yPonte1 + 16} ${x2} ${yPonte1 + 7}M${xPonte1} ${yPonte2 + 5}Q${xmPonte} ${yPonte2 + 13} ${x2} ${yPonte2 + 5}`} stroke="var(--oa-energy)" strokeOpacity=".5" strokeWidth=".8" />
        <path d={`M${cx1 - 4} ${topo}v-22M${cx1 + 4} ${topo}v-14M${cx2} ${topo2}v-18`} stroke="var(--oa-energy)" strokeOpacity=".65" strokeWidth=".85" />
        <circle className={classeFarol} cx={cx1 - 4} cy={topo - 22} r="2" fill="var(--oa-energy)" />
        {detalheVivo && (
          <g>
            <path d={`M${x + 9} ${base - 8}V${topo + 22}M${x + w1 - 9} ${base - 8}V${topo + 22}M${x2 + 9} ${base - 8}V${topo2 + 16}M${x2 + w2 - 9} ${base - 8}V${topo2 + 16}`} stroke="var(--oa-energy)" strokeOpacity=".34" strokeWidth="1" />
            <g className={classeJanela} fill="var(--oa-energy)" opacity=".58">
              <path d={`M${x + 13} ${topo + 28}h4v18h-4ZM${x + 21} ${topo + 36}h4v22h-4ZM${x + 13} ${topo + 68}h4v24h-4ZM${x + 21} ${topo + 84}h4v18h-4ZM${x + 13} ${topo + 116}h4v20h-4Z`} />
              <path d={`M${x2 + 13} ${topo2 + 24}h10v4h-10ZM${x2 + 13} ${topo2 + 36}h10v4h-10ZM${x2 + 13} ${topo2 + 68}h10v4h-10ZM${x2 + 13} ${topo2 + 80}h10v4h-10ZM${x2 + 13} ${topo2 + 112}h10v4h-10Z`} />
            </g>
          </g>
        )}
        <path d={`M${x - 4} ${base - 5}h${largura + 10}v6h-${largura + 10}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".6" />
      </g>
    );
  }

  if (tipo === "arco") {
    const perna = Math.max(14, Math.round(largura * .23));
    const xVaoEsq = x + perna;
    const xVaoDir = x + largura - perna;
    const rVao = Math.round((xVaoDir - xVaoEsq) / 2);
    const yArcoTopo = topo + Math.round(altura * .28);
    const yImposta = yArcoTopo + rVao;
    const yAnel = yArcoTopo + Math.round(rVao * .85);
    return (
      <g opacity={opacidade}>
        <path
          fillRule="evenodd"
          d={`M${x} ${base}L${x + 6} ${topo + 10}l12 -10h${largura - 36}l12 10L${x + largura} ${base}H${xVaoDir}V${yImposta}A${rVao} ${rVao} 0 0 0 ${xVaoEsq} ${yImposta}V${base}Z`}
          fill={face}
          stroke="var(--oa-energy-dim)"
          strokeWidth=".85"
        />
        <path d={`M${xVaoEsq} ${base}V${yImposta}A${rVao} ${rVao} 0 0 1 ${xVaoDir} ${yImposta}V${base}`} stroke="var(--oa-energy)" strokeOpacity=".8" strokeWidth="1.3" />
        <path d={`M${x + 12} ${topo + 8}h${largura - 24}`} stroke="var(--oa-energy)" strokeOpacity=".75" strokeWidth="1.5" />
        {detalheVivo && (
          <g>
            <circle cx={cx} cy={yAnel} r={Math.max(6, Math.round(rVao * .42))} stroke="var(--oa-energy)" strokeOpacity=".75" strokeWidth="1.2" />
            <circle className={classeFarol} cx={cx} cy={yAnel} r="2.5" fill="var(--oa-energy)" />
            <path d={`M${cx} ${yArcoTopo}v${yAnel - yArcoTopo - Math.max(6, Math.round(rVao * .42))}M${xVaoEsq} ${yAnel}h${cx - xVaoEsq - Math.max(6, Math.round(rVao * .42))}M${cx + Math.max(6, Math.round(rVao * .42))} ${yAnel}H${xVaoDir}`} stroke="var(--oa-energy)" strokeOpacity=".45" strokeWidth=".75" />
            <path d={`M${x + 7} ${base - 14}V${topo + 24}M${x + largura - 7} ${base - 14}V${topo + 24}`} stroke="var(--oa-energy-dim)" strokeWidth=".9" strokeDasharray="6 5" />
          </g>
        )}
        <path d={`M${x - 4} ${base - 4}h${perna + 6}v5h-${perna + 6}ZM${xVaoDir - 2} ${base - 4}h${perna + 6}v5h-${perna + 6}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".55" />
      </g>
    );
  }

  if (tipo === "bloco") {
    // 3 tipologias horizontais distintas para não repetir a mesma fachada baixa.
    if (variante === 1) {
      // Estação de energia horizontal com núcleo em trincheira e dois pilones superiores.
      const yCorpo = topo + 18;
      return (
        <g opacity={opacidade}>
          <path d={`M${x} ${base}l10 -${altura - 18}h${largura - 20}l10 ${altura - 18}Z`} fill={face} stroke="var(--oa-line)" strokeWidth=".8" />
          <path d={`M${x + 16} ${yCorpo}l5 -18h14l4 18ZM${x + largura - 39} ${yCorpo}l4 -18h14l5 18Z`} fill="var(--oa-surface)" stroke="var(--oa-energy-dim)" strokeWidth=".75" />
          <path d={`M${x + 14} ${yCorpo + 14}h${largura - 28}v16H${x + 14}Z`} fill="var(--oa-ink)" stroke="var(--oa-energy-dim)" strokeWidth=".75" />
          {detalheVivo && (
            <g>
              <path className={classeJanela} d={`M${x + 18} ${yCorpo + 20}h${largura - 36}v4H${x + 18}Z`} fill="var(--oa-energy)" opacity=".6" />
              <path d={`M${cx - 16} ${yCorpo + 14}v16M${cx} ${yCorpo + 14}v16M${cx + 16} ${yCorpo + 14}v16`} stroke="var(--oa-line)" strokeWidth=".8" />
            </g>
          )}
          <path d={`M${x - 4} ${base - 4}h${largura + 8}v5h-${largura + 8}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".55" />
        </g>
      );
    }
    if (variante === 2) {
      // Galeria horizontal em colunata com viseira inclinada.
      const passo = Math.round((largura - 24) / 4);
      return (
        <g opacity={opacidade}>
          <path d={`M${x} ${base}V${topo + 10}l12 -10h${largura - 18}l6 10V${base}Z`} fill={face} stroke="var(--oa-line)" strokeWidth=".75" />
          <path d={`M${x - 3} ${topo + 10}h${largura + 6}`} stroke="var(--oa-energy)" strokeOpacity=".75" strokeWidth="1.3" />
          {detalheVivo && (
            <path className={classeJanela} d={`M${x + 12} ${topo + 18}h4v${altura - 26}h-4ZM${x + 12 + passo} ${topo + 18}h4v${altura - 26}h-4ZM${x + 12 + passo * 2} ${topo + 18}h4v${altura - 26}h-4ZM${x + 12 + passo * 3} ${topo + 18}h4v${altura - 26}h-4Z`} fill="var(--oa-energy)" opacity=".48" />
          )}
          <path d={`M${x - 4} ${base - 4}h${largura + 8}v5h-${largura + 8}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".55" />
        </g>
      );
    }
    // Variante 0: Bastão / Hangar em terraço com convés em balanço lateral.
    const yConv = topo + 16;
    return (
      <g opacity={opacidade}>
        <path d={`M${x} ${base}l8 -${altura - 16}h${largura - 16}l8 ${altura - 16}Z`} fill={face} stroke="var(--oa-line)" strokeWidth=".8" />
        <path d={`M${x + 14} ${yConv}l6 -16h34l8 16Z`} fill="var(--oa-surface)" stroke="var(--oa-energy-dim)" strokeWidth=".75" />
        <path d={`M${x + 4} ${yConv}h${largura + 10}`} stroke="var(--oa-energy)" strokeOpacity=".75" strokeWidth="1.4" />
        {detalheVivo && (
          <g>
            <path d={`M${x + 16} ${base}v-22l6 -6h${largura - 44}l6 6v22Z`} fill="var(--oa-ink)" stroke="var(--oa-energy-dim)" strokeWidth=".8" />
            <path className={classeJanela} d={`M${x + 24} ${base - 14}h${largura - 60}v3H${x + 24}Z`} fill="var(--oa-energy)" opacity=".6" />
          </g>
        )}
        <path d={`M${x - 4} ${base - 4}h${largura + 8}v5h-${largura + 8}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".55" />
      </g>
    );
  }

  if (tipo === "lamina") {
    const corte = Math.round(altura * .22);
    const inclinaDir = variante % 2 === 0;
    const yEsq = inclinaDir ? topo : topo + corte;
    const yDir = inclinaDir ? topo + corte : topo;
    const lado = Math.round(largura * .28);
    const yAnexo = base - Math.round(altura * .54);
    return (
      <g opacity={opacidade}>
        <path d={`M${x + largura} ${base}l${lado} -10V${yDir - 8}l-${lado} 8Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".65" />
        <path d={`M${x} ${base}V${yEsq}L${x + largura} ${yDir}V${base}Z`} fill={face} stroke="var(--oa-energy-dim)" strokeWidth=".8" />
        <path d={`M${x - 8} ${base}V${yAnexo + 14}l8 -14V${base}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".65" />
        <path d={`M${x} ${yEsq}L${x + largura} ${yDir}`} stroke="var(--oa-energy)" strokeWidth="1.4" />
        <path d={`M${inclinaDir ? x + 6 : x + largura - 6} ${topo}v-22`} stroke="var(--oa-energy)" strokeOpacity=".65" strokeWidth=".8" />
        {detalheVivo && (
          <g>
            <path d={`M${x + 6} ${yEsq + 14}L${x + largura - 6} ${yDir + 14}M${x + 6} ${yEsq + 26}L${x + largura - 6} ${yDir + 26}`} stroke="var(--oa-energy)" strokeOpacity=".45" strokeWidth=".9" />
            <path d={`M${x + Math.round(largura * .28)} ${base - 10}V${yEsq + 38}M${x + Math.round(largura * .52)} ${base - 10}V${yDir + 38}M${x + Math.round(largura * .76)} ${base - 10}V${yDir + 46}`} stroke="var(--oa-energy-dim)" strokeWidth=".9" />
            <g className={classeJanela} fill="var(--oa-energy)" opacity=".6">
              <path d={`M${x + Math.round(largura * .28) - 1} ${yEsq + 46}h3v28h-3ZM${x + Math.round(largura * .52) - 1} ${yDir + 58}h3v36h-3ZM${x + Math.round(largura * .76) - 1} ${yDir + 82}h3v24h-3ZM${x + Math.round(largura * .28) - 1} ${yEsq + 98}h3v32h-3Z`} />
            </g>
          </g>
        )}
        <path d={`M${x - 10} ${base - 5}h${largura + 16}v6h-${largura + 16}Z`} fill="var(--oa-surface)" stroke="var(--oa-line)" strokeWidth=".6" />
      </g>
    );
  }

  // Tipo "mastro": coluna estreita com plataformas horizontais em balanço e cabos tensores.
  const wColuna = 14;
  const xCol = cx - wColuna / 2;
  const yPlat1 = base - Math.round(altura * .42);
  const yPlat2 = base - Math.round(altura * .68);
  const yPlat3 = base - Math.round(altura * .88);
  const wPlat1 = largura;
  const wPlat2 = Math.round(largura * .82);
  const wPlat3 = Math.round(largura * .58);
  return (
    <g opacity={opacidade}>
      <path d={`M${cx - 18} ${base}l11 -28h14l11 28Z`} fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".7" />
      <path d={`M${xCol} ${base}V${topo + 24}l${wColuna / 2} -24 ${wColuna / 2} 24V${base}Z`} fill={face} stroke="var(--oa-energy-dim)" strokeWidth=".75" />
      <path d={`M${cx - Math.round(wPlat1 / 2)} ${yPlat1}l5 -6h${wPlat1 - 10}l5 6 -4 5h-${wPlat1 - 8}Z`} fill="var(--oa-surface)" stroke="var(--oa-energy-dim)" strokeWidth=".7" />
      <path d={`M${cx - Math.round(wPlat2 / 2)} ${yPlat2}l5 -6h${wPlat2 - 10}l5 6 -4 4h-${wPlat2 - 8}Z`} fill="var(--oa-surface)" stroke="var(--oa-energy-dim)" strokeWidth=".7" />
      <path d={`M${cx - Math.round(wPlat3 / 2)} ${yPlat3}l4 -5h${wPlat3 - 8}l4 5 -3 4h-${wPlat3 - 6}Z`} fill="var(--oa-surface)" stroke="var(--oa-energy-dim)" strokeWidth=".7" />
      <path d={`M${cx - Math.round(wPlat1 / 2) + 4} ${yPlat1 + 2}h${wPlat1 - 8}M${cx - Math.round(wPlat2 / 2) + 4} ${yPlat2 + 2}h${wPlat2 - 8}M${cx - Math.round(wPlat3 / 2) + 3} ${yPlat3 + 1}h${wPlat3 - 6}`} stroke="var(--oa-energy)" strokeWidth="1.3" />
      {detalheVivo && (
        <g>
          <path d={`M${cx} ${base - 10}V${topo + 8}`} stroke="var(--oa-energy)" strokeOpacity=".6" strokeWidth="1.1" />
          <path d={`M${cx - Math.round(wPlat1 / 2) + 4} ${yPlat1 - 5}L${xCol} ${yPlat1 - 24}M${cx + Math.round(wPlat1 / 2) - 4} ${yPlat1 - 5}L${xCol + wColuna} ${yPlat1 - 24}M${cx - Math.round(wPlat2 / 2) + 4} ${yPlat2 - 5}L${xCol} ${yPlat2 - 20}M${cx + Math.round(wPlat2 / 2) - 4} ${yPlat2 - 5}L${xCol + wColuna} ${yPlat2 - 20}`} stroke="var(--oa-line)" strokeWidth=".65" />
          <circle className={classeFarol} cx={cx} cy={topo} r="2.2" fill="var(--oa-energy)" />
        </g>
      )}
    </g>
  );
}

// Rastros de voo no céu: arcos fixos; pathLength 100 deixa o traço de luz proporcional em todos.
const rastros = [
  { id: "rastro-0", percurso: "M1010 150Q1190 58 1404 124" },
  { id: "rastro-1", percurso: "M612 262Q760 150 912 204" },
  { id: "rastro-2", percurso: "M1392 306Q1250 226 1128 330" },
  { id: "rastro-3", percurso: "M408 338Q556 244 706 304" },
  { id: "rastro-4", percurso: "M552 116Q704 44 868 98" },
];

/** Panorama arquitetônico de Oa, desenhado em camadas determinísticas de SVG. [COMP-08] */
export function CidadeOa({ className }: ConstructoOaProps) {
  const id = useId().replace(/:/g, "");
  const ceu = `${id}-ceu`;
  const halo = `${id}-halo`;
  const aura = `${id}-aura`;
  const torre = `${id}-torre`;
  const fachada = `${id}-fachada`;
  const silhuetaFundo = `${id}-silhueta-fundo`;
  const horizonte = `${id}-horizonte`;
  const luz = `${id}-luz`;
  const fade = `${id}-fade`;

  return (
    <svg viewBox="0 0 1440 720" className={className} data-oa-motion="cidade" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={ceu} x1="0" y1="0" x2="0" y2="720" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--oa-ink)" /><stop offset=".58" stopColor="var(--oa-surface)" /><stop offset="1" stopColor="var(--oa-ink)" />
        </linearGradient>
        <radialGradient id={halo}>
          <stop stopColor="var(--oa-energy)" stopOpacity=".3" /><stop offset=".5" stopColor="var(--oa-energy-dim)" stopOpacity=".13" />
          <stop offset="1" stopColor="var(--oa-energy)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={aura} cx="925" cy="290" r="235" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--oa-energy)" stopOpacity=".34" />
          <stop offset=".45" stopColor="var(--oa-energy)" stopOpacity=".2" />
          <stop offset=".8" stopColor="var(--oa-energy-dim)" stopOpacity=".16" />
          <stop offset=".93" stopColor="var(--oa-energy)" stopOpacity=".1" />
          <stop offset="1" stopColor="var(--oa-energy)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={torre} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="var(--oa-ink)" /><stop offset=".28" stopColor="var(--oa-surface)" />
          <stop offset=".65" stopColor="var(--oa-energy-dim)" /><stop offset="1" stopColor="var(--oa-ink)" />
        </linearGradient>
        <linearGradient id={fachada} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--oa-energy-dim)" stopOpacity=".58" />
          <stop offset=".32" stopColor="var(--oa-raised)" />
          <stop offset=".74" stopColor="var(--oa-surface)" />
          <stop offset="1" stopColor="var(--oa-ink)" />
        </linearGradient>
        <linearGradient id={silhuetaFundo} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--oa-energy-dim)" stopOpacity=".48" />
          <stop offset=".45" stopColor="var(--oa-surface)" />
          <stop offset="1" stopColor="var(--oa-ink)" />
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
      <ellipse className="oa-vec-cidade-halo" cx="925" cy="288" rx="560" ry="425" fill={`url(#${halo})`} />
      <g fill="var(--oa-text)" opacity=".5">
        {[0, 1, 2].map((grupo) => (
          <g key={`grupo-estrelas-${grupo}`} className={`oa-vec-cidade-estrelas oa-vec-cidade-estrelas-${grupo}`}>
            {estrelas.filter((_, posicao) => posicao % 3 === grupo).map(({ id: estrelaId, x, y, raio }) => <circle key={estrelaId} cx={x} cy={y} r={raio} />)}
          </g>
        ))}
      </g>
      <circle className="oa-vec-cidade-aura" cx="925" cy="290" r="235" fill={`url(#${aura})`} />
      <g stroke="var(--oa-energy)" strokeWidth=".7">
        <circle cx="925" cy="290" r="231" strokeOpacity=".2" />
        <circle cx="925" cy="290" r="241" strokeOpacity=".09" />
        <g className="oa-vec-cidade-anel"><circle cx="925" cy="290" r="235" strokeDasharray="2 10" strokeOpacity=".38" /></g>
        <g className="oa-vec-cidade-arcos"><path d="M704.1722 209.6253A235 235 0 0 1 1124.2914 165.469M1145.8278 209.6253A235 235 0 0 1 1132.4928 400.3258" strokeOpacity=".48" strokeWidth="1" /></g>
        <path d="M925 36v18M676 290h18M1156 290h18M748 114l14 14M1088 451l14 14" strokeOpacity=".45" />
      </g>
      <g stroke="var(--oa-energy)" opacity=".6">
        {rastros.map(({ id: rastroId, percurso }, posicao) => (
          <g key={rastroId}>
            <path d={percurso} strokeOpacity=".1" strokeWidth=".7" />
            <g className={`oa-vec-cidade-rastro oa-vec-cidade-rastro-${posicao}`} strokeDashoffset="-40">
              <path d={percurso} pathLength="100" strokeDasharray="22 178" strokeOpacity=".28" strokeWidth=".9" />
              <path d={percurso} pathLength="100" strokeDasharray="0 11 11 178" strokeOpacity=".6" strokeWidth="1.1" />
              <path d={percurso} pathLength="100" strokeDasharray="0 20.5 1.5 178" stroke="var(--oa-text)" strokeOpacity=".9" strokeWidth="1.6" />
            </g>
          </g>
        ))}
      </g>
      <path d="m0 456 64-18 82 10 68-28 54 14 78-48 56 38 62-24 82 42 52-18 76 24 64-18 68 28 62-12 84 16 98-22 56 16 48-22 68 28 74-24 48 18 78-16 68 26v128H0Z" fill="var(--oa-ink)" />
      <path d="m0 456 64-18 82 10 68-28 54 14 78-48 56 38 62-24 82 42 52-18 76 24 64-18 68 28 62-12 84 16 98-22 56 16 48-22 68 28 74-24 48 18 78-16 68 26v128H0Z" fill="var(--oa-energy-dim)" opacity=".24" />
      <g>
        {prediosFundo.map((predio) => (
          <PredioCidadeOa key={predio.id} predio={predio} faceCurva={`url(#${torre})`} facePlana={`url(#${fachada})`} faceFundo={`url(#${silhuetaFundo})`} />
        ))}
      </g>
      <path d="M0 448h1440v132H0z" fill={`url(#${horizonte})`} />
      <g stroke="var(--oa-line)" strokeWidth="1">
        <path d="M0 532c258-34 508-36 714-14s476 22 726-18v18c-250 40-522 38-726 16S258 514 0 548Z" fill="var(--oa-ink)" />
        <path d="M0 532c258-34 508-36 714-14s476 22 726-18" stroke="var(--oa-energy)" strokeOpacity=".48" />
        {arcosViaduto.map((x) => (
          <path key={`arco-viaduto-${x}`} d={`M${x} 534v40m6-40v40m0-22a32 14 0 0 1 56 0`} strokeOpacity=".48" />
        ))}
      </g>
      <g>
        {passarelasUrbanas.slice(0, 4).map((passarela) => <DesenhoPassarela key={passarela.id} {...passarela} />)}
        {prediosMedios.map((predio) => (
          <PredioCidadeOa key={predio.id} predio={predio} faceCurva={`url(#${torre})`} facePlana={`url(#${fachada})`} faceFundo={`url(#${silhuetaFundo})`} />
        ))}
        {passarelasUrbanas.slice(4).map((passarela) => <DesenhoPassarela key={passarela.id} {...passarela} />)}
      </g>
      <path d="M0 520h1440v76H0z" fill={`url(#${horizonte})`} opacity=".65" />
      <g>
        {prediosFrente.map((predio) => (
          <PredioCidadeOa key={predio.id} predio={predio} faceCurva={`url(#${torre})`} facePlana={`url(#${fachada})`} faceFundo={`url(#${silhuetaFundo})`} />
        ))}
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
        <g stroke="var(--oa-energy)" strokeWidth="1.2" strokeLinecap="round">
          <path className="oa-vec-cidade-fluxo" d="M925 318V180" />
          <path className="oa-vec-cidade-fluxo oa-vec-cidade-fluxo-1" d="M910 316V193M940 316V193" />
          <path className="oa-vec-cidade-fluxo oa-vec-cidade-fluxo-2" d="M866 481V365M984 481V365" />
          <circle className="oa-vec-cidade-ping" cx="925" cy="48" r="10" />
          <circle className="oa-vec-cidade-ping oa-vec-cidade-ping-atrasado" cx="925" cy="48" r="10" />
          <circle className="oa-vec-cidade-farol" cx="925" cy="48" r="2.5" fill="var(--oa-energy)" stroke="none" />
        </g>
        <path className="oa-vec-cidade-cone" d="m909 542-38 79h111l-39-79Z" fill="var(--oa-energy)" opacity=".09" />
        <path d="m916 549-13 72M935 549l13 72" stroke="var(--oa-energy)" strokeOpacity=".5" />
        {[0, 1, 2, 3, 4].map((etapa) => <path key={`marche-${etapa}`} d={`M${858 - etapa * 8} ${552 + etapa * 12}h${138 + etapa * 16}`} stroke="var(--oa-energy-dim)" strokeWidth="2" />)}
      </g>
      <path d="M0 600c320-54 543 20 760 10s377-55 680-26v136H0Z" fill="var(--oa-ink)" />
      <g fill="var(--oa-ink)" stroke="var(--oa-line)" strokeWidth=".7" opacity=".82">
        <path d="m38 604 12-18h54l10 18ZM278 594l10-16h44l10 16ZM512 602l14-20h62l12 20ZM746 608l10-16h38l8 16ZM1064 602l12-18h52l10 18ZM1314 590l12-16h48l10 16Z" />
        <path d="M50 589h42M288 581h32M526 585h48M1076 587h38M1326 577h36" stroke="var(--oa-energy)" strokeOpacity=".55" />
      </g>
      <g stroke="var(--oa-line)" strokeWidth=".6" opacity=".65">
        <path d="m0 697 913-83M263 720l650-106M624 720l289-106M1103 720 939 614M1440 682l-501-68M0 648c485-14 891 2 1440-22M0 687c485-27 891 12 1440-3" />
      </g>
      <path d="M0 572h1440v148H0z" fill={`url(#${fade})`} />
      <path d="M0 499h1440" stroke="var(--oa-energy)" strokeOpacity=".08" />
      <g stroke="var(--oa-energy)" strokeWidth="1" opacity=".45">
        <g className="oa-vec-cidade-veiculo"><path d="m1157 156 42-14 18 2-42 14Z" /></g>
        <g className="oa-vec-cidade-veiculo oa-vec-cidade-veiculo-1"><path d="M591 304l31-10 12 2-31 10Z" /></g>
        <g className="oa-vec-cidade-veiculo oa-vec-cidade-veiculo-2"><path d="M304 209l24-8 10 2-24 8Z" /></g>
      </g>
    </svg>
  );
}
