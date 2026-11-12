'use client'

import type { ReactElement } from 'react'
import { EmblemaOa } from '@/components/oanet/EmblemaOa'
import { BateriaOa } from '@/components/oanet/ConstructosOa'
import { constructosHumanos } from '@/components/oanet/ConstructosHumanos'
import { IconeOa, type IconeOaNome } from '@/components/oanet/IconeOa'
import { SeloOa } from '@/components/oanet/PainelOa'
import {
  Celular, CamadasBack, Capitulo, Cartoes, Codigo, Contador, DiagramaArquitetura, Etapas, Lista,
  OrbitaAgentes, Painel, Rotulo, Subtitulo, TabelaProva, TabelaRegras, Titulo,
} from './blocos'

/*
 * Conteúdo da apresentação final. Fonte: docs/APRESENTACAO.md.
 * Para pôr os nomes nas aberturas de capítulo, preencha APRESENTADORES.
 */
export const EQUIPE = ['Gustavo Romagnoli Mazur', 'Caio Macedo', 'Ian Fornaziero']
export const APRESENTADORES: Record<1 | 2 | 3, string> = { 1: '', 2: '', 3: '' }

export type Parte = 1 | 2 | 3
export type Slide = {
  id: string
  parte: Parte
  titulo: string
  /** Tempo previsto, em minutos, para o cronômetro do apresentador. */
  minutos: number
  /** O que falar: aparece no painel de notas (tecla N). */
  notas: string
  /** Capítulos e a capa entram pela dobra espacial; os demais pelo feixe. */
  capitulo?: boolean
  Conteudo: () => ReactElement
}

export const PARTES: Record<Parte, { nome: string; minutos: number }> = {
  1: { nome: 'Abertura e processo', minutos: 15 },
  2: { nome: 'Front-end', minutos: 15 },
  3: { nome: 'Back-end e fechamento', minutos: 15 },
}

const arte = (nome: string) => constructosHumanos.find((c) => c.nome === nome)!.Arte

const Codigo2 = ({ children }: { children: string }) => <code className="dk-mono">{children}</code>

const CRS = 'controller · service · repository'
/** Camadas reais de cada módulo em backend/src (conferidas em 2026-11-12). */
const MODULOS: [string, IconeOaNome, string][] = [
  ['auth', 'escudo', 'controller · service · senha (bcrypt)'],
  ['usuarios', 'pessoal', CRS],
  ['setores', 'setores', CRS],
  ['lanternas', 'energia', CRS],
  ['ocorrencias', 'ocorrencias', `${CRS} · ciclo de vida`],
  ['eventos', 'relatorios', CRS],
  ['comentarios', 'comunicacoes', CRS],
  ['dashboard', 'painel', CRS],
  ['saude', 'verificado', 'só controller: health check'],
]

