# Campos e mensagens acessíveis

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

### FORM-20: Atributos nativos como reforço, nunca como validação
**Fonte:** [SLIDE] FORMS p. 7 ("Use-a como reforço de UX e acessibilidade — nunca como a sua validação de verdade"; `type="email"`, `autoComplete`, `inputMode`; "Segurança — nenhuma")
**Regra:** Mantenha `type="email"`, `type="password"`, `autoComplete="email"`, `autoComplete="current-password"`,
`inputMode="numeric"`: eles dão teclado certo e preenchimento automático. A validação é do Zod.
**✅ Certo:** `<Input id="email" type="email" autoComplete="email" {...register('email')} />`
**❌ Errado:** confiar em `required`/`pattern` e não ter regra no schema.
**Como verificar:** campos de e-mail e senha do login têm `type` e `autoComplete`.

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
