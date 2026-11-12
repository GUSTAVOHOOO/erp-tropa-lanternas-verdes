'use client'

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { EmblemaOa } from '@/components/oanet/EmblemaOa'
import { IconeOa, type IconeOaNome } from '@/components/oanet/IconeOa'
import { BotaoOa, MolduraOa, SeloOa } from '@/components/oanet/PainelOa'
import { MOLAS, duracaoMola, posicaoMola } from './mola'

/*
 * Blocos dos slides. A coreografia vem do CSS (`apresentacao.css`):
 * `dk-t1`…`dk-t10` atrasam um bloco inteiro e os filhos de `dk-cascata`
 * entram em sequência. Cada bloco aceita `variante`, que escolhe a forma de
 * entrar (biblioteca de entradas em apresentacao.css). Nada depende de relógio.
 */

type ComClasse = { className?: string }

export type VarianteTitulo = 'letra' | 'mascara' | 'palavras' | 'terminal'
export type VariantePainel = 'varredura' | 'holograma' | 'desdobrar' | 'foco'
export type VarianteTabela = 'varredura' | 'colunas' | 'celulas'
export type VarianteLista = 'marcador' | 'digitar' | 'sublinhado'
export type VarianteCartoes = 'entrar' | 'virar' | 'desdobrar' | 'montar'
export type VarianteCodigo = 'digitar' | 'revelar' | 'foco'
export type VarianteContador = 'mola' | 'odometro' | 'holograma'
export type VarianteSelos = 'carimbo' | 'pisca' | 'desliza'
export type VarianteEtapas = 'trilho' | 'pulso'
export type VarianteProva = 'entrar' | 'deriva' | 'foco'

/** Código e assunto do slide, em fonte de terminal. */
export function Rotulo({ codigo, children, className = '' }: { codigo: string; children: ReactNode } & ComClasse) {
  return <p className={`dk-rotulo dk-entra ${className}`}><b>{codigo}</b><i aria-hidden="true">{'//'}</i>{children}</p>
}

/**
 * Título do slide. `letra` monta letra a letra (só em poucos slides); as outras
 * variantes mudam o gesto: máscara da esquerda, palavras subindo, cintilação.
 * Leitores de tela recebem a frase inteira.
 */
export function Titulo({ texto, className = '', nivel = 'slide', variante = 'letra' }: {
  texto: string; nivel?: 'capa' | 'capitulo' | 'slide'; variante?: VarianteTitulo
} & ComClasse) {
  const palavras = texto.split(' ')
  return (
    <h2 className={`dk-titulo dk-titulo--${nivel} dk-titulo--${variante} ${className}`} aria-label={texto}>
      {palavras.map((palavra, p) => (
        <span key={`${palavra}-${p}`} className="dk-palavra" aria-hidden="true">
          {[...palavra].map((letra, l) => <span key={l} className="dk-letra">{letra}</span>)}
        </span>
      ))}
    </h2>
  )
}

export function Subtitulo({ children, className = '' }: { children: ReactNode } & ComClasse) {
  return <p className={`dk-subtitulo dk-entra dk-entra--foco ${className}`}>{children}</p>
}

/** Painel OANET; a variante escolhe se a luz sólida varre, cintila, desdobra ou entra em foco. */
export function Painel({ titulo, icone, children, className = '', acao, variante = 'varredura' }: {
  titulo?: string; icone?: IconeOaNome; children: ReactNode; acao?: ReactNode; variante?: VariantePainel
} & ComClasse) {
  const varredura = variante === 'varredura' ? 'dk-constroi' : ''
  return <div className={`dk-painel dk-painel--${variante} ${varredura} ${className}`}><MolduraOa titulo={titulo} icone={icone} acao={acao}><div className="dk-painel-corpo">{children}</div></MolduraOa></div>
}

/** Lista com marcador de energia; o marcador acende antes, e o texto entra depois. */
export function Lista({ itens, variante = 'marcador', className = '' }: { itens: ReactNode[]; variante?: VarianteLista } & ComClasse) {
  return <ul className={`dk-lista dk-lista--${variante} dk-cascata ${className}`}>{itens.map((item, i) => <li key={i}><i aria-hidden="true" /><span>{item}</span></li>)}</ul>
}

export type LinhaRegra = { id?: string; requisito: ReactNode; prova: ReactNode }