export const SLIDES: Slide[] = [
  {
    id: 'capa', parte: 1, titulo: 'Central de Oa', minutos: 1, capitulo: true,
    notas: 'Vamos mostrar um sistema completo, front e back, e principalmente como provamos que ele cumpre o que foi pedido ao longo do semestre.',
    Conteudo: () => (
      <div className="dk-capa">
        <div className="dk-capa-emblema dk-surge">
          <span className="dk-capa-onda" aria-hidden="true" />
          <span className="dk-capa-onda dk-capa-onda--2" aria-hidden="true" />
          <EmblemaOa className="dk-capa-svg" />
        </div>
        <div className="dk-capa-texto">
          <Rotulo codigo="OANET">Transmissão final · Desenvolvimento Web</Rotulo>
          <Titulo texto="Central de Oa" nivel="capa" />
          <Subtitulo>Tropa dos Lanternas Verdes · registro, acompanhamento e atribuição de ocorrências intergalácticas</Subtitulo>
          <ul className="dk-capa-equipe dk-cascata dk-t6">{EQUIPE.map((nome) => <li key={nome}>{nome}</li>)}</ul>
          <p className="dk-capa-rodape dk-entra dk-t8">React e Next.js · NestJS · Prof. Wellington</p>
        </div>
      </div>
    ),
  },
  {
    id: 'parte-1', parte: 1, titulo: 'Parte I: Abertura e processo', minutos: 0.5, capitulo: true,
    notas: 'Abrir com o fio condutor: cada requisito pedido virou uma regra escrita numa skill, e cada regra aparece no código, num teste ou num documento.',
    Conteudo: () => <Capitulo numero="I" parte="PARTE I" minutos={15} titulo="Como foi construído" texto="O produto, o contrato, a documentação e os agentes do projeto." apresentador={APRESENTADORES[1]} Arte={arte('Abin Sur')} legenda="Abin Sur · Travessia interestelar: onde tudo começa" />,
  },
  {
    id: 'produto', parte: 1, titulo: 'O produto em 1 minuto', minutos: 1.5,
    notas: 'Sistema para registrar, acompanhar e atribuir ocorrências. Três públicos: visitante, Lanterna (só o próprio setor) e Guardião (todos os setores). Identidade OANET feita inteira em código.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="01">O produto</Rotulo>
          <Titulo texto="Ocorrências intergalácticas sob controle" />
          <Subtitulo>Registrar, acompanhar e atribuir, com permissões por papel e setor. Visual 100% gerado em código: HTML, CSS, SVG e Canvas.</Subtitulo>
          <div className="dk-selos dk-cascata dk-t5"><SeloOa>12 rotas OANET</SeloOa><SeloOa tom="azul">25 Lanternas no seed</SeloOa><SeloOa tom="ambar">0 imagens externas</SeloOa></div>
        </div>
        <Cartoes className="dk-t3" itens={[
          { icone: 'olho', titulo: 'Visitante', texto: 'Conhece a Tropa, os 25 Lanternas e Oa no site público.' },
          { icone: 'escudo', titulo: 'Lanterna', texto: 'Trabalha nas ocorrências do próprio setor. Nada além dele.', selo: 'setor' },
          { icone: 'hierarquia', titulo: 'Guardião', texto: 'Vê todos os setores, atribui responsáveis e gere usuários.', selo: 'todos' },
        ]} />
      </div>
    ),
  },
  {
    id: 'arquitetura', parte: 1, titulo: 'Arquitetura em uma imagem', minutos: 2,
    notas: 'O navegador nunca vê o token nem chama a API: só o servidor do Next fala com ela (ADR 0001). Contrato único: OpenAPI v1 com 30 operações e 310 cenários. Front e back foram feitos em paralelo porque obedeciam ao mesmo contrato escrito.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada">
        <div className="dk-cabecalho">
          <Rotulo codigo="02">Arquitetura</Rotulo>
          <Titulo texto="O navegador nunca toca no token" />
        </div>
        <div className="dk-entra dk-t3"><DiagramaArquitetura /></div>
        <div className="dk-faixa-numeros dk-t5">
          <Contador valor={30} rotulo="operações no contrato" />
          <Contador valor={310} rotulo="cenários de exemplo" />
          <Contador valor={1} rotulo="ADR: JWT no servidor" detalhe="docs/adr/0001" />
        </div>
      </div>
    ),
  },
  {
    id: 'contrato', parte: 1, titulo: 'Contrato primeiro', minutos: 2,
    notas: 'Decisões e regras primeiro; depois o contrato v1 com hash (G-1); duas frentes em paralelo; ligação real de uma vez no Corte 1; e a entrega sem json-server. Mais de 20 PRs, todos revisados antes do merge.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada">
        <div className="dk-cabecalho">
          <Rotulo codigo="03">Processo</Rotulo>
          <Titulo texto="Contrato primeiro, código depois" />
        </div>
        <Etapas className="dk-t3" etapas={[
          { icone: 'relatorios', titulo: 'Decisões', texto: <>42 decisões e ~36 regras de negócio</> },
          { icone: 'escudo', titulo: 'Contrato v1', texto: <>OpenAPI + exemplos, travado por SHA-256 (G-1)</> },
          { icone: 'hierarquia', titulo: 'Duas frentes', texto: <>front contra servidor falso; back contra o contrato</> },
          { icone: 'energia', titulo: 'Corte 1', texto: <>ligação real de uma vez, depois os aditivos</> },
          { icone: 'verificado', titulo: 'Entrega', texto: <>json-server removido, E2E contra a API real</> },
        ]} />
        <div className="dk-faixa-numeros dk-t8">
          <Contador valor={42} rotulo="decisões registradas" />
          <Contador valor={129} sufixo="+" rotulo="commits" />
          <Contador valor={20} sufixo="+" rotulo="PRs revisados" />
        </div>
      </div>
    ),
  },
  {
    id: 'documentacao', parte: 1, titulo: 'Documentação como parte do sistema', minutos: 1.5,
    notas: 'docs/README.md é o índice, com uma fonte canônica por assunto. GLOSSARY dá a linguagem do domínio. A documentação veio antes do código e é verificada por script.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="04">Documentação</Rotulo>
          <Titulo texto="Uma fonte por assunto, conferida por script" />
          <TabelaRegras className="dk-t3" cabecalho={['Pergunta', 'Fonte canônica']} linhas={[
            { requisito: 'O que foi decidido?', prova: <Codigo2>ESCOPO.md + ADRs</Codigo2> },
            { requisito: 'Qual regra vale?', prova: <Codigo2>REGRAS-DE-NEGOCIO.md</Codigo2> },
            { requisito: 'Qual formato HTTP?', prova: <Codigo2>openapi.json · API.md · DTOS.md</Codigo2> },
            { requisito: 'Como persistir?', prova: <Codigo2>MODELO-DE-DADOS · SEED</Codigo2> },
            { requisito: 'Como é cada tela?', prova: <Codigo2>TELAS.md · UI.md</Codigo2> },
          ]} />
        </div>
        <div className="dk-coluna dk-coluna--centro">
          <Codigo className="dk-t5" arquivo="terminal · verificações" linhas={[
            '$ node docs/agents/validar-documentacao.mjs --ancoras',
            '  links locais ............ ok',
            '  âncoras e títulos ....... ok',
            '',
            '$ python docs/contratos/validar.py --conferir-hash',
            '  30 operações · 310 cenários',
            '  SHA-256 do pacote ....... ok',
          ]} />
        </div>
      </div>
    ),
  },
  {
    id: 'skills', parte: 1, titulo: 'As duas skills', minutos: 2,
    notas: 'frontend-web: cerca de 150 regras com ID, cada uma com origem: SLIDE (os 7 decks da disciplina), DOCS (Next instalado) ou DECISÃO. backend-api: as regras das aulas de API REST e da atividade da Biblioteca. Cada skill tem a tabela Errado × Certo e a tabela Prove. Transformamos os requisitos do professor numa lista que qualquer pessoa, ou agente, consegue conferir.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada">
        <div className="dk-cabecalho">
          <Rotulo codigo="05">Regras com ID</Rotulo>
          <Titulo texto="Requisitos do professor viraram regras com ID" />
        </div>
        <div className="dk-grade dk-grade--2">
          <Painel className="dk-t3" titulo="skill frontend-web" icone="painel" acao={<SeloOa>~150 regras</SeloOa>}>
            <div className="dk-chips dk-cascata">{['COMP', 'JS', 'ROTA', 'API', 'AUTH', 'FORM', 'CSS', 'PROD', 'STACK', 'DEC'].map((p) => <span key={p}>{p}</span>)}</div>
            <p className="dk-texto">Origem de cada regra: <b>[SLIDE]</b> os 7 decks da disciplina · <b>[DOCS]</b> o Next instalado · <b>[DECISÃO]</b> escolha do grupo.</p>
          </Painel>
          <Painel className="dk-t4" titulo="skill backend-api" icone="setores" acao={<SeloOa tom="azul">6 blocos</SeloOa>}>
            <div className="dk-chips dk-chips--azul dk-cascata">{['Camadas', 'Contrato HTTP', 'Entrada', 'Erros', 'Dados', 'Auth'].map((p) => <span key={p}>{p}</span>)}</div>
            <p className="dk-texto">Aulas de API REST e a atividade da Biblioteca: envelope, filtro global, TypeORM, camadas.</p>
          </Painel>
        </div>
        <div className="dk-faixa-numeros dk-t7">
          <Contador valor={400} sufixo="+" rotulo="marcadores // [AUTH-05] no código" />
          <Contador valor={111} rotulo="arquivos do front marcados" />
          <Contador valor={2} rotulo="tabelas Prove: erro testado como sucesso" />
        </div>
      </div>
    ),
  },
  {
    id: 'ferramentas', parte: 1, titulo: 'Ferramentas: agentes', minutos: 2,
    notas: 'Claude Code coordena, revisa e escreve o código sensível. O Orca orquestra vários agentes em paralelo, com worktrees isoladas, terminais e navegador integrado. Codex coordenou o contrato e o laboratório OANET. Gemini e Haiku foram workers. Git e GitHub: uma branch por tarefa e merge só depois da revisão.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas dk-layout--orbita">
        <div className="dk-coluna">
          <Rotulo codigo="06">Ferramentas</Rotulo>
          <Titulo texto="Desenvolvimento assistido por agentes" />
          <Lista className="dk-t3" itens={[
            <><b>Claude Code</b> coordena, revisa e escreve o código sensível: schemas, Actions, permissões</>,
            <><b>Orca</b> orquestra: worktrees isoladas, terminais e navegador integrado em 1536, 820 e 375 px</>,
            <><b>Codex</b> coordenou o contrato (DOC-03) e o laboratório OANET</>,
            <><b>Gemini e Haiku</b> como workers: UI e testes; documentação e auditoria</>,
            <><b>GitHub</b>: uma branch por tarefa, PRs empilhados, merge só revisado</>,
          ]} />
        </div>
        <div className="dk-entra dk-t2 dk-orbita-caixa"><OrbitaAgentes /></div>
      </div>
    ),
  },
  {
    id: 'orca', parte: 1, titulo: 'Como o Orca organizou o trabalho', minutos: 2,
    notas: 'Regra de ouro: cada arquivo tem um único dono por tarefa. Especificação padrão por worker. O coordenador escreve os testes antes e é o único que roda o build. Lições: um worker gravou com a codificação errada, então passamos a conferir UTF-8; código de segurança não é delegado. A auditoria com 5 agentes achou 13 defeitos no back, todos corrigidos.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada">
        <div className="dk-cabecalho">
          <Rotulo codigo="07">Orca</Rotulo>
          <Titulo texto="Cada arquivo tem um único dono" />
        </div>
        <div className="dk-esteira dk-cascata dk-t3">
          {['POSSE', 'CONTRATO', 'IMPLEMENTAR', 'TESTES MÍNIMOS', 'ACEITE COM COMANDOS'].map((passo, i) => (
            <div key={passo} className="dk-esteira-passo"><span>{String(i + 1).padStart(2, '0')}</span><strong>{passo}</strong></div>
          ))}
        </div>
        <div className="dk-grade dk-grade--3">
          <Painel className="dk-t5" titulo="Coordenador" icone="alvo"><p className="dk-texto">Escreve os testes antes, revisa cada diff e é o único que roda o build e o navegador.</p></Painel>
          <Painel className="dk-t6" titulo="Lições" icone="sino"><p className="dk-texto">Conferir UTF-8 depois de cada worker. Código de segurança <b>não se delega</b>.</p></Painel>
          <Painel className="dk-t7" titulo="Auditoria" icone="busca"><div className="dk-mini-numeros"><Contador valor={5} rotulo="agentes" /><Contador valor={13} rotulo="defeitos" /><Contador valor={23} rotulo="testes de regressão" /></div></Painel>
        </div>
      </div>
    ),
  },
  {
    id: 'qualidade', parte: 1, titulo: 'Ferramentas de qualidade', minutos: 1,
    notas: 'Vitest e Testing Library no front; Playwright contra o servidor falso e, separado, contra a API real; Jest e Supertest no back, cada suíte com seu SQLite temporário; ESLint, TypeScript estrito e next build. Passagem: agora o front, regra por regra.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada">
        <div className="dk-cabecalho">
          <Rotulo codigo="08">Qualidade</Rotulo>
          <Titulo texto="Nada entra sem prova" />
        </div>
        <Cartoes className="dk-cartoes--4 dk-t3" itens={[
          { icone: 'verificado', titulo: 'Vitest', texto: 'Unidade e componentes do front, com Testing Library.' },
          { icone: 'olho', titulo: 'Playwright', texto: 'E2E no servidor falso do contrato e, separado, na API real.' },
          { icone: 'setores', titulo: 'Jest + Supertest', texto: 'Back: cada suíte sobe a API numa porta livre com SQLite próprio.' },
          { icone: 'codigo', titulo: 'ESLint + TS', texto: 'TypeScript estrito, lint e next build antes de todo commit.' },
        ]} />
      </div>
    ),
  },
  {
    id: 'parte-2', parte: 2, titulo: 'Parte II: Front-end', minutos: 0.5, capitulo: true,
    notas: 'Estrutura de cada slide: requisito da skill, onde está no código e como provamos.',
    Conteudo: () => <Capitulo numero="II" parte="PARTE II" minutos={15} titulo="Front-end" texto="Cada requisito da skill frontend-web, do slide da aula até a linha de código." apresentador={APRESENTADORES[2]} Arte={arte('Kyle Rayner')} legenda="Kyle Rayner · Imaginação mecânica: a interface" />,
  },
  {
    id: 'stack-front', parte: 2, titulo: 'Stack e organização do front', minutos: 1.5,
    notas: 'Next 16.4 App Router, React 19.3, TypeScript, Tailwind 4, RHF e Zod 4. Rotas por grupo: (site) público e (painel) privado. use client só nas folhas interativas, nunca em layout ou página (ROTA-08).',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="09">Stack</Rotulo>
          <Titulo texto="Servidor primeiro, cliente só nas folhas" />
          <div className="dk-selos dk-cascata dk-t3">
            <SeloOa>Next.js 16.4</SeloOa><SeloOa>React 19.3</SeloOa><SeloOa tom="azul">TypeScript</SeloOa><SeloOa tom="azul">Tailwind 4</SeloOa><SeloOa tom="ambar">RHF + Zod 4</SeloOa><SeloOa tom="neutro">Base UI</SeloOa>
          </div>
          <p className="dk-regra dk-entra dk-t5"><span className="dk-id">ROTA-08</span><span><Codigo2>{"'use client'"}</Codigo2> só nas folhas interativas, nunca em layout ou página.</span></p>
        </div>
        <Codigo className="dk-t3" arquivo="estrutura" linhas={[
          'app/',
          '  (site)/       // público: home, Lanternas, login',
          '  (painel)/     // privado: verificarSessao()',
          '  sessao-expirada/route.ts',
          'lib/',
          '  api.ts        // único cliente HTTP',
          '  dal.ts        // sessão e papel',
          '  schemas/      // Zod: o que a API devolve',
          'components/oanet/   // identidade OANET',
          'proxy.ts        // checagem otimista',
        ]} />
      </div>
    ),
  },
  {
    id: 'dados-api', parte: 2, titulo: 'Dados e API', minutos: 2.5,
    notas: 'Cliente HTTP único (API-17), serviço por recurso (API-01), resposta validada com schema e nunca com as Tipo (API-04), ApiError com código estável (API-02/03/18), cache sempre explícito (API-06), busca em Server Components (API-05) e ambiente validado (API-08). Mostrar requisitarApi.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="10">Deck: Consumo de APIs</Rotulo>
          <Titulo texto="Um cliente, um schema, nenhum as Tipo" />
          <TabelaRegras className="dk-t3" linhas={[
            { id: 'API-17', requisito: 'Cliente HTTP único', prova: <Codigo2>lib/api.ts</Codigo2> },
            { id: 'API-04', requisito: 'Resposta validada', prova: <Codigo2>schema.parse(dados)</Codigo2> },
            { id: 'API-03', requisito: 'Erro com código', prova: <Codigo2>ApiError(status, codigo)</Codigo2> },
            { id: 'API-06', requisito: 'Cache explícito', prova: <Codigo2>no-store | revalidate</Codigo2> },
            { id: 'API-05', requisito: 'Busca no servidor', prova: 'Server Components' },
            { id: 'API-08', requisito: 'Ambiente validado', prova: <Codigo2>lib/env.ts</Codigo2> },
          ]} />
        </div>
        <Codigo className="dk-t4" arquivo="lib/api.ts · resumo" linhas={[
          '/** [API-17][API-04] */',
          'export async function requisitarApi<T>(',
          '  caminho: string,',
          '  dados: z.ZodType<T>,',
          '  opcoes: OpcoesApi,',
          '): Promise<T> {',
          '  const { resposta } = await executar(caminho, opcoes)',
          '  if (!resposta.ok) await lancarErroHttp(resposta)',
          '  const corpo = await resposta.json()',
          '  return envelope(dados).parse(corpo).dados',
          '}',
        ]} />
      </div>
    ),
  },
  {
    id: 'estados', parte: 2, titulo: 'Os quatro estados de cada tela', minutos: 1.5,
    notas: 'Loading, vazio, erro e sucesso em todas as telas com dados (API-09 a 11, ROTA-21). Cada rota do painel tem loading.tsx e error.tsx com Tentar de novo. Paginação e filtros na URL (ROTA-14, API-19): ?pagina=abc cai no padrão. Demo: filtrar, copiar a URL, abrir em outra aba.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada">
        <div className="dk-cabecalho">
          <Rotulo codigo="11">API-09 · API-10 · API-11 · ROTA-21</Rotulo>
          <Titulo texto="Toda tela tem quatro estados" />
        </div>
        <div className="dk-grade dk-grade--4">
          <Painel className="dk-t3" titulo="Carregando" icone="pausa"><div className="dk-esqueleto"><i /><i /><i /></div><Codigo2>loading.tsx</Codigo2></Painel>
          <Painel className="dk-t4" titulo="Vazio" icone="busca"><p className="dk-estado-texto">Nenhuma ocorrência neste filtro.</p><Codigo2>EstadoVazio</Codigo2></Painel>
          <Painel className="dk-t5" titulo="Erro" icone="ocorrencias"><p className="dk-estado-texto dk-estado-texto--erro">A Central não respondeu.<br /><b>Tentar de novo</b></p><Codigo2>error.tsx + retry</Codigo2></Painel>
          <Painel className="dk-t6" titulo="Sucesso" icone="verificado"><div className="dk-mini-lista"><span><SeloOa tom="vermelho">crítica</SeloOa>Fenda em Korugar</span><span><SeloOa tom="ambar">média</SeloOa>Sinal em Thanagar</span></div><Codigo2>dados validados</Codigo2></Painel>
        </div>
        <div className="dk-url dk-entra dk-t8"><IconeOa nome="busca" /><span>/painel/ocorrencias</span><b>?status=aberta&gravidade=critica&pagina=2</b><SeloOa>estado na URL · ROTA-14</SeloOa></div>
      </div>
    ),
  },
  {
    id: 'sessao', parte: 2, titulo: 'Sessão e permissões', minutos: 3,
    notas: 'A página decide o que mostrar, a API decide o que é permitido. JWT em cookie httpOnly (AUTH-02/12), proxy.ts só otimista (AUTH-01), verificarSessao em toda página privada (AUTH-04), 401 apaga o cookie (AUTH-13), 403 vai para acesso negado (AUTH-06), toda Action confere sessão na primeira linha (AUTH-05, o marcador mais citado: 24 vezes). Demo: Hal tenta /painel/usuarios.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="12">A regra mais importante</Rotulo>
          <blockquote className="dk-manifesto dk-entra dk-t1">A página decide o que mostrar.<br /><b>A API decide o que é permitido.</b></blockquote>
          <Codigo className="dk-t5" arquivo="lib/dal.ts" linhas={[
            'export const verificarSessao = cache(async () => {',
            '  const token = await lerToken()',
            "  if (!token) redirect('/login')",
            '  // a API confirma quem é o usuário',
            '  const usuario = await buscarUsuarioAtual(token)',
            "  // 401 → /sessao-expirada apaga o cookie",
            '})',
          ]} />
        </div>
        <TabelaRegras className="dk-t3" linhas={[
          { id: 'AUTH-02', requisito: 'JWT em cookie httpOnly', prova: <Codigo2>lib/auth.ts</Codigo2> },
          { id: 'AUTH-01', requisito: 'proxy.ts só otimista', prova: 'confere se o cookie existe' },
          { id: 'AUTH-04', requisito: 'Sessão em toda página privada', prova: <Codigo2>verificarSessao()</Codigo2> },
          { id: 'AUTH-13', requisito: '401 apaga o cookie', prova: <Codigo2>/sessao-expirada</Codigo2> },
          { id: 'AUTH-06', requisito: '403 tem tela própria', prova: <Codigo2>/acesso-negado</Codigo2> },
          { id: 'AUTH-05', requisito: 'Action confere sessão', prova: '24 marcadores no código' },
          { id: 'AUTH-07', requisito: 'Escopo pela sessão', prova: <Codigo2>lib/escopo.ts</Codigo2> },
        ]} />
      </div>
    ),
  },
  {
    id: 'formularios', parte: 2, titulo: 'Formulários', minutos: 2,
    notas: 'RHF com zodResolver e coerção (FORM-01/06/13). O mesmo schema valida no cliente e de novo na Server Action (FORM-17/18). O erro da API volta para o campo certo com setError (FORM-19): exemplo, e-mail já cadastrado. Acessibilidade: label, aria-invalid, aria-describedby e botão desabilitado contra envio duplo.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="13">Deck: Formulários RHF + Zod</Rotulo>
          <Titulo texto="Um schema, dois lugares" />
          <Lista className="dk-t3" itens={[
            <><span className="dk-id">FORM-01</span> React Hook Form com <Codigo2>zodResolver</Codigo2></>,
            <><span className="dk-id">FORM-17</span> o mesmo schema roda de novo na Server Action</>,
            <><span className="dk-id">FORM-19</span> erro da API volta para o campo certo</>,
            <><span className="dk-id">FORM-09</span> label, <Codigo2>aria-invalid</Codigo2> e <Codigo2>aria-describedby</Codigo2></>,
            <><span className="dk-id">FORM-08</span> botão desabilitado contra envio duplo</>,
          ]} />
        </div>
        <Painel className="dk-t4" titulo="Cadastro na Central" icone="pessoal">
          <div className="dk-form" aria-hidden="true">
            <label>Nome<span className="dk-campo">Kilowog</span></label>
            <label>E-mail<span className="dk-campo dk-campo--erro">kilowog@oa.tropa</span><small><IconeOa nome="ocorrencias" />Este e-mail já está cadastrado.</small></label>
            <span className="dk-form-origem"><Codigo2>409 EMAIL_JA_CADASTRADO</Codigo2><IconeOa nome="seta" /><Codigo2>errors.email</Codigo2></span>
          </div>
        </Painel>
      </div>
    ),
  },
  {
    id: 'estilo', parte: 2, titulo: 'Estilo, acessibilidade e produção', minutos: 2,
    notas: 'Tailwind pela escala (CSS-01/02/04/10). Mobile-first, conferido em 375 px (CSS-03); cor nunca é o único sinal (CSS-12); foco sempre visível (CSS-14). Cabeçalhos de segurança e CSP em modo relatório (PROD-02/03). SEO com metadata, robots e sitemap, painel fora do índice (PROD-04). 12 rotas na identidade OANET, respeitando prefers-reduced-motion.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--tres">
        <div className="dk-coluna">
          <Rotulo codigo="14">CSS · PROD</Rotulo>
          <Titulo texto="Bonito, acessível e seguro" />
          <Lista className="dk-t3" itens={[
            <><span className="dk-id">CSS-03</span> mobile-first, conferido em 375 px</>,
            <><span className="dk-id">CSS-12</span> cor nunca é o único sinal</>,
            <><span className="dk-id">CSS-14</span> foco sempre visível</>,
            <><span className="dk-id">CSS-15</span> respeita movimento reduzido</>,
            <><span className="dk-id">PROD-04</span> metadata, robots, sitemap</>,
          ]} />
        </div>
        <Celular />
        <Codigo className="dk-t5" arquivo="next.config.ts · PROD-02/03" linhas={[
          "X-Content-Type-Options: 'nosniff'",
          "X-Frame-Options: 'DENY'",
          "Referrer-Policy: 'strict-origin-…'",
          "Permissions-Policy: 'camera=()…'",
          '',
          '// observar antes de impor',
          'Content-Security-Policy-Report-Only',
        ]} />
      </div>
    ),
  },
  {
    id: 'prova-front', parte: 2, titulo: 'Prova: a tabela Prove do front', minutos: 2,
    notas: 'Cada cenário da tabela Prove da skill tem um resultado verificado. Números do registro do Corte 1: 529 testes unitários em 71 arquivos, 40 cenários E2E contra a API real, lint e tsc sem erros. Passagem: tudo isso só funciona porque do outro lado há uma API que segue as mesmas regras.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="15">Tabela Prove · frontend-web</Rotulo>
          <Titulo texto="Erro testado como sucesso" />
          <div className="dk-mini-numeros dk-mini-numeros--grande dk-t3">
            <Contador valor={529} rotulo="testes unitários" detalhe="71 arquivos" />
            <Contador valor={40} rotulo="cenários E2E" detalhe="contra a API real" />
            <Contador valor={0} rotulo="erros de lint e tsc" />
          </div>
        </div>
        <TabelaProva className="dk-t2" linhas={[
          ['Sem cookie em rota privada', <Codigo2 key="a">/login</Codigo2>],
          ['API responde 401', <Codigo2 key="b">/sessao-expirada</Codigo2>],
          ['403', <Codigo2 key="c">/acesso-negado</Codigo2>],
          ['404', <Codigo2 key="d">notFound()</Codigo2>],
          ['409 ou 422 com código', 'mensagem no campo'],
          ['429 no login', 'aguarde, sem repetir'],
          ['API fora do ar', 'Tentar de novo'],
          ['Variável de ambiente ausente', 'o app não sobe'],
        ]} />
      </div>
    ),
  },
  {
    id: 'demo', parte: 2, titulo: 'Demonstração ao vivo', minutos: 0.5,
    notas: 'Se der tempo: login, dashboard, nova ocorrência, atribuir como Guardião, comentar, linha do tempo. Passagem para o back.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada dk-layout--centro">
        <div className="dk-cabecalho dk-cabecalho--centro">
          <Rotulo codigo="16">Ao vivo</Rotulo>
          <Titulo texto="Transmissão da Central" />
        </div>
        <Etapas className="dk-etapas--compacta dk-t3" etapas={[
          { icone: 'escudo', titulo: 'Login', texto: 'Hal Jordan · setor 2814' },
          { icone: 'painel', titulo: 'Dashboard', texto: 'resumo por status' },
          { icone: 'mais', titulo: 'Nova ocorrência', texto: 'com erro de campo' },
          { icone: 'hierarquia', titulo: 'Atribuir', texto: 'como Guardião' },
          { icone: 'comunicacoes', titulo: 'Comentar', texto: 'linha do tempo' },
        ]} />
        <p className="dk-passagem dk-entra dk-t8"><span className="dk-ao-vivo" />localhost:3000</p>
      </div>
    ),
  },
  {
    id: 'parte-3', parte: 3, titulo: 'Parte III: Back-end', minutos: 0.5, capitulo: true,
    notas: 'É a mesma arquitetura pedida na atividade da Biblioteca, aplicada a um domínio maior e com login.',
    Conteudo: () => <Capitulo numero="III" parte="PARTE III" minutos={15} titulo="Back-end" texto="A API NestJS conferida com a skill backend-api e com a atividade da Biblioteca." apresentador={APRESENTADORES[3]} Arte={arte('John Stewart')} legenda="John Stewart · Arquitetura da luz: a estrutura" />,
  },
  {
    id: 'stack-back', parte: 3, titulo: 'Stack e mapa dos módulos', minutos: 1,
    notas: 'NestJS 12, TypeORM, SQLite, class-validator, @nestjs/jwt, bcrypt, Helmet e throttler. Um módulo por assunto, com controller, service e repository; o comum fica em src/comum. 30 operações em 9 controllers.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="17">Stack</Rotulo>
          <Titulo texto="Um módulo por assunto" />
          <div className="dk-selos dk-cascata dk-t3">
            <SeloOa>NestJS 12</SeloOa><SeloOa>TypeORM</SeloOa><SeloOa tom="azul">SQLite</SeloOa><SeloOa tom="azul">class-validator</SeloOa><SeloOa tom="ambar">JWT + bcrypt</SeloOa><SeloOa tom="neutro">Helmet + throttler</SeloOa>
          </div>
          <div className="dk-faixa-numeros dk-faixa-numeros--esquerda dk-t5">
            <Contador valor={30} rotulo="operações" />
            <Contador valor={9} rotulo="controllers" />
          </div>
        </div>
        <div className="dk-modulos dk-cascata dk-t3">
          {MODULOS.map(([nome, icone, camadas]) => (
            <div key={nome} className="dk-modulo"><IconeOa nome={icone} /><strong>{nome}/</strong><span>{camadas}</span></div>
          ))}
          <div className="dk-modulo dk-modulo--comum"><IconeOa nome="equipamentos" /><strong>comum/</strong><span>filtro · interceptor · log · erro</span></div>
        </div>
      </div>
    ),
  },
  {
    id: 'camadas', parte: 3, titulo: 'Camadas', minutos: 2,
    notas: 'O controller traduz, o service decide, o repository guarda. Controller fino, regra no service sem @Req/@Res, só o repository fala com o banco e devolve nulo, injeção pelo construtor (permite testar com falsos), formato no DTO e regra no service.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="18">Atividade · Parte 3</Rotulo>
          <Titulo texto="O controller traduz, o service decide, o repository guarda" />
          <Lista className="dk-t5" itens={[
            <>Injeção pelo construtor, sem <Codigo2>new</Codigo2>: dá para testar com falsos</>,
            <>Formato no DTO; regra no service</>,
            <>Exemplo: <Codigo2>ciclo-vida.service.ts</Codigo2> decide as transições</>,
          ]} />
        </div>
        <div className="dk-entra dk-t2"><CamadasBack /></div>
      </div>
    ),
  },
  {
    id: 'http', parte: 3, titulo: 'Contrato HTTP e entrada', minutos: 2,
    notas: 'Substantivos no plural, método diz a ação, status real. ValidationPipe global com whitelist e forbidNonWhitelisted: campo extra dá 400. Sem conversão implícita no corpo: veio de um defeito real da auditoria, "2814" era aceito como número. Query desconhecida recusada. Texto só com espaços recusado.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada">
        <div className="dk-cabecalho">
          <Rotulo codigo="19">Contrato HTTP · Entrada</Rotulo>
          <Titulo texto="O status é a verdade" />
        </div>
        <div className="dk-status dk-cascata dk-t3">
          {[['200', 'ok'], ['201', 'criou'], ['204', 'sem corpo'], ['400', 'formato'], ['401', 'quem é você'], ['403', 'o que pode'], ['404', 'é seu?'], ['409', 'conflito'], ['422', 'regra'], ['429', 'calma']].map(([codigo, sentido]) => (
            <div key={codigo} className={`dk-status-item dk-status-item--${codigo[0]}`}><strong>{codigo}</strong><span>{sentido}</span></div>
          ))}
        </div>
        <div className="dk-grade dk-grade--2">
          <Codigo className="dk-t6" arquivo="comum/configurar-http.ts" linhas={[
            'new ValidationPipe({',
            '  whitelist: true,',
            '  forbidNonWhitelisted: true, // campo extra = 400',
            '  transform: true,',
            '  // sem enableImplicitConversion',
            '})',
          ]} />
          <Lista className="dk-t7" itens={[
            <>Corpo sem coerção: <Codigo2>{'"2814"'}</Codigo2> não vira número (achado da auditoria)</>,
            <>Query desconhecida recusada por interceptor global</>,
            <>Texto só de espaços recusado: <Codigo2>@Aparar()</Codigo2></>,
          ]} />
        </div>
      </div>
    ),
  },
  {
    id: 'envelope', parte: 3, titulo: 'Erros e envelope', minutos: 2,
    notas: 'Parte 4 da atividade: middleware de log, exceção própria com código, filtro global com envelope de erro e 500 genérico, interceptor global com envelope de sucesso, nenhum try/catch nos controllers. Ponto-chave: o front valida exatamente esse envelope com Zod. As duas skills se encaixam.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada">
        <div className="dk-cabecalho">
          <Rotulo codigo="20">Atividade · Parte 4</Rotulo>
          <Titulo texto="Um envelope para toda resposta" />
        </div>
        <div className="dk-grade dk-grade--2">
          <Codigo className="dk-t3" arquivo="200 · interceptor-envelope.ts" linhas={[
            '{',
            '  "sucesso": true,',
            '  "dados": {',
            '    "id": "b3f1…",',
            '    "titulo": "Fenda em Korugar"',
            '  }',
            '}',
          ]} />
          <Codigo className="dk-t4" arquivo="409 · filtro-excecoes.ts" linhas={[
            '{',
            '  "sucesso": false,',
            '  "erro": { "status": 409, "codigo": "EMAIL_JA_CADASTRADO",',
            '            "mensagem": "…", "detalhes": [] },',
            '  "caminho": "/auth/cadastro",',
            '  "timestamp": "2026-11-11T14:05:00.000Z"',
            '}',
          ]} />
        </div>
        <div className="dk-encaixe dk-entra dk-t7"><span>backend-api</span><IconeOa nome="seta" /><b>mesmo envelope</b><IconeOa nome="seta" /><span>frontend-web · Zod em lib/api.ts</span></div>
        <div className="dk-selos dk-cascata dk-t8"><SeloOa>log.middleware.ts</SeloOa><SeloOa>ErroDominio + codigo</SeloOa><SeloOa>500 genérico, detalhe no log</SeloOa><SeloOa tom="ambar">0 try/catch nos controllers</SeloOa></div>
      </div>
    ),
  },
  {
    id: 'dados', parte: 3, titulo: 'Dados e persistência', minutos: 2,
    notas: 'Migrations versionadas, seed idempotente com os 25 Lanternas, transações curtas, concorrência com UPDATE … WHERE conferindo affected === 1 (só uma de duas requisições vence), soft delete em ocorrências e comentários, paginação com máximo validado, ambiente validado ao subir.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="21">Atividade · Parte 5</Rotulo>
          <Titulo texto="Persistir sem perder a história" />
          <Lista className="dk-t3" itens={[
            <>Migrations versionadas, sem sincronização automática</>,
            <>Seed idempotente: os 25 Lanternas pesquisados</>,
            <>Transações curtas nas escritas dependentes</>,
            <>Soft delete: o histórico continua citando o registro</>,
            <><Codigo2>?pagina=</Codigo2> gigante responde 400, não 500</>,
            <>Sem <Codigo2>JWT_SECRET</Codigo2>, a API não sobe</>,
          ]} />
        </div>
        <div className="dk-corrida dk-entra dk-t4">
          <p className="dk-corrida-titulo">Duas requisições pela mesma transição</p>
          <div className="dk-corrida-pista"><span className="dk-corrida-req dk-corrida-req--a">PATCH /status</span><b>affected = 1 · vence</b></div>
          <div className="dk-corrida-pista"><span className="dk-corrida-req dk-corrida-req--b">PATCH /status</span><b className="dk-perde">affected = 0 · 422</b></div>
          <Codigo arquivo="ocorrencias.repository.ts → ciclo-vida.service.ts" linhas={[
            '// só grava se o status ainda for o lido',
            'update({ id, status: statusAnterior }, dados)',
            'return resultado.affected === 1',
            '',
            'if (!atualizado) throw this.transicaoInvalida() // 422',
          ]} />
        </div>
      </div>
    ),
  },
  {
    id: 'auth', parte: 3, titulo: 'Autenticação e permissões', minutos: 2,
    notas: 'Ordem da skill: quem é você (401), o que pode (403), este recurso é seu (404). Guard global e rota pública explícita, bcrypt, login sem revelar se a conta existe (hash isca), limite de tentativas com 429, HS256 fixo e exp obrigatório, dono vindo do token, CORS só para o front e Helmet.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--empilhada">
        <div className="dk-cabecalho">
          <Rotulo codigo="22">Autenticação</Rotulo>
          <Titulo texto="Quem é você, o que pode, é seu?" />
        </div>
        <div className="dk-portoes dk-cascata dk-t3">
          <div className="dk-portao"><strong>401</strong><span>quem é você?</span><small>JwtGuard global</small></div>
          <div className="dk-portao"><strong>403</strong><span>o que você pode?</span><small>PapeisGuard</small></div>
          <div className="dk-portao"><strong>404</strong><span>este recurso é seu?</span><small>dono vem do token</small></div>
        </div>
        <TabelaRegras className="dk-tabela--larga dk-t6" linhas={[
          { requisito: 'Rota nova fechada por padrão', prova: <><Codigo2>APP_GUARD</Codigo2> + <Codigo2>@Publica()</Codigo2></> },
          { requisito: 'Login não revela se a conta existe', prova: <>401 único + <b>hash isca</b> no bcrypt</> },
          { requisito: 'Limite de tentativas', prova: <><Codigo2>ThrottlerGuard</Codigo2> → 429</> },
          { requisito: 'Algoritmo fixo e expiração', prova: <>HS256 · <Codigo2>exp</Codigo2> obrigatório · 8 h</> },
          { requisito: 'CORS e cabeçalhos', prova: <>só a origem do front + Helmet</> },
        ]} />
      </div>
    ),
  },
  {
    id: 'prova-back', parte: 3, titulo: 'Prova: a tabela Prove do back', minutos: 2,
    notas: '17 suítes E2E, cada uma sobe a API numa porta livre com SQLite temporário, mais testes unitários. contrato.e2e-spec confere as respostas contra o OpenAPI. A auditoria achou 13 defeitos, todos corrigidos e cobertos por 23 casos, dos quais 20 falhavam antes.',
    Conteudo: () => (
      <div className="dk-layout dk-layout--duas">
        <div className="dk-coluna">
          <Rotulo codigo="23">Tabela Prove · backend-api</Rotulo>
          <Titulo texto="Cada status tem um teste" />
          <div className="dk-mini-numeros dk-mini-numeros--grande dk-t3">
            <Contador valor={17} rotulo="suítes E2E" detalhe="SQLite temporário" />
            <Contador valor={13} rotulo="defeitos corrigidos" detalhe="auditoria 2026-11-11" />
            <Contador valor={23} rotulo="casos de regressão" detalhe="20 falhavam antes" />
          </div>
        </div>
        <TabelaProva className="dk-t2" linhas={[
          ['Entrada válida', '200 · 201 · 204'],
          ['Campo extra ou formato inválido', '400 com detalhes'],
          ['Sem token ou token adulterado', '401'],
          ['Sem o papel', '403'],
          ['Recurso de outro setor', '404'],
          ['Duplicado ou transição inválida', '409 · 422'],
          ['Contrato inteiro', <Codigo2 key="c">contrato.e2e-spec.ts</Codigo2>],
        ]} />
      </div>
    ),
  },
  {
    id: 'conclusao', parte: 3, titulo: 'Conclusão', minutos: 1.5, capitulo: true,
    notas: 'Os requisitos viraram duas skills com regras identificadas; as regras viraram código com marcadores, testes e documentos verificados por script; front e back sobre um contrato com hash; agentes aceleraram, sempre com revisão humana e teste antes do merge. Se perguntarem o que falta: o aceite G9 depende da execução registrada em INTEGRACAO.md; a CSP segue em modo relatório, como a PROD-03 manda; os riscos aceitos estão na auditoria, com o motivo. Agradecer e abrir para perguntas.',
    Conteudo: () => (
      <div className="dk-final">
        <div className="dk-final-bateria dk-surge"><BateriaOa className="dk-final-svg" /></div>
        <div className="dk-final-texto">
          <Rotulo codigo="24">Conclusão</Rotulo>
          <Titulo texto="Requisito, regra, código, prova" nivel="capitulo" />
          <Lista className="dk-t4" itens={[
            <>Os requisitos da disciplina viraram <b>duas skills</b> com regras identificadas</>,
            <>As regras viraram <b>código com marcadores, testes e documentos</b> conferidos por script</>,
            <>Front e back em paralelo sobre <b>um contrato com hash</b></>,
            <>Agentes aceleraram, <b>sempre com revisão e teste antes do merge</b></>,
          ]} />
          <blockquote className="dk-juramento dk-cascata dk-t9">
            <span>No dia mais claro, na noite mais densa,</span>
            <span>o mal sucumbirá diante da minha presença.</span>
          </blockquote>
          <p className="dk-perguntas dk-entra dk-t10">Perguntas?</p>
        </div>
      </div>
    ),
  },
]
