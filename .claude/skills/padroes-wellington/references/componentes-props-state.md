# Componentes, props, estado e JSX (COMP)

Decks: JSX (`react_intro_componentes_jsx.pdf`) e PROPS (`react_props_state_components.pdf`).
O checklist de componentes do professor está em PROPS p. 9 e foi coberto por COMP-01, 02, 03, 06,
07 e 08. O item 7 do checklist (testes unitários) virou DEC-06: testes com Vitest em `__tests__/`.

Índice: COMP-01 nomenclatura · 02 responsabilidade única · 03 reutilização · 04 props somente
leitura · 05 desestruturação · 06 tipagem de props · 07 lógica fora da apresentação ·
08 documentação · 09 estado local · 10 imutabilidade · 11 fluxo unidirecional · 12 composição ·
13 key em listas · 14 renderização condicional · 15 sintaxe JSX · 16 sem HTML cru

---

### COMP-01: Nomes em PascalCase para componentes e camelCase para props
**Fonte:** [SLIDE] PROPS p. 9 (item 3 "Nomenclatura Clara"); JSX p. 6 ("Nome deve começar com maiúscula", "Export para reutilização")
**Regra:** Componente é uma função com nome em PascalCase, exportada. Props em camelCase. Arquivos
dos nossos componentes também em PascalCase, como nos slides (`components/Menu.tsx`, ROTAS p. 19;
`app/login/FormLogin.tsx`, ROTAS p. 20). Os arquivos gerados pelo shadcn em `components/ui/`
ficam como o CLI cria (kebab-case), ver STACK-02.
**✅ Certo:**
```tsx
export function CartaoOcorrencia({ titulo, nivelGravidade }: CartaoOcorrenciaProps) { ... }
```
**❌ Errado:**
```tsx
export function cartao_ocorrencia({ Titulo }) { ... }
```
**Como verificar:** `rg -n "export (default )?function [a-z]" app components` não deve achar componentes (funções utilitárias em `lib/` podem ser camelCase).

### COMP-02: Responsabilidade única, nada de componente "Deus"
**Fonte:** [SLIDE] PROPS p. 9 (item 1 "Responsabilidade Única"); PROPS p. 12 ("Pequenos, reutilizáveis e com responsabilidade única")
**Regra:** Cada componente faz uma coisa. Página busca dados e monta a tela; lista renderiza itens;
cartão renderiza um item; formulário cuida só do formulário.
**✅ Certo:**
```tsx
// page.tsx busca, ListaOcorrencias desenha a lista, CartaoOcorrencia desenha um item
<ListaOcorrencias itens={ocorrencias} />
```
**❌ Errado:** um `page.tsx` com 300 linhas que busca, filtra, desenha tabela, modal e formulário.
**Como verificar:** arquivos de componente acima de ~150 linhas merecem revisão: `wc -l app/**/*.tsx components/*.tsx`.

### COMP-03: Componentes reutilizáveis configurados por props
**Fonte:** [SLIDE] PROPS p. 9 (item 2 "Reutilização", "props configuráveis"); PROPS p. 3 (`<Card nome="A"/><Card nome="B"/>`); JSX p. 5
**Regra:** Se um pedaço de UI aparece em dois lugares, vira componente em `components/` com props.
Se é específico de uma rota, fica em `_components/` da rota (ROTA-03).
**✅ Certo:**
```tsx
<BadgeGravidade nivel="alta" />
<BadgeGravidade nivel="baixa" />
```
**❌ Errado:** copiar o mesmo JSX de badge em cinco páginas.
**Como verificar:** procurar trechos de JSX repetidos entre páginas; conferir que `components/` tem os itens compartilhados.

### COMP-04: Props são somente leitura
**Fonte:** [SLIDE] PROPS p. 3 ("Props são imutáveis", `❌ props.nome = "Novo"`); PROPS p. 4 ("Dica: Props são somente leitura"); PROPS p. 8
**Regra:** O filho nunca altera uma prop. Para mudar um valor que veio do pai, o pai passa um
callback (COMP-11).
**✅ Certo:**
```tsx
function Filtro({ valor, aoMudar }: FiltroProps) {
  return <select value={valor} onChange={(e) => aoMudar(e.target.value)}>...</select>
}
```
**❌ Errado:**
```tsx
function Filtro(props) { props.valor = 'alta' }
```
**Como verificar:** `rg -n "props\.\w+\s*=[^=]" app components` deve retornar vazio.

### COMP-05: Desestruturar props na assinatura
**Fonte:** [SLIDE] PROPS p. 5 ("Desestruturação de Props")
**Regra:** Receba as props já desestruturadas: as props usadas ficam visíveis no topo.
**✅ Certo:**
```tsx
function Saudacao({ nome, sobrenome }: SaudacaoProps) { return <h1>Olá, {nome} {sobrenome}</h1> }
```
**❌ Errado:**
```tsx
function Saudacao(props) { return <h1>Olá, {props.nome} {props.sobrenome}</h1> }
```
**Como verificar:** `rg -n "function [A-Z]\w*\(props" app components` deve retornar vazio.

