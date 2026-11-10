# Estado, listas e JSX

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
há uma pendência no requisito de estado local do enunciado (REQ-06).

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