/** Tabela "requisito → onde está": varredura por linha, colunas abrindo ou células acendendo. */
export function TabelaRegras({ linhas, cabecalho = ['Requisito', 'No código'], variante = 'varredura', className = '' }: {
  linhas: LinhaRegra[]; cabecalho?: [string, string]; variante?: VarianteTabela
} & ComClasse) {
  return (
    <table className={`dk-tabela dk-tabela--${variante} ${className}`}>
      <thead className="dk-entra"><tr><th scope="col">{cabecalho[0]}</th><th scope="col">{cabecalho[1]}</th></tr></thead>
      <tbody className="dk-cascata">
        {linhas.map((linha, i) => (
          <tr key={i}>
            <th scope="row">{linha.id && <span className="dk-id">{linha.id}</span>}<span>{linha.requisito}</span></th>
            <td>{linha.prova}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Cenário de prova com o selo carimbado ao final da linha. */
export function TabelaProva({ linhas, variante = 'entrar', className = '' }: {
  linhas: [ReactNode, ReactNode][]; variante?: VarianteProva
} & ComClasse) {
  return (
    <ul className={`dk-prova dk-prova--${variante} dk-cascata ${className}`}>
      {linhas.map(([cenario, resultado], i) => (
        <li key={i}>
          <span className="dk-prova-cenario">{cenario}</span>
          <span className="dk-prova-seta" aria-hidden="true" />
          <span className="dk-prova-resultado">{resultado}</span>
          <span className="dk-carimbo"><IconeOa nome="verificado" /><span className="dk-sr">aprovado</span></span>
        </li>
      ))}
    </ul>
  )
}

function preferePoucoMovimento() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Dígitos que rolam como odômetro: cada coluna é uma faixa de 0 a 9 até o dígito final. */
function Odometro({ texto }: { texto: string }) {
  return (
    <span className="dk-odo" aria-hidden="true">
      {[...texto].map((caractere, i) => (/\d/.test(caractere)
        ? (
          <span key={i} className={`dk-odo-coluna dk-odo-d${caractere}`}>
            <span className="dk-odo-faixa">{'0123456789'.split('').map((digito) => <span key={digito}>{digito}</span>)}</span>
          </span>
        )
        : <span key={i} className="dk-odo-sep">{caractere}</span>))}
    </span>
  )
}

/**
 * Número do slide. `mola` sobe pela curva firme (JavaScript, com valor final no
 * texto desde o início); `odometro` rola por CSS; `holograma` cintila e depois
 * conta. O valor final está sempre no texto lido por leitores de tela.
 */
export function Contador({ valor, rotulo, prefixo = '', sufixo = '', detalhe, variante = 'mola', className = '' }: {
  valor: number; rotulo: string; prefixo?: string; sufixo?: string; detalhe?: string; variante?: VarianteContador
} & ComClasse) {
  const [exibido, setExibido] = useState(valor)
  const raizRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (variante === 'odometro' || preferePoucoMovimento()) return
    const atraso = Number.parseFloat(getComputedStyle(raizRef.current!).animationDelay) * 1000 || 0
    const duracao = duracaoMola(MOLAS.contagem)
    const inicio = performance.now() + atraso
    let quadro = 0
    const passo = (agora: number) => {
      const t = Math.max(0, agora - inicio) / 1000
      if (t >= duracao) return setExibido(valor)
      setExibido(Math.round(valor * Math.min(1, posicaoMola(t, MOLAS.contagem))))
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [valor, variante])
  const texto = valor.toLocaleString('pt-BR')
  return (
    <div ref={raizRef} className={`dk-contador dk-entra dk-contador--${variante} ${className}`}>
      <strong aria-hidden="true">{prefixo}{variante === 'odometro' ? <Odometro texto={texto} /> : exibido.toLocaleString('pt-BR')}{sufixo}</strong>
      <span className="dk-sr">{prefixo}{texto}{sufixo}</span>
      <span className="dk-contador-rotulo">{rotulo}</span>
      {detalhe && <small>{detalhe}</small>}
    </div>
  )
}

const TOKENS = /(\/\/.*$|\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|\b(import|from|export|const|let|async|await|function|return|if|else|throw|new|type|true|false|null)\b|\b(\d+)\b/g

function colorir(linha: string): ReactNode[] {
  const partes: ReactNode[] = []
  let ultimo = 0
  for (const achado of linha.matchAll(TOKENS)) {
    const inicio = achado.index ?? 0
    if (inicio > ultimo) partes.push(linha.slice(ultimo, inicio))
    const classe = achado[1] ? 'dk-c-comentario' : achado[2] ? 'dk-c-texto' : achado[3] ? 'dk-c-chave' : 'dk-c-numero'
    partes.push(<span key={inicio} className={classe}>{achado[0]}</span>)
    ultimo = inicio + achado[0].length
  }
  if (ultimo < linha.length) partes.push(linha.slice(ultimo))
  return partes
}

/** Trecho de código: digitado, revelado por linha ou com foco em cada linha. */
export function Codigo({ linhas, arquivo, variante = 'digitar', className = '' }: {
  linhas: string[]; arquivo: string; variante?: VarianteCodigo
} & ComClasse) {
  const digitar = variante === 'digitar'
  return (
    <figure className={`dk-codigo dk-codigo--${variante} ${digitar ? 'dk-constroi' : ''} ${className}`}>
      <figcaption><IconeOa nome="codigo" />{arquivo}</figcaption>
      <pre><code className={`dk-cascata ${digitar ? 'dk-cascata--rapida' : `dk-cascata--${variante}`}`}>{linhas.map((linha, i) => <span key={i} className="dk-linha">{linha ? colorir(linha) : ' '}</span>)}</code></pre>
    </figure>
  )
}

export type Etapa = { titulo: string; texto: ReactNode; icone: IconeOaNome }

/** Linha do tempo: o traço acende (trilho) ou cada marco pulsa ao chegar (pulso). */
export function Etapas({ etapas, variante = 'trilho', className = '' }: { etapas: Etapa[]; variante?: VarianteEtapas } & ComClasse) {
  return (
    <ol className={`dk-etapas dk-etapas--${variante} ${className}`}>
      {etapas.map((etapa, i) => (
        <li key={etapa.titulo} className="dk-etapa">
          <span className="dk-etapa-no" aria-hidden="true"><IconeOa nome={etapa.icone} /></span>
          <span className="dk-etapa-numero">{String(i + 1).padStart(2, '0')}</span>
          <strong>{etapa.titulo}</strong>
          <p>{etapa.texto}</p>
        </li>
      ))}
      <li className="dk-etapas-trilho" aria-hidden="true"><span /></li>
    </ol>
  )
}

/** Grade de cartões curtos com ícone. */
export function Cartoes({ itens, variante = 'entrar', className = '' }: {
  itens: { icone: IconeOaNome; titulo: string; texto: ReactNode; selo?: string }[]; variante?: VarianteCartoes
} & ComClasse) {
  return (
    <div className={`dk-cartoes dk-cartoes--${variante} dk-cascata ${className}`}>
      {itens.map((item) => (
        <article key={item.titulo} className="dk-cartao">
          <span className="dk-cartao-icone" aria-hidden="true"><IconeOa nome={item.icone} /></span>
          <div>
            <h3>{item.titulo}{item.selo && <SeloOa>{item.selo}</SeloOa>}</h3>
            <p>{item.texto}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

/** Fluxo da requisição: navegador → Next → API → banco, com energia correndo nos cabos. */
export function DiagramaArquitetura() {
  const nos = [
    { x: 0, titulo: 'Navegador', linhas: ['HTML + CSS', 'nunca vê o token', 'não chama a API'] },
    { x: 433, titulo: 'Next.js 16', linhas: ['Server Components', 'Server Actions', 'cookie httpOnly'] },
    { x: 866, titulo: 'API NestJS 12', linhas: ['controller → service', '→ repository', 'JWT + papéis'] },
    { x: 1300, titulo: 'SQLite', linhas: ['TypeORM', 'migrations', 'seed: 25 Lanternas'] },
  ]
  const cabos = [
    { x: 300, rotulo: 'HTML · cookie' },
    { x: 733, rotulo: 'Bearer JWT · JSON' },
    { x: 1166, rotulo: 'SQL parametrizado' },
  ]
  return (
    <svg className="dk-diagrama" viewBox="-10 128 1620 262" role="img" aria-label="Arquitetura: o navegador fala só com o Next.js; o Next.js chama a API NestJS com o token; a API grava no SQLite.">
      {cabos.map((cabo, i) => (
        <g key={cabo.x} className="dk-cabo">
          <text x={cabo.x + 66} y="150" textAnchor="middle" className="dk-cabo-rotulo">{cabo.rotulo}</text>
          <path className="dk-traco" pathLength={1} d={`M${cabo.x} 235h133`} />
          <path className="dk-fluxo" d={`M${cabo.x} 235h133`} />
          <circle className={`dk-pulso dk-pulso-${i}`} cx={cabo.x} cy="235" r="6" />
        </g>
      ))}
      {nos.map((no, i) => (
        <g key={no.titulo} className="dk-no">
          <path className="dk-no-caixa" d={`M${no.x + 18} 160h${246}l18 18v${134}l-18 18h-${246}l-18-18v-${134}z`} />
          <path className="dk-no-brilho" d={`M${no.x + 18} 160h80`} />
          <text x={no.x + 150} y="214" textAnchor="middle" className="dk-no-titulo">{no.titulo}</text>
          {no.linhas.map((linha, l) => <text key={linha} x={no.x + 150} y={252 + l * 28} textAnchor="middle" className="dk-no-linha">{linha}</text>)}
          <text x={no.x + 150} y="370" textAnchor="middle" className="dk-no-codigo">{`0${i + 1}`}</text>
        </g>
      ))}
      <g className="dk-cadeado">
        <path d="M365 280v-12a14 14 0 0 1 28 0v12" />
        <rect x="358" y="280" width="42" height="32" />
        <text x="379" y="345" textAnchor="middle">token fica aqui</text>
      </g>
    </svg>
  )
}

/** Órbita de agentes: o coordenador no centro, o Orca como anel e os workers por fora. */
export function OrbitaAgentes() {
  const externos = [
    { nome: 'Codex', papel: 'contrato e OANET', x: 150, y: 170 },
    { nome: 'Gemini', papel: 'UI e testes', x: 750, y: 170 },
    { nome: 'Haiku', papel: 'docs e auditoria', x: 750, y: 730 },
    { nome: 'GitHub', papel: 'PRs revisados', x: 150, y: 730 },
  ]
  return (
    <svg className="dk-orbita" viewBox="0 0 900 900" role="img" aria-label="Claude Code coordena no centro; o Orca distribui o trabalho para Codex, Gemini e Haiku; tudo entra no GitHub por PR revisado.">
      <circle className="dk-orbita-anel dk-orbita-anel--externo" cx="450" cy="450" r="390" />
      <circle className="dk-orbita-anel dk-orbita-anel--orca" cx="450" cy="450" r="230" />
      <g className="dk-orbita-giro"><circle cx="450" cy="450" r="230" className="dk-orbita-tracejado" /></g>
      <g className="dk-orbita-giro dk-orbita-giro--reverso"><circle cx="450" cy="450" r="390" className="dk-orbita-tracejado dk-orbita-tracejado--fino" /></g>
      {externos.map((no, i) => (
        <g key={no.nome}>
          <path className="dk-orbita-raio" d={`M450 450L${no.x} ${no.y}`} />
          <circle className={`dk-orbita-pulso dk-orbita-pulso-${i}`} r="5" cx="450" cy="450" />
        </g>
      ))}
      <text x="450" y="205" textAnchor="middle" className="dk-orbita-orca">ORCA · ORQUESTRAÇÃO</text>
      <circle className="dk-orbita-centro" cx="450" cy="450" r="112" />
      <text x="450" y="440" textAnchor="middle" className="dk-orbita-titulo">Claude Code</text>
      <text x="450" y="474" textAnchor="middle" className="dk-orbita-papel">coordena e revisa</text>
      {externos.map((no) => (
        <g key={no.nome} className="dk-orbita-no">
          <circle cx={no.x} cy={no.y} r="82" />
          <text x={no.x} y={no.y - 4} textAnchor="middle" className="dk-orbita-titulo dk-orbita-titulo--menor">{no.nome}</text>
          <text x={no.x} y={no.y + 26} textAnchor="middle" className="dk-orbita-papel">{no.papel}</text>
        </g>
      ))}
    </svg>
  )
}

/** Três camadas do back empilhadas, com a requisição descendo e a resposta subindo. */
export function CamadasBack() {
  const camadas = [
    { nome: 'Controller', verbo: 'traduz', detalhe: 'só HTTP · uma chamada ao service · sem if de regra' },
    { nome: 'Service', verbo: 'decide', detalhe: 'regras de negócio · sem @Req nem @Res · lança ErroDominio' },
    { nome: 'Repository', verbo: 'guarda', detalhe: 'único que fala com o banco · devolve nulo, não 404' },
  ]
  return (
    <div className="dk-camadas dk-cascata">
      {camadas.map((camada) => (
        <div key={camada.nome} className="dk-camada">
          <strong>{camada.nome}</strong>
          <em>{camada.verbo}</em>
          <span>{camada.detalhe}</span>
        </div>
      ))}
      <span className="dk-camadas-feixe" aria-hidden="true" />
    </div>
  )
}

/** Abertura de capítulo: numeral preenchido com a energia, título e o construto do capítulo. */
export function Capitulo({ numero, parte, titulo, texto, minutos, apresentador, Arte, legenda, variante = 'palavras' }: {
  numero: string; parte: string; titulo: string; texto: string; minutos: number; apresentador?: string
  Arte: ComponentType<{ className?: string }>; legenda: string; variante?: VarianteTitulo
}) {
  return (
    <div className="dk-capitulo">
      <span className="dk-capitulo-numeral" aria-hidden="true">{numero}</span>
      <div className="dk-capitulo-texto">
        <Rotulo codigo={parte}>{minutos} minutos</Rotulo>
        <Titulo texto={titulo} nivel="capitulo" variante={variante} />
        <Subtitulo>{texto}</Subtitulo>
        {apresentador && <p className="dk-capitulo-apresentador dk-entra dk-t6"><IconeOa nome="pessoal" />{apresentador}</p>}
      </div>
      <figure className="dk-capitulo-arte">
        <Arte className="oa-lantern-construct" />
        <figcaption className="dk-entra dk-t7">{legenda}</figcaption>
      </figure>
    </div>
  )
}

/*
 * Tela real do sistema em 375 × 812 (9:19,5), dentro de um aparelho com a moldura.
 * Os estados são: aparelho surge → tela liga com varredura → linhas em cascata →
 * selo de gravidade carimbado → botão com anel de foco pulsando.
 * Conteúdo ilustrativo; o conjunto é escalado por --dk-cel (apresentacao.css).
 */
export function Celular() {
  return (
    <div className="dk-celular dk-surge dk-t4" aria-hidden="true">
      <div className="dk-celular-escala">
        <div className="dk-aparelho">
          <span className="dk-botao-lateral dk-botao-lateral--acao" />
          <span className="dk-botao-lateral dk-botao-lateral--volume" />
          <span className="dk-botao-lateral dk-botao-lateral--energia" />
          <div className="dk-celular-tela">
            <span className="dk-celular-varredura" />
            <div className="dk-celular-status">
              <span>09:41</span>
              <span className="dk-celular-ilha" />
              <span className="dk-celular-sinal"><i /><i /><i /><i /></span>
            </div>
            <header className="dk-celular-topo">
              <EmblemaOa className="dk-celular-emblema" />
              <strong>OANET</strong>
              <IconeOa nome="sino" />
            </header>
            <div className="dk-celular-corpo">
              <h3 className="dk-celular-pagina">Ocorrências</h3>
              <p className="dk-celular-meta">Setor 2814 · 3 abertas</p>
              <div className="dk-celular-campo"><IconeOa nome="busca" /><span>Buscar por título</span></div>
              <ul className="dk-celular-lista dk-cascata">
                <li className="dk-celular-item">
                  <span><strong>Fenda em Korugar</strong><small>aberta · há 2 h</small></span>
                  <span className="dk-celular-carimbo"><SeloOa tom="vermelho">crítica</SeloOa></span>
                </li>
                <li className="dk-celular-item">
                  <span><strong>Sinal em Thanagar</strong><small>em análise · há 5 h</small></span>
                  <SeloOa tom="ambar">média</SeloOa>
                </li>
                <li className="dk-celular-item">
                  <span><strong>Eco em Oa</strong><small>resolvida · ontem</small></span>
                  <SeloOa tom="neutro">baixa</SeloOa>
                </li>
              </ul>
            </div>
            <div className="dk-celular-rodape">
              <span className="dk-celular-anel"><BotaoOa tabIndex={-1} className="dk-celular-botao">Registrar ocorrência</BotaoOa></span>
              <span className="dk-celular-barra" />
            </div>
          </div>
        </div>
      </div>
      <small className="dk-celular-legenda">375 px</small>
    </div>
  )
}
