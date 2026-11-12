'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { constructosLanternas } from '@/components/oanet/GaleriaConstructos'

/*
 * Lanternas em cena (worker: Lanternas). Interface combinada:
 * - CamadaLanternas: camada ambiente do deck atrás dos slides, sutil e variada.
 * - ChamadaTropa: a Tropa reunida no slide de conclusão (25 Lanternas).
 */

export const CAPITULOS = ['capa', 'parte-1', 'parte-2', 'parte-3', 'conclusao'] as const

export type CapituloId = (typeof CAPITULOS)[number]

export type PadraoVooId =
  | 'formacao-v'
  | 'cruzamento-duplo'
  | 'revoada-ascendente'
  | 'vetor-vanguarda'
  | 'passagem-longe'
  | 'patrulha-borda'
  | 'rasante-lateral'
  | 'par-distante'

export type CometaDef = {
  classeVoo: string
  construto?: React.ComponentType<{ className?: string }>
}

export type PadraoVoo = {
  id: PadraoVooId
  nome: string
  vistoso: boolean
  cometas: CometaDef[]
}

const PADROES_CAPITULO_IDS: PadraoVooId[] = [
  'formacao-v',
  'cruzamento-duplo',
  'revoada-ascendente',
  'vetor-vanguarda',
]

const PADROES_DISCRETOS_IDS: PadraoVooId[] = [
  'passagem-longe',
  'patrulha-borda',
  'rasante-lateral',
  'par-distante',
]

const arteLanterna = (nome: string) => constructosLanternas.find((c) => c.nome === nome)?.Arte

export const PADROES_VOO: Record<PadraoVooId, PadraoVoo> = {
  'formacao-v': {
    id: 'formacao-v',
    nome: 'Formação em V',
    vistoso: true,
    cometas: [
      { classeVoo: 'dk-voo-v-lider', construto: arteLanterna('Hal Jordan') },
      { classeVoo: 'dk-voo-v-asa-sup' },
      { classeVoo: 'dk-voo-v-asa-inf' },
    ],
  },
  'cruzamento-duplo': {
    id: 'cruzamento-duplo',
    nome: 'Cruzamento Duplo',
    vistoso: true,
    cometas: [
      { classeVoo: 'dk-voo-cruz-desc', construto: arteLanterna('Katma Tui') },
      { classeVoo: 'dk-voo-cruz-asc' },
    ],
  },
  'revoada-ascendente': {
    id: 'revoada-ascendente',
    nome: 'Revoada Ascendente',
    vistoso: true,
    cometas: [
      { classeVoo: 'dk-voo-asc-1', construto: arteLanterna('Kilowog') },
      { classeVoo: 'dk-voo-asc-2' },
      { classeVoo: 'dk-voo-asc-3' },
    ],
  },
  'vetor-vanguarda': {
    id: 'vetor-vanguarda',
    nome: 'Vetor Vanguarda',
    vistoso: true,
    cometas: [
      { classeVoo: 'dk-voo-vanguarda-1', construto: arteLanterna('Abin Sur') },
      { classeVoo: 'dk-voo-vanguarda-2' },
    ],
  },
  'passagem-longe': {
    id: 'passagem-longe',
    nome: 'Passagem ao Longe',
    vistoso: false,
    cometas: [{ classeVoo: 'dk-voo-passagem-longe' }],
  },
  'patrulha-borda': {
    id: 'patrulha-borda',
    nome: 'Patrulha de Borda',
    vistoso: false,
    cometas: [{ classeVoo: 'dk-voo-patrulha-borda' }],
  },
  'rasante-lateral': {
    id: 'rasante-lateral',
    nome: 'Rasante Lateral',
    vistoso: false,
    cometas: [{ classeVoo: 'dk-voo-rasante-lateral' }],
  },
  'par-distante': {
    id: 'par-distante',
    nome: 'Par Distante',
    vistoso: false,
    cometas: [
      { classeVoo: 'dk-voo-par-distante-1' },
      { classeVoo: 'dk-voo-par-distante-2' },
    ],
  },
}

export function ehCapitulo(slideId: string): boolean {
  return (CAPITULOS as readonly string[]).includes(slideId)
}

/** Calcula semente determinística inteira a partir de slideId e chave. */
export function gerarSemente(slideId: string, chave: number): number {
  let hash = (Math.floor(chave) ^ 0x9e3779b9) >>> 0
  for (let i = 0; i < slideId.length; i++) {
    hash = Math.imul(hash ^ slideId.charCodeAt(i), 0x5bd1e995) >>> 0
  }
  return hash
}

/**
 * Escolhe o padrão de voo de forma puramente determinística.
 * - Capítulos: sempre passam uma formação vistosa, sem repetir o anterior consecutivo.
 * - Demais slides: discreto em 1 de cada 3 trocas pelas bordas, sem repetir o anterior.
 */
