# Formulários, React Hook Form e Zod (FORM)

Deck: FORMS (`formularios-validacao-rhf-zod.pdf`). Checklist do professor (FORMS p. 21):

| Item do checklist (p. 21) | Regra |
|---|---|
| Schemas em lib/schemas/, fora dos componentes | FORM-02 |
| Sempre declarar defaultValues | FORM-04 |
| mode: 'onBlur' + reValidateMode: 'onChange' | FORM-05 |
| Revalidar tudo no servidor com safeParse | FORM-17 |
| Desabilitar o botão com isSubmitting / isPending | FORM-08 |
| Mensagens específicas, em português, orientando a correção | FORM-11 |
| Extrair um componente `<CampoTexto>` reutilizável | FORM-22 |
| Armadilha: misturar useState com register no mesmo campo | FORM-12 |
| Armadilha: esquecer o resolver e achar que o Zod está validando | FORM-01 |
| Armadilha: usar watch() no componente todo | FORM-21 |
| Armadilha: número sem z.coerce | FORM-13 |
| Armadilha: confiar só no cliente e deixar a API desprotegida | FORM-17, AUTH-05 |
| Armadilha: .refine sem path | FORM-14 |
| Armadilha: chamar onSubmit direto, sem handleSubmit | FORM-06 |

Padrão único de formulário do projeto (DEC-05): componente cliente com RHF + `zodResolver`; no
`onSubmit`, chama a Server Action como função passando o objeto já validado; a action revalida com
`safeParse`, grava via `lib/` e faz `redirect`, ou devolve `ResultadoAcao` com erros.

```ts
// lib/resultado-acao.ts
export type ResultadoAcao = {
  ok: boolean
  erro?: string                                  // erro geral (vai para errors.root)
  errors?: Record<string, string[] | undefined>  // erros por campo (z.flattenError)
}
```


Índice: FORM-01 Formulário = React Hook Form + zodResolver, nunca um useState por campo · FORM-02 Schemas ficam em lib/schemas/ · FORM-03 O tipo nasce do schema (z.infer), sem interface duplicada · FORM-04 Sempre declarar defaultValues · FORM-05 mode 'onBlur' + reValidateMode 'onChange' · FORM-06 Sempre handleSubmit; nunca chamar onSubmit direto · FORM-07 noValidate no form · FORM-08 Botão desabilitado durante o envio (isSubmitting) · FORM-09 Todo campo tem name, id e label ligada por htmlFor · FORM-10 Erro acessível: aria-invalid, aria-describedby e role="alert" · FORM-11 Mensagens específicas, em português, ao lado do campo · FORM-12 Nunca misturar useState com register no mesmo campo · FORM-13 Número vindo de input passa por z.coerce · FORM-14 Regra entre campos com .refine e path · FORM-15 Zod 4: validadores de formato são funções de topo · FORM-16 Componente de UI controlado usa Controller; input nativo usa register · FORM-17 Revalidar tudo no servidor com safeParse · FORM-18 Erros do servidor com z.flattenError (Zod 4) · FORM-19 Erro que só o servidor conhece vai para o campo com setError · FORM-20 Atributos nativos como reforço, nunca como validação · FORM-21 watch só de um campo, onde precisa · FORM-22 Componente CampoTexto reutilizável

---

### FORM-01: Formulário = React Hook Form + zodResolver, nunca um useState por campo
**Fonte:** [SLIDE] FORMS p. 6 ("Um useState por campo não escala"), p. 9 (RHF "agnóstico de validação: quem valida é um resolver"), p. 16 (`resolver: zodResolver(cadastroSchema)`), p. 21 (armadilha "esquecer o resolver")
**Regra:** Todo formulário usa `useForm` com `resolver: zodResolver(schema)`. Nenhuma regra de
validação dentro do componente.
**✅ Certo:**
```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { novaOcorrenciaSchema } from '@/lib/schemas/ocorrencia'

const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(novaOcorrenciaSchema), // [FORM-01]
  mode: 'onBlur',
  reValidateMode: 'onChange',
  defaultValues: { titulo: '', descricao: '', setorId: '', gravidade: 'media', envolvidos: '' },
})
```
**❌ Errado:**
```tsx
const [titulo, setTitulo] = useState('')
const [erroTitulo, setErroTitulo] = useState('')
```
ou `register('titulo', { required: true })` com schema Zod existente mas sem resolver.
**Como verificar:** todo arquivo com `useForm(` contém `zodResolver(` (`rg -l "useForm\(" app components | xargs rg -L "zodResolver"` deve retornar vazio).

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