### COMP-06: Tipar as props com TypeScript
**Fonte:** [SLIDE] PROPS p. 9 (item 5 "Validação de Props": "Use PropTypes ou TypeScript") + [DECISÃO] TypeScript, sem PropTypes
**Regra:** Toda prop tipada com um `type NomeProps = { ... }` logo acima do componente. Não usar
PropTypes (o projeto já é TypeScript; PropTypes seria uma biblioteca a mais). Quando o dado vem de
um schema, reaproveite o tipo inferido (FORM-03, API-04).
**✅ Certo:**
```tsx
type CartaoOcorrenciaProps = { ocorrencia: Ocorrencia } // Ocorrencia = z.infer<...>
```
**❌ Errado:** `function Cartao({ ocorrencia }: any)` ou `import PropTypes from 'prop-types'`.
**Como verificar:** `rg -n ": any\b|prop-types" app components lib` deve retornar vazio.
**Nota de versão:** o slide marca este item como "Pendente" no checklist; aqui ele é obrigatório.

### COMP-07: Separar lógica de negócio da apresentação
**Fonte:** [SLIDE] PROPS p. 9 (item 4 "Separação de Lógica", "Use hooks customizados", `useUserData()`) + [DECISÃO] a lógica de dados mora em `lib/`
**Regra:** Componentes desenham. Buscar, validar e decidir permissão fica em `lib/` (serviços,
schemas, DAL). No App Router a busca é feita no servidor (API-05), então o papel que o slide dá ao
"hook customizado" é cumprido pelas funções de `lib/`. Hook customizado (`useAlgo`) só se surgir
lógica de cliente repetida.
**✅ Certo:**
```tsx
const ocorrencias = await listarOcorrencias({ setorId }) // lib/ocorrencias.ts
return <ListaOcorrencias itens={ocorrencias} />
```
**❌ Errado:** `fetch('http://localhost:3001/ocorrencias')` dentro do JSX ou do componente.
**Como verificar:** `rg -n "fetch\(" app components` deve retornar vazio (todo fetch fica em `lib/`).

### COMP-08: Documentar componentes reutilizáveis com JSDoc curto
**Fonte:** [SLIDE] PROPS p. 9 (item 6 "Documentação", `/** @param */`); PROPS p. 12 ("Dica: Sempre documente seus componentes")
**Regra:** Componentes de `components/` (os reutilizáveis) têm um JSDoc de uma ou duas linhas
dizendo o que fazem. Páginas e componentes de uso único não precisam.
**✅ Certo:**
```tsx
/** Campo de texto com label, mensagem de erro acessível e integração com RHF. */
export function CampoTexto(...) { ... }
```
**❌ Errado:** JSDoc de 15 linhas repetindo o tipo das props.
**Como verificar:** abrir cada arquivo de `components/` (exceto `components/ui/`) e conferir a linha `/** ... */` acima do export.

### COMP-09: Estado local com useState só para o que muda e pertence ao componente
**Fonte:** [SLIDE] PROPS p. 6 ("Escopo Local"), p. 7 (`const [state, setState] = useState(initialValue)`), p. 8 ("State é como variáveis locais")
**Regra:** `useState` guarda dados que mudam com a interação e só interessam àquele componente
(menu aberto, aba ativa). Não guarde em estado:
- dado que vem do servidor (busque na página, API-05);
- filtro/paginação (vai na URL, ROTA-14);
- valor de campo de formulário (é do RHF, FORM-12).
**✅ Certo:**
```tsx
'use client'
const [menuAberto, setMenuAberto] = useState(false)
```
**❌ Errado:**
```tsx
const [ocorrencias, setOcorrencias] = useState([])
useEffect(() => { fetch(...).then(...) }, [])
```
**Como verificar:** `rg -n "useState" app components` e revisar cada um contra as três exceções acima.
O enunciado pede "estado local" explicitamente: o projeto precisa de pelo menos um `useState`
legítimo (ex.: abrir/fechar o menu no celular, botão "mostrar senha" no login). Se não houver,
a auditoria acusa pendência (REQ-06 da skill `auditoria-apresentacao`).

### COMP-10: Nunca mutar o estado diretamente
**Fonte:** [SLIDE] PROPS p. 7 ("Imutabilidade: Nunca mutar diretamente. Use spread operator para objetos/arrays")
**Regra:** Atualize sempre pelo setter com um valor novo. Em arrays e objetos, crie cópia com spread.
**✅ Certo:**
```tsx
setSelecionados([...selecionados, id])
```
**❌ Errado:**
```tsx
selecionados.push(id); setSelecionados(selecionados)
```
**Como verificar:** `rg -n "\.(push|splice|pop|shift)\(" app components` e conferir se o alvo é estado.

