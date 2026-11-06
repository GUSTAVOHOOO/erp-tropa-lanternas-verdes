# React Hook Form: o básico

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
**Como verificar (PowerShell):** `rg -l -F 'useForm(' app components | ForEach-Object { rg --files-without-match -F 'zodResolver' -- $_ }` deve retornar vazio. Confira o resolver usado em cada chamada, não apenas o import.

### FORM-04: Sempre declarar defaultValues
**Fonte:** [SLIDE] FORMS p. 5 ("Nunca use value={undefined}. Sempre inicialize com '' ou use defaultValues"), p. 10 ("defaultValues não é opcional na prática"), p. 21
**Regra:** Todo `useForm` tem `defaultValues` com todos os campos (`''` para texto, valor inicial
para select, `false` para checkbox).
**✅ Certo:** `defaultValues: { email: '', senha: '' }`
**❌ Errado:** `useForm({ resolver })` sem `defaultValues`.
**Como verificar (PowerShell):** `rg -l -F 'useForm(' app components | ForEach-Object { rg --files-without-match -F 'defaultValues' -- $_ }` deve retornar vazio; confira os valores de cada formulário.

### FORM-05: mode 'onBlur' + reValidateMode 'onChange'
**Fonte:** [SLIDE] FORMS p. 12 ("configuração recomendada"; "não acuse erro enquanto a pessoa ainda está digitando pela primeira vez; depois que ela erra, corrija em tempo real"), p. 21
**Regra:** Todo `useForm` usa `mode: 'onBlur'` e `reValidateMode: 'onChange'`.
**✅ Certo:** ver FORM-01.
**❌ Errado:** `mode: 'onChange'` (acusa erro na primeira tecla) ou modo omitido.
**Como verificar (PowerShell):** `rg -l -F 'useForm(' app components | ForEach-Object { rg --files-without-match -F 'onBlur' -- $_ }` deve retornar vazio. Confirme que o resultado é a opção `mode` de cada formulário.

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
**Como verificar (PowerShell):** arquivos com `register(` e `useState` ao mesmo tempo merecem revisão manual: `rg -l -F 'register(' app components | ForEach-Object { rg -l -F 'useState' -- $_ }`. Estado não relacionado ao valor do campo pode ser legítimo.

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