### FORM-04: Sempre declarar defaultValues
**Fonte:** [SLIDE] FORMS p. 5 ("Nunca use value={undefined}. Sempre inicialize com '' ou use defaultValues"), p. 10 ("defaultValues não é opcional na prática"), p. 21
**Regra:** Todo `useForm` tem `defaultValues` com todos os campos (`''` para texto, valor inicial
para select, `false` para checkbox).
**✅ Certo:** `defaultValues: { email: '', senha: '' }`
**❌ Errado:** `useForm({ resolver })` sem `defaultValues`.
**Como verificar:** `rg -l "useForm\(" app components | xargs rg -L "defaultValues"` deve retornar vazio.

### FORM-05: mode 'onBlur' + reValidateMode 'onChange'
**Fonte:** [SLIDE] FORMS p. 12 ("configuração recomendada"; "não acuse erro enquanto a pessoa ainda está digitando pela primeira vez; depois que ela erra, corrija em tempo real"), p. 21
**Regra:** Todo `useForm` usa `mode: 'onBlur'` e `reValidateMode: 'onChange'`.
**✅ Certo:** ver FORM-01.
**❌ Errado:** `mode: 'onChange'` (acusa erro na primeira tecla) ou modo omitido.
**Como verificar:** `rg -l "useForm\(" app components | xargs rg -L "mode: 'onBlur'"` deve retornar vazio.

### FORM-06: Sempre handleSubmit; nunca chamar onSubmit direto
**Fonte:** [SLIDE] FORMS p. 10 ("handleSubmit(onValid, onInvalid): Valida tudo; se passar, chama onValid(dados) já com os dados tipados"), p. 11, p. 21 (armadilha)
**Regra:** `<form onSubmit={handleSubmit(onSubmit)}>`.
**✅ Certo:** `<form onSubmit={handleSubmit(onSubmit)} noValidate>`
**❌ Errado:** `<form onSubmit={onSubmit}>` ou `<button onClick={() => onSubmit(getValues())}>`.
**Como verificar:** `rg -n "onSubmit=\{(?!handleSubmit)" -P app components` deve retornar vazio.

### FORM-07: noValidate no form
**Fonte:** [SLIDE] FORMS p. 11 ("noValidate no `<form>` desliga os balões do navegador — quem manda nas mensagens agora é você"), p. 16
**Regra:** Todo `<form>` controlado pelo RHF tem `noValidate`. Os atributos nativos (`type`,
`autoComplete`, `inputMode`) continuam (FORM-20).
**✅ Certo:** `<form onSubmit={handleSubmit(onSubmit)} noValidate>`
**❌ Errado:** `<form onSubmit={handleSubmit(onSubmit)}>` com `required` disparando balão em inglês.
**Como verificar:** `rg -n "<form[^>]*handleSubmit" app components` e conferir `noValidate` em cada linha.

### FORM-08: Botão desabilitado durante o envio (isSubmitting)
**Fonte:** [SLIDE] FORMS p. 11 ("isSubmitting desabilita o botão enquanto a Promise não resolve"), p. 12, p. 17 (evite "deixar o botão habilitado durante o envio"), p. 21; APIS p. 16 ("Trave o botão")
**Regra:** O botão de envio usa `disabled={isSubmitting}` e troca o texto ("Enviando..."). O
`onSubmit` é `async` e faz `await` da action, senão `isSubmitting` volta a `false` antes da hora.
**✅ Certo:**
```tsx
<Button type="submit" disabled={isSubmitting}> {/* [FORM-08] */}
  {isSubmitting ? 'Registrando...' : 'Registrar ocorrência'}
</Button>
```
**❌ Errado:** botão sem `disabled`; `onSubmit` que chama a action sem `await`.
**Como verificar:** `rg -n "type=\"submit\"" app components` e conferir `disabled={isSubmitting}` (ou `isPending` no form de sair, AUTH-09, que não usa RHF e não precisa).

