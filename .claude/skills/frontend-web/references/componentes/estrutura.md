# Estrutura e reuso de componentes

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
**❌ Errado:** `fetch(process.env.API_URL + '/ocorrencias')` dentro do JSX ou do componente.
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
