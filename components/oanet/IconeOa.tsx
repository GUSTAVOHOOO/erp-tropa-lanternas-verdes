import type { ReactNode, SVGProps } from "react";

export type IconeOaNome =
  | "painel" | "pessoal" | "setores" | "ocorrencias" | "missoes"
  | "equipamentos" | "hierarquia" | "relatorios" | "comunicacoes"
  | "seta" | "mais" | "menos" | "alvo" | "sino" | "configuracao"
  | "sair" | "menu" | "fechar" | "busca" | "escudo" | "energia"
  | "verificado" | "olho" | "pausa" | "play" | "codigo" | "brilho";

const geometrias: Record<IconeOaNome, ReactNode> = {
  painel: <><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" /><path d="M6 6h1M17 6h1M6 17h1M17 17h1" /></>,
  pessoal: <><path d="M9 3h6l2 3-2 6H9L7 6zM5 21v-4l4-3h6l4 3v4M2 9v5l3 2M22 9v5l-3 2" /><path d="M9 7h6M10 18h4" /></>,
  setores: <><path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5v5" /><path d="m6 14 3 1.7M15 18l3-1.7" /></>,
  ocorrencias: <><path d="M9 3h6l7 13-3 5H5l-3-5zM12 8v6M12 17h.01" /><path d="M8 6 4 14M17 19h2l1-2" /></>,
  missoes: <><path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z" /><path d="m9 12 2 2 4-4" /></>,
  equipamentos: <><path d="M8 3h8l3 4-2 5H7L5 7zM7 12l-2 6 3 3h8l3-3-2-6M9 3V1h6v2" /><circle cx="12" cy="8" r="2" /><path d="M9 17h6" /></>,
  hierarquia: <><path d="M9 2h6v6H9zM2 16h6v6H2zM16 16h6v6h-6zM12 8v4M5 16v-4h14v4" /><path d="M10 19h4" /></>,
  relatorios: <><path d="M5 2h10l5 5v15H5zM15 2v5h5M9 17v-4M12 17v-7M15 17v-2M8 20h9" /></>,
  comunicacoes: <><path d="M2 5h16l4 4v9H9l-5 4v-4H2zM6 9h9M6 13h6" /><path d="M18 1a5 5 0 0 1 5 5" /></>,
  seta: <><path d="M4 12h15M13 5l7 7-7 7" /><path d="M4 8v8" /></>,
  mais: <path d="M12 4v16M4 12h16" />,
  menos: <path d="M4 12h16" />,
  alvo: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 1v5M12 18v5M1 12h5M18 12h5" /></>,
  sino: <><path d="M5 17V9l3-4h8l3 4v8l2 2H3zM10 22h4M12 2v3" /><path d="M8 10v5" /></>,
  configuracao: <><path d="m9 2-1 3-3 1-3 5 2 2v4l5 3 3-1 3 1 5-3v-4l2-2-3-5-3-1-1-3z" /><circle cx="12" cy="11.5" r="3.5" /></>,
  sair: <><path d="M10 3H4v18h6M9 12h13M17 7l5 5-5 5" /><path d="M7 6H4M7 18H4" /></>,
  menu: <path d="M3 5h18M3 12h13M3 19h18" />,
  fechar: <path d="m5 5 14 14M19 5 5 19" />,
  busca: <><circle cx="10" cy="10" r="6" /><path d="m14.5 14.5 6 6M7 10a3 3 0 0 1 3-3" /></>,
  escudo: <><path d="m12 2 9 4v7l-3 5-6 4-6-4-3-5V6z" /><path d="m8 12 3 3 5-6M7 7l5-2" /></>,
  energia: <><path d="M13 2 4 14h7l-1 8 10-13h-7z" /><path d="M3 4h4M18 20h4" /></>,
  verificado: <><path d="m12 2 4 2 4 1 1 5-1 5-4 2-4 5-4-5-4-2-1-5 1-5 4-1z" /><path d="m7 11 3 3 7-7" /></>,
  olho: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /><path d="M12 2V1M12 23v-1" /></>,
  pausa: <><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></>,
  play: <path d="m7 3 14 9-14 9z" />,
  codigo: <><path d="m7 5-6 7 6 7M17 5l6 7-6 7M14 3l-4 18" /></>,
  brilho: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m12 8 1.5 2.5L16 12l-2.5 1.5L12 16l-1.5-2.5L8 12l2.5-1.5z" /><path d="M5 5l2 2M17 17l2 2" /></>,
};

type IconeOaProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  nome: IconeOaNome;
};

/** Símbolos originais do terminal OANET, decorativos por padrão. [COMP-08] */
export function IconeOa({ nome, className, ...svgProps }: IconeOaProps) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45"
      strokeLinecap="square" strokeLinejoin="miter" className={className}
      aria-hidden="true" focusable="false" {...svgProps}
    >
      {geometrias[nome]}
    </svg>
  );
}