### FORM-09: Todo campo tem name, id e label ligada por htmlFor
**Fonte:** [SLIDE] FORMS p. 5 ("Todo input precisa de name"; "`<label htmlFor>` ligado ao id do input"), p. 11, p. 17; JSX p. 8 (`htmlFor`)
**Regra:** `register('campo')` já define `name`. Defina `id` igual ao nome do campo e um `<label htmlFor>`
(ou `<Label htmlFor>` do shadcn) apontando para ele. Placeholder não substitui label.
**✅ Certo:**
```tsx
<Label htmlFor="titulo">Título</Label>
<Input id="titulo" {...register('titulo')} />
```
**❌ Errado:** `<Input placeholder="Título" {...register('titulo')} />` sem label.
**Como verificar:** cada `{...register(` tem um `id=` na mesma tag e um `htmlFor` correspondente no arquivo (ou usa `CampoTexto`, FORM-22).

### FORM-10: Erro acessível: aria-invalid, aria-describedby e role="alert"
**Fonte:** [SLIDE] FORMS p. 11 ("errors.nome?.message com role=\"alert\" para leitores de tela"), p. 16 (`aria-invalid={!!errors.email}`), p. 17 (padrão "campo acessível": `aria-invalid`, `aria-describedby`, `<p id="email-erro" role="alert">`)
**Regra:** Campo com erro recebe `aria-invalid` e `aria-describedby` apontando para o id da
mensagem; a mensagem tem `id` e `role="alert"`. Sem erro, `aria-describedby` fica `undefined`.
**✅ Certo:**
```tsx
<Input id="titulo" {...register('titulo')}
  aria-invalid={errors.titulo ? true : false}
  aria-describedby={errors.titulo ? 'titulo-erro' : undefined} />
{errors.titulo && <p id="titulo-erro" role="alert" className="text-sm text-destructive">{errors.titulo.message}</p>}
```
**❌ Errado:** `<span className="text-destructive">{errors.titulo?.message}</span>` sem role nem ligação.
**Como verificar:** `rg -n "errors\.\w+(\?)?\.message" app components` e conferir `role="alert"` na mesma tag; `rg -n "aria-describedby" app components`.

### FORM-11: Mensagens específicas, em português, ao lado do campo
**Fonte:** [SLIDE] FORMS p. 14 ("Mensagem sempre em 2º lugar... escreva em português e em tom de ajuda"), p. 17 (FAÇA: "Mensagem ao lado do campo", "Diga como corrigir", "Dê foco ao primeiro campo inválido", "Cor e ícone/texto — nunca só a cor"; EVITE: "Mensagens genéricas", "Limpar o formulário inteiro quando um campo falha"), p. 21
**Regra:** Toda regra do schema tem mensagem em português dizendo como corrigir. A mensagem aparece
embaixo do campo, em texto (não só borda vermelha). Não chame `reset()` quando a action falha.
O foco no primeiro campo inválido já vem do RHF (`shouldFocusError` é `true` por padrão): não desligue.
**✅ Certo:** `z.string().trim().min(5, 'Descreva a ocorrência em pelo menos 5 caracteres.')`
**❌ Errado:** `z.string().min(5)` (mensagem padrão em inglês) ou `'Campo inválido'`.
**Como verificar:** `rg -n "\.(min|max|regex|email|enum)\([^,)]*\)" lib/schemas` acha validadores sem mensagem (revisar cada um); `rg -n "shouldFocusError: false" app components` deve retornar vazio.

### FORM-12: Nunca misturar useState com register no mesmo campo
**Fonte:** [SLIDE] FORMS p. 21 (armadilha "Misturar useState com register no mesmo campo"); FORMS p. 4 (RHF usa inputs não controlados)
**Regra:** O valor do campo é do RHF. Se precisar ler o valor para mostrar algo, use `useWatch({ control, name: 'campo' })`
de um campo específico (FORM-21), não `useState` + `onChange`.
**✅ Certo:** `<Input id="titulo" {...register('titulo')} />`
**❌ Errado:**
```tsx
const [titulo, setTitulo] = useState('')
<Input {...register('titulo')} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
```
**Como verificar:** arquivos com `register(` e `useState` ao mesmo tempo merecem revisão manual (`rg -l "register\(" app components | xargs rg -l "useState"`).

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

