# Validação no servidor

Padrão de retorno das Server Actions (DEC-05):

```ts
// lib/resultado-acao.ts
export type ResultadoAcao = {
  ok: boolean
  erro?: string                                  // erro geral (vai para errors.root)
  errors?: Record<string, string[] | undefined>  // erros por campo (z.flattenError ou API-18)
}
```

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
**Como verificar (PowerShell):** `rg -l 'use server' app | ForEach-Object { rg --files-without-match -F 'safeParse' -- $_ }` aponta arquivos para revisão. Confirme a diretiva e confira **cada action com dados**, não só a presença da palavra no arquivo; `sair`, sem dados, é exceção.

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
