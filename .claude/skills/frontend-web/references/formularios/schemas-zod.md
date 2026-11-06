# Schemas Zod

### FORM-02: Schemas ficam em lib/schemas/
**Fonte:** [SLIDE] FORMS p. 14 (arquivo `lib/schemas/cadastro.ts`), p. 15 ("Coloque os schemas em lib/schemas/ e importe-os no componente cliente e na Server Action"), p. 21
**Regra:** Um arquivo por entidade em `lib/schemas/` (`ocorrencia.ts`, `login.ts`, `atribuicao.ts`).
O mesmo schema é importado pelo formulário e pela Server Action. O schema de resposta da API
(API-04) mora no mesmo arquivo da entidade.
**✅ Certo:** `import { novaOcorrenciaSchema } from '@/lib/schemas/ocorrencia'` no form e na action.
**❌ Errado:** `const schema = z.object({...})` declarado dentro de `FormOcorrencia.tsx`.
**Como verificar:** `rg -n "z\.object\(" app components` deve retornar vazio.

### FORM-03: O tipo nasce do schema (z.infer), sem interface duplicada
**Fonte:** [SLIDE] FORMS p. 15 ("z.infer: o tipo nasce do schema", `z.input`/`z.output` "quando há coerce ou transform") + [DOCS] https://github.com/react-hook-form/resolvers (zodResolver: omitir o genérico ou passar os três `useForm<z.input<...>, unknown, z.output<...>>`)
**Regra:** Exporte o tipo junto do schema: `export type NovaOcorrenciaData = z.infer<typeof novaOcorrenciaSchema>`.
Nunca escreva uma `interface` à mão para o mesmo formato. No `useForm`, não passe genérico: o
`zodResolver` infere entrada e saída. O `onSubmit` recebe o tipo de saída.
**✅ Certo:**
```ts
export type NovaOcorrenciaData = z.infer<typeof novaOcorrenciaSchema> // [FORM-03]
async function onSubmit(dados: NovaOcorrenciaData) { ... }
```
**❌ Errado:**
```ts
interface NovaOcorrencia { titulo: string; envolvidos: number } // segunda verdade
useForm<NovaOcorrenciaData>({ resolver: zodResolver(schemaComCoerce) }) // erro de tipo com coerce
```
**Como verificar:** `rg -n "^(export )?interface " lib app components` só acha tipos sem schema correspondente; `rg -n "useForm<" app components` deve retornar vazio.
**Nota de versão:** o slide p. 16 usa `useForm<CadastroData>`. Isso funciona quando o schema não tem
`coerce`/`transform`/`default`. Com Zod 4 + `@hookform/resolvers` atual, o tipo de entrada do
`z.coerce` é `unknown`, e um genérico só dá erro de compilação. Por isso o projeto omite o genérico.

### FORM-13: Número vindo de input passa por z.coerce
**Fonte:** [SLIDE] FORMS p. 5 ("Números chegam como string... A conversão é responsabilidade da validação"), p. 14 (`idade: z.coerce.number().int().min(18, ...)`), p. 15, p. 21 (armadilha)
**Regra:** Campo numérico no formulário usa `z.coerce.number()` no schema. O `defaultValues` pode
ser `''` (o input entrega texto).
**✅ Certo:**
```ts
envolvidos: z.coerce.number().int('Use um número inteiro.').min(1, 'Informe quantos seres estão envolvidos (mínimo 1).'), // [FORM-13]
```
**❌ Errado:** `envolvidos: z.number()` (sempre falha: o input entrega `"3"`).
**Como verificar:** `rg -n "z\.number\(\)" lib/schemas` só pode aparecer em schemas de resposta da API, nunca em schema de formulário.

### FORM-14: Regra entre campos com .refine e path
**Fonte:** [SLIDE] FORMS p. 14 (`.refine(d => d.senha === d.confirmarSenha, { message, path: ['confirmarSenha'] })`), p. 19 ("`.refine` para uma regra; `.superRefine` quando precisar reportar vários erros"), p. 21 (armadilha ".refine sem path: o erro não aparece em campo nenhum")
**Regra:** Validação que depende de dois campos usa `.refine(fn, { message, path: ['campo'] })` no
objeto. Mais de uma regra cruzada: `.superRefine` com `ctx.addIssue({ code: 'custom', path, message })`.
**✅ Certo:**
```ts
export const atualizarStatusSchema = z.object({
  status: z.enum(STATUS),
  resolucao: z.string().trim(),
}).refine((d) => d.status !== 'resolvida' || d.resolucao.length >= 10, {
  message: 'Explique em pelo menos 10 caracteres como a ocorrência foi resolvida.',
  path: ['resolucao'], // [FORM-14]
})
```
**❌ Errado:** o mesmo `.refine` sem `path` (o erro vai para a raiz e nenhum campo mostra).
**Como verificar:** `rg -n -A4 "\.refine\(" lib/schemas` e conferir `path:` em cada refine de objeto.

### FORM-15: Zod 4: validadores de formato são funções de topo
**Fonte:** [SLIDE] FORMS p. 14 ("Nota de versão: no Zod 4 os validadores de formato são funções de topo (z.email(), z.uuid()); no Zod 3 eram métodos") + [DOCS] https://zod.dev/api
**Regra:** Use `z.email('...')`, `z.uuid()`, `z.url()`. Import no estilo da doc: `import * as z from 'zod'`.
**✅ Certo:** `email: z.email('Informe um e-mail válido, como hal@oa.corps.')`
**❌ Errado:** `email: z.string().email()` (estilo Zod 3, marcado como obsoleto no Zod 4).
**Como verificar:** `rg -n "z\.string\(\)\.(email|uuid|url)\(" lib` deve retornar vazio.
**Nota de versão:** o slide importa com `import { z } from 'zod'`; a doc do Zod 4 recomenda
`import * as z from 'zod'`. Os dois funcionam; o projeto usa o da doc.