### FORM-16: Componente de UI controlado usa Controller; input nativo usa register
**Fonte:** [SLIDE] FORMS p. 18 ("Regra prática: input nativo → register. Date picker, select estilizado, máscara de moeda, editor rich text → Controller"; `onValueChange={field.onChange} // nome do handler varia por lib`) + [DOCS] https://ui.shadcn.com/docs/forms/react-hook-form
**Regra:** `Input` e `Textarea` do shadcn são inputs nativos estilizados: use `register`. `Select`,
`Checkbox`, `RadioGroup` e `Switch` do shadcn (Base UI) são controlados: use `<Controller>`
repassando `field.value`, `field.onChange`, `field.onBlur`, e mostre `fieldState.error`.
**✅ Certo:**
```tsx
<Controller name="gravidade" control={control} render={({ field, fieldState }) => ( // [FORM-16]
  <>
    <Label htmlFor="gravidade">Gravidade</Label>
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger id="gravidade" onBlur={field.onBlur} aria-invalid={fieldState.invalid}
        aria-describedby={fieldState.error ? 'gravidade-erro' : undefined}>
        <SelectValue placeholder="Escolha" />
      </SelectTrigger>
      <SelectContent>
        {GRAVIDADES.map((g) => <SelectItem key={g} value={g}>{rotuloGravidade[g]}</SelectItem>)}
      </SelectContent>
    </Select>
    {fieldState.error && <p id="gravidade-erro" role="alert">{fieldState.error.message}</p>}
  </>
)} />
```
**❌ Errado:** `<Select {...register('gravidade')}>` (o componente não expõe `ref` de input nativo; o valor nunca chega ao RHF).
**Como verificar:** `rg -n "<(Select|Checkbox|RadioGroup|Switch)[ >]" app components` só aparece dentro de `render={` de um `Controller`.
**Nota de versão:** a doc do shadcn usa `Controller` até para `Input`, com os componentes `Field`.
O projeto segue a regra do slide (register no nativo) por ser mais simples; os dois são válidos.

### FORM-17: Revalidar tudo no servidor com safeParse
**Fonte:** [SLIDE] FORMS p. 8 ("A validação no cliente é experiência do usuário. A validação no servidor é segurança"; "Regra de ouro: nunca confie no cliente"), p. 13 (`.safeParse()` "sem try/catch"), p. 20 (`cadastroSchema.safeParse(...)`; "Uma Server Action é um endpoint público"), p. 21
**Regra:** Toda Server Action recebe `dados: unknown` e faz `schema.safeParse(dados)` com o MESMO
schema do formulário, depois da checagem de sessão (AUTH-05). Só usa `parsed.data` daí em diante.
**✅ Certo:**
```ts
'use server'
export async function registrarOcorrencia(dados: unknown): Promise<ResultadoAcao> {
  const sessao = await verificarSessao() // [AUTH-05]
  const parsed = novaOcorrenciaSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]
  ...
}
```
**❌ Errado:** `export async function registrarOcorrencia(dados: NovaOcorrenciaData) { await salvar(dados) }` (o tipo não existe em tempo de execução).
**Como verificar:** todo arquivo com `'use server'` contém `safeParse` (exceto `sair`, que não recebe dados): `rg -l "^['\"]use server['\"]" app | xargs rg -L "safeParse"`.

### FORM-18: Erros do servidor com z.flattenError (Zod 4)
**Fonte:** [SLIDE] FORMS p. 20 (`z.flattenError(parsed.error).fieldErrors`, comentário "Zod 4: z.flattenError(err) | Zod 3: parsed.error.flatten()")
**Regra:** A action devolve `{ ok: false, errors: z.flattenError(parsed.error).fieldErrors }`. No
cliente, cada erro vira `setError(campo, { type: 'server', message })`.
**✅ Certo:**
```tsx
const resultado = await registrarOcorrencia(dados)
if (resultado?.errors) {
  for (const [campo, mensagens] of Object.entries(resultado.errors)) {
    setError(campo as keyof NovaOcorrenciaData, { type: 'server', message: mensagens?.[0] })
  }
}
```
**❌ Errado:** `parsed.error.flatten()` (forma do Zod 3) ou devolver `parsed.error` inteiro (não é serializável de forma útil).
**Como verificar:** `rg -n "\.flatten\(\)" app lib` deve retornar vazio.

