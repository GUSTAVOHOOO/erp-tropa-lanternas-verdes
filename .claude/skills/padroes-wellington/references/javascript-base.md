# JavaScript de base aplicável ao projeto (JS)

Deck: JS (`javascript_fundamentos_dom.pdf`). Só entra aqui o que vale num projeto React/Next.
A parte de DOM (querySelector, addEventListener, classList, p. 10 a 16) é o "jeito antigo" que o
React substitui (JSX p. 2 e p. 13): por isso virou uma regra de proibição (JS-06).

---

### JS-01: const por padrão, let só se reatribuir, nunca var
**Fonte:** [SLIDE] JS p. 5 ("CONST... Imutável"; "LET... Mutável"; "VAR (legado): Evitar"; "Dica: Use const por padrão. Só use let se você souber que o valor precisará mudar")
**Regra:** Declare com `const`. Use `let` só quando o valor é reatribuído (ex.: `let ocorrencia`
antes do `try` em API-12). Nunca `var`.
**✅ Certo:** `const setores = await listarSetores()`
**❌ Errado:** `var setores = ...` ou `let setores = ...` que nunca muda.
**Como verificar:** `rg -n "\bvar\s" app components lib proxy.ts` deve retornar vazio (o ESLint do Next também acusa `prefer-const`).

### JS-02: Comparação estrita (=== e !==)
**Fonte:** [SLIDE] JS p. 6 ("== Valor igual (solto)"; "=== Igual estrito (Tipo+Valor)")
**Regra:** Sempre `===` e `!==`.
**✅ Certo:** `if (sessao.papel === 'guardiao')`
**❌ Errado:** `if (status == 404)`
**Como verificar:** `rg -n -P "[^=!<>]==[^=]|!=[^=]" app components lib proxy.ts` deve retornar vazio.

### JS-03: Early return / guard clause em vez de ifs aninhados
**Fonte:** [SLIDE] JS p. 7 ("Dica: Evite aninhar muitos if dentro de outros. Use 'Early Return' ou Guard Clauses para limpar o código")
**Regra:** Trate o caso de saída primeiro e retorne (ou `redirect`/`notFound`, que interrompem).
**✅ Certo:**
```ts
if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }
if (sessao.papel === 'lanterna' && parsed.data.setorId !== sessao.setorId) return { ok: false, erro: 'Você só pode registrar ocorrências no seu setor.' }
await salvarOcorrencia(...)
```
**❌ Errado:** `if (parsed.success) { if (permitido) { ... } else { ... } } else { ... }`
**Como verificar:** revisão: nenhuma função com mais de dois níveis de `if` aninhado.

### JS-04: Funções nomeadas com verbo
**Fonte:** [SLIDE] JS p. 9 ("Dica: Use nomes de verbos para funções (ex: calcularTotal, obterUsuario)"); APIS p. 7 e p. 14 (`buscarProdutos`); FORMS p. 20 (`criarConta`)
**Regra:** Funções e Server Actions começam com verbo em português: `listarOcorrencias`,
`buscarOcorrencia`, `criarOcorrencia`, `atribuirResponsavel`, `verificarSessao`, `entrar`, `sair`.
Componentes são substantivos em PascalCase (COMP-01).
**✅ Certo:** `export async function listarSetores()`
**❌ Errado:** `export async function setores()` ou `dadosOcorrencia()`.
**Como verificar:** `rg -n "export (async )?function [a-z]" lib app` e conferir que o nome começa com verbo.

### JS-05: Arrow functions para callbacks
**Fonte:** [SLIDE] JS p. 9 ("Arrow Function (ES6): Sintaxe mais curta e moderna. Ideal para callbacks e funções anônimas"); JS p. 14
**Regra:** Callbacks de `map`, `filter`, eventos e `.refine` são arrow functions. Componentes e
funções exportadas usam `function` nomeada (aparecem com nome no stack e no React DevTools).
**✅ Certo:** `ocorrencias.map((o) => <CartaoOcorrencia key={o.id} ocorrencia={o} />)`
**❌ Errado:** `ocorrencias.map(function (o) { return ... })`
**Como verificar:** `rg -n "\.(map|filter|find)\(function" app components lib` deve retornar vazio.

### JS-06: Não manipular o DOM direto; o React cuida da tela
**Fonte:** [SLIDE] JSX p. 2 ("React gerencia o DOM automaticamente"), JSX p. 13 ("DOM Tradicional: LEGADO / React: RECOMENDADO"; "Manipulação manual do DOM é verbosa e propensa a erros"); JS p. 12 (`innerHTML` e XSS)
**Regra:** Nada de `document.querySelector`, `getElementById`, `addEventListener`, `classList`,
`innerHTML` em componentes. Evento é prop JSX (`onClick`), visual vem do estado (COMP-09) e do
`className` (CSS-02).
**✅ Certo:** `<button onClick={() => setMenuAberto(!menuAberto)}>`
**❌ Errado:** `document.querySelector('#menu').classList.toggle('aberto')`
**Como verificar:** `rg -n "document\.|addEventListener|classList|getElementById|querySelector" app components` deve retornar vazio.

### JS-07: Cuidar de null e undefined com optional chaining
**Fonte:** [SLIDE] JS p. 11 ("Atenção (null): Se nenhum elemento for encontrado, retorna null. Tentar manipular (ex: null.style) gera erro fatal"); JS p. 5 (undefined e null); FORMS p. 16 e p. 20 (`errors.email?.message`, `estado.errors.email?.[0]`)
**Regra:** Ao ler algo que pode não existir, use `?.` e `??`. Dado ausente que impede a tela vira
`notFound()` (ROTA-12), não `!` forçado.
**✅ Certo:** `request.cookies.get(NOME_COOKIE)?.value`, `errors.titulo?.message`
**❌ Errado:** `request.cookies.get(NOME_COOKIE)!.value`
**Como verificar:** `rg -n "\w!\." app components lib proxy.ts` deve retornar vazio (non-null assertion).

### JS-08: Truthy/falsy: cuidado com 0 e string vazia em condições
**Fonte:** [SLIDE] JS p. 7 ("Truthy & Falsy: Falsy: false, 0, "", null, undefined, NaN") + [DOCS] https://react.dev/learn/conditional-rendering (armadilha "Don't put numbers on the left side of &&")
**Regra:** Em JSX, condição com `&&` precisa ser booleana: `lista.length > 0 &&`, nunca
`lista.length &&` (renderiza "0"). Para "tem valor?", compare explicitamente quando 0 ou `''` são válidos.
**✅ Certo:** `{ocorrencias.length > 0 && <Resumo total={ocorrencias.length} />}`
**❌ Errado:** `{ocorrencias.length && <Resumo ... />}`
**Como verificar:** `rg -n "\.length &&" app components` deve retornar vazio (mesma checagem de COMP-14).

### JS-09: Percorrer arrays com map/filter/find, não com for
**Fonte:** [SLIDE] JS p. 8 ("Iteração de listas: Formas modernas de percorrer arrays. Mais limpo e legível", `lista.forEach(item => ...)`); JSX p. 11 (`usuarios.map(...)`)
**Regra:** Transformar lista = `map`; filtrar = `filter`; achar um = `find`. `for` clássico só se
houver motivo (ex.: `for...of` com `setError` em FORM-18, que é efeito colateral).
**✅ Certo:** `const abertas = ocorrencias.filter((o) => o.status === 'aberta')`
**❌ Errado:** `for (let i = 0; i < ocorrencias.length; i++) { if (...) abertas.push(ocorrencias[i]) }`
**Como verificar:** `rg -n "for \(let i" app components lib` deve retornar vazio.
