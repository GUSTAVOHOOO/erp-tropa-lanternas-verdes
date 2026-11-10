# Props, tipos e fluxo de dados

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