### COMP-11: Fluxo unidirecional: dados descem por props, eventos sobem por callback
**Fonte:** [SLIDE] PROPS p. 10 ("Dados descem, eventos sobem", "Lifting State"); PROPS p. 12
**Regra:** O pai é dono do estado compartilhado e passa valor + callback aos filhos. Se dois irmãos
precisam do mesmo estado, ele sobe para o pai comum.
**✅ Certo:**
```tsx
<Filtro valor={nivel} aoMudar={setNivel} />
<Lista nivel={nivel} />
```
**❌ Errado:** irmão lendo estado do outro por variável global ou `document.querySelector`.
**Como verificar:** callbacks passados como prop seguem o padrão `aoX`/`onX`; nenhum filho importa estado de outro.

### COMP-12: Montar telas por composição
**Fonte:** [SLIDE] JSX p. 10 ("Composição", `<Header/> <Sidebar/> <MainContent/> <Footer/>`); JSX p. 5
**Regra:** Telas e layouts são combinações de componentes menores. O layout do painel compõe
`<Sidebar />` e `{children}`; a página compõe filtro, lista e estado vazio.
**✅ Certo:**
```tsx
<div className="flex">
  <Sidebar />
  <main className="flex-1">{children}</main>
</div>
```
**❌ Errado:** todo o HTML da sidebar escrito dentro do layout.
**Como verificar:** layouts e páginas têm JSX curto, chamando componentes nomeados.

### COMP-13: Listas com key única e estável
**Fonte:** [SLIDE] JSX p. 11 e p. 12 ("Sempre use key única em listas") + [DOCS] react.dev, "Rendering Lists" (https://react.dev/learn/rendering-lists)
**Regra:** Todo `.map()` que gera JSX tem `key`. Use o `id` do registro.
**✅ Certo:**
```tsx
{ocorrencias.map((o) => <CartaoOcorrencia key={o.id} ocorrencia={o} />)}
```
**❌ Errado:**
```tsx
{ocorrencias.map((o, index) => <CartaoOcorrencia key={index} ocorrencia={o} />)}
```
**Como verificar:** `rg -n "key=\{(i|index|idx)\}" app components` deve retornar vazio.
**Nota de versão:** os exemplos do slide (JSX p. 11, p. 12) usam `key={index}` numa lista fixa de
strings. A doc do React desaconselha índice quando a lista muda (filtro, inclusão, remoção), o que
acontece aqui. O projeto usa o `id` vindo da API.

### COMP-14: Renderização condicional com ternário ou &&
**Fonte:** [SLIDE] JSX p. 11 (`{isLogged ? ... : ...}`), JSX p. 12 ("Condicionais: ternário ou &&")
**Regra:** Use ternário quando há duas saídas e `&&` quando há uma. Cuidado com número à esquerda
do `&&` (JS-08).
**✅ Certo:**
```tsx
{ocorrencias.length > 0 ? <ListaOcorrencias itens={ocorrencias} /> : <EstadoVazio />}
{errors.titulo && <p role="alert">{errors.titulo.message}</p>}
```
**❌ Errado:**
```tsx
{ocorrencias.length && <ListaOcorrencias itens={ocorrencias} />} // mostra "0" na tela
```
**Como verificar:** `rg -n "\.length &&" app components` deve retornar vazio.

### COMP-15: Sintaxe JSX: className, htmlFor, eventos em camelCase, um elemento raiz
**Fonte:** [SLIDE] JSX p. 8 (tabela JSX vs HTML: `className`, `htmlFor`, `style={{}}`, `onClick`); JSX p. 6 ("Retorna um único elemento pai")
**Regra:** `className` (nunca `class`), `htmlFor` (nunca `for`), eventos em camelCase, expressões
entre `{}`. O componente retorna um elemento raiz (ou fragmento `<>...</>`).
**✅ Certo:**
```tsx
<label htmlFor="titulo" className="text-sm">Título</label>
```
**❌ Errado:**
```tsx
<label for="titulo" class="text-sm">Título</label>
```
**Como verificar:** `rg -n " class=\"| for=\"" app components` deve retornar vazio.

### COMP-16: Nunca injetar HTML cru
**Fonte:** [SLIDE] JSX p. 7 ("Seguro: Previne XSS automaticamente", "Escapamento automático de strings"); JS p. 12 (`.innerHTML`: "risco de segurança (XSS) se usado com dados do usuário")
**Regra:** Texto vindo do usuário ou da API é renderizado com `{valor}`. Proibido
`dangerouslySetInnerHTML` e `innerHTML`.
**✅ Certo:**
```tsx
<p>{ocorrencia.descricao}</p>
```
**❌ Errado:**
```tsx
<p dangerouslySetInnerHTML={{ __html: ocorrencia.descricao }} />
```
**Como verificar:** `rg -n "dangerouslySetInnerHTML|innerHTML" app components lib` deve retornar vazio.