export function escolherPadraoVoo(
  slideId: string,
  chave: number,
  padraoAnteriorId?: string | null
): PadraoVoo | null {
  const semente = gerarSemente(slideId, chave)

  if (ehCapitulo(slideId)) {
    const total = PADROES_CAPITULO_IDS.length
    let indice = semente % total
    if (PADROES_CAPITULO_IDS[indice] === padraoAnteriorId) {
      indice = (indice + 1) % total
    }
    return PADROES_VOO[PADROES_CAPITULO_IDS[indice]]
  }

  // Moderação nos slides técnicos: 1 a cada 3 trocas exibe padrão discreto.
  if (semente % 3 !== 0) return null

  const total = PADROES_DISCRETOS_IDS.length
  let indice = Math.floor(semente / 3) % total
  if (PADROES_DISCRETOS_IDS[indice] === padraoAnteriorId) {
    indice = (indice + 1) % total
  }
  return PADROES_VOO[PADROES_DISCRETOS_IDS[indice]]
}

/** Hook reativo para preferência de movimento reduzido no cliente. */
function useReduzirMovimento(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener?.('change', onStoreChange)
      return () => mq.removeEventListener?.('change', onStoreChange)
    },
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  )
}

/** Cometa de energia esmeralda com núcleo, símbolo e rastro. */
function CometaLanterna({ cometa }: { cometa: CometaDef }) {
  const ConstrutoArte = cometa.construto
  return (
    <div className={`dk-lanterna-cometa ${cometa.classeVoo}`}>
      <div className="dk-cometa-rastro" />
      <div className="dk-cometa-nucleo">
        <span className="dk-cometa-halo" />
        <svg viewBox="0 0 24 24" className="dk-cometa-simbolo" focusable="false" aria-hidden="true">
          <path d="M5 4h14v2.5H5zM5 17.5h14V20H5z" />
          <circle cx="12" cy="12" r="4.8" strokeWidth="2" fill="none" />
        </svg>
      </div>
      {ConstrutoArte && (
        <div className="dk-cometa-construto" aria-hidden="true">
          <ConstrutoArte />
        </div>
      )}
    </div>
  )
}

/**
 * CamadaLanternas: camada ambiente que cruza suavemente o fundo do deck.
 * Movimento determinístico e temporizado (1,5–3s), sumindo após a passagem.
 */
export function CamadaLanternas({ slideId, chave }: { slideId: string; chave: number }) {
  const reduzirMovimento = useReduzirMovimento()
  const [padrao, setPadrao] = useState<PadraoVoo | null>(() => escolherPadraoVoo(slideId, chave, null))
  const historicoRef = useRef<string | null>(padrao?.id ?? null)

  useEffect(() => {
    const proximo = escolherPadraoVoo(slideId, chave, historicoRef.current)
    if (proximo) {
      historicoRef.current = proximo.id
    }
    setPadrao(proximo)
  }, [slideId, chave])

  if (reduzirMovimento || !padrao) return null

  return (
    <div key={`${slideId}-${chave}`} className="dk-lanternas-camada" aria-hidden="true">
      {padrao.cometas.map((cometa, i) => (
        <CometaLanterna key={`${padrao.id}-${i}`} cometa={cometa} />
      ))}
    </div>
  )
}

/** Item individual de membro da Tropa com anel OANET acendendo em onda. */
function MembroTropaItem({
  lanterna,
  indice,
}: {
  lanterna: (typeof constructosLanternas)[number]
  indice: number
}) {
  const rawId = useId().replace(/:/g, '')
  const gradId = `dk-grad-anel-${rawId}`

  return (
    <li
      className="dk-tropa-membro"
      style={{ '--dk-ordem': indice } as React.CSSProperties}
      title={`${lanterna.nome} · ${lanterna.titulo}`}
    >
      <div className="dk-tropa-anel" aria-hidden="true">
        <svg viewBox="0 0 44 44" className="dk-tropa-svg" focusable="false">
          <defs>
            <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="42%" stopColor="var(--oa-energy)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--oa-energy)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="22" cy="22" r="20" className="dk-tropa-aro-ext" />
          <circle cx="22" cy="22" r="15" className="dk-tropa-aro-int" />
          <circle cx="22" cy="22" r="10" className="dk-tropa-nucleo-luz" fill={`url(#${gradId})`} />
          <path d="M14 13h16v2.2H14zM14 28.8h16V31H14z" className="dk-tropa-simbolo-barra" />
          <circle cx="22" cy="22" r="4.5" className="dk-tropa-simbolo-anel" />
        </svg>
      </div>
      <span className="dk-tropa-nome">{lanterna.nome}</span>
      <span className="dk-sr">{` · ${lanterna.titulo}`}</span>
    </li>
  )
}

/**
 * ChamadaTropa: Os 25 Lanternas reunidos na conclusão.
 * Acendem em onda com mola elástica e permanecem com respiração sutil.
 */
export function ChamadaTropa({ className = '' }: { className?: string }) {
  return (
    <div className={`dk-tropa ${className}`.trim()}>
      <ul className="dk-tropa-grade" aria-label="Os 25 Lanternas da Tropa">
        {constructosLanternas.map((lanterna, indice) => (
          <MembroTropaItem key={lanterna.nome} lanterna={lanterna} indice={indice} />
        ))}
      </ul>
    </div>
  )
}