### FORM-19: Erro que só o servidor conhece vai para o campo com setError
**Fonte:** [SLIDE] FORMS p. 19 ("setError — trazendo o erro da API para o campo", `{ shouldFocus: true }`; "Unicidade só o servidor sabe"); APIS p. 16 ("400 e 422 costumam trazer a mensagem: leve-a ao setError do campo")
**Regra:** Erro de negócio de um campo ("setor inexistente") → `setError('campo', ..., { shouldFocus: true })`.
Erro geral ("e-mail ou senha incorretos", "não foi possível salvar") → `setError('root', ...)`,
exibido em um `<p role="alert">` acima do botão.
**✅ Certo:**
```tsx
if (resultado?.erro) setError('root', { type: 'server', message: resultado.erro }) // [FORM-19]
{errors.root && <p role="alert">{errors.root.message}</p>}
```
**❌ Errado:** `alert(resultado.erro)` ou `console.log` e nada na tela.
**Como verificar:** todo form que chama action tem `setError(` e exibe `errors.root`.

### FORM-20: Atributos nativos como reforço, nunca como validação
**Fonte:** [SLIDE] FORMS p. 7 ("Use-a como reforço de UX e acessibilidade — nunca como a sua validação de verdade"; `type="email"`, `autoComplete`, `inputMode`; "Segurança — nenhuma")
**Regra:** Mantenha `type="email"`, `type="password"`, `autoComplete="email"`, `autoComplete="current-password"`,
`inputMode="numeric"`: eles dão teclado certo e preenchimento automático. A validação é do Zod.
**✅ Certo:** `<Input id="email" type="email" autoComplete="email" {...register('email')} />`
**❌ Errado:** confiar em `required`/`pattern` e não ter regra no schema.
**Como verificar:** campos de e-mail e senha do login têm `type` e `autoComplete`.

### FORM-21: watch só de um campo, onde precisa
**Fonte:** [SLIDE] FORMS p. 21 (armadilha "Usar watch() no componente todo e perder a performance"); p. 10
**Regra:** Se precisar mostrar algo dependente de um valor (ex.: campo "resolução" só aparece quando
status = resolvida), use `useWatch({ control, name: 'status' })` com o nome do campo. Nunca observe o formulário inteiro.
**✅ Certo:** `const status = useWatch({ control, name: 'status' })`
**❌ Errado:** `const valores = watch()`
**Como verificar:** `rg -n "watch\(" app components` (não deve achar `watch(` solto; `useWatch(` é o certo).
**Nota de versão:** o slide (FORMS p. 10 e p. 21) fala em `watch`. Com o ESLint do Next 16
(`eslint-plugin-react-hooks` 7), `watch()` gera o aviso `react-hooks/incompatible-library`, porque a
função não pode ser memorizada pelo React Compiler. O `useWatch({ control, name })` do próprio React
Hook Form observa um campo só, do mesmo jeito, sem o aviso. A ideia do slide (observar só o campo
necessário) continua a mesma.

### FORM-22: Componente CampoTexto reutilizável
**Fonte:** [SLIDE] FORMS p. 17 ("campo acessível — padrão para reaproveitar"), p. 21 ("Extrair um componente `<CampoTexto>` reutilizável")
**Regra:** `components/CampoTexto.tsx` concentra label + input + erro acessível (FORM-09, FORM-10).
Todos os campos de texto usam ele.
**✅ Certo:**
```tsx
import type { UseFormRegisterReturn } from 'react-hook-form'

/** Campo de texto com label, mensagem de erro acessível e integração com o RHF. */
export function CampoTexto({ id, rotulo, erro, registro, type = 'text', autoComplete }: CampoTextoProps) {
  const idErro = `${id}-erro`
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input id={id} type={type} autoComplete={autoComplete} {...registro}
        aria-invalid={erro ? true : false}
        aria-describedby={erro ? idErro : undefined} />
      {erro && <p id={idErro} role="alert" className="text-sm text-destructive">{erro}</p>}
    </div>
  )
}
// uso: <CampoTexto id="titulo" rotulo="Título" registro={register('titulo')} erro={errors.titulo?.message} />
```
**❌ Errado:** repetir label + input + `<p role="alert">` em cada formulário.
**Como verificar:** `rg -n "<CampoTexto" app` acha os usos; `rg -n "\{\.\.\.register\(" app` só sobra em campos que não são texto simples.
