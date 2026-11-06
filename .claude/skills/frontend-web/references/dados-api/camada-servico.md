# Camada de serviço, schemas e listas

### API-01: Camada de serviço: uma função por operação em lib/<recurso>.ts
**Fonte:** [SLIDE] APIS p. 14 ("Uma função por operação. Componentes chamam buscarProdutos(), nunca a URL direto"), p. 3 ("1 camada de serviço por recurso"), p. 23
**Regra:** `lib/ocorrencias.ts`, `lib/setores.ts`, `lib/usuarios.ts`. Cada operação é uma função
nomeada com verbo (JS-04): `listarOcorrencias`, `buscarOcorrencia`, `salvarOcorrencia`,
`atualizarOcorrencia`. Páginas e Server Actions chamam essas funções; nenhum outro lugar chama `fetch` nem conhece a URL da API (só o cliente `lib/api.ts`, API-17). Assim, mudar o contrato da API toca só `lib/` (DEC-04).
**✅ Certo:**
```tsx
import { listarOcorrencias } from '@/lib/ocorrencias'
const ocorrencias = await listarOcorrencias({ setorId, status })
```
**❌ Errado:** `await fetch('https://api.exemplo.com/ocorrencias')` dentro de `page.tsx`.
**Como verificar:** `rg -n "fetch\(" app components` deve retornar vazio; `rg -n "localhost" app components lib` deve retornar vazio (a URL vem de `API_URL`).

### API-04: Validar a resposta da API com Zod, depois de abrir o envelope
**Fonte:** [SLIDE] APIS p. 14 ("Não confie na API. Se o formato mudar, o erro aparece aqui", `z.array(produtoSchema).parse(await res.json())`), p. 21 ("Formato inválido... Zod acusa"), p. 23 + [DECISÃO] envelope de sucesso conforme a `backend-api`
**Regra:** O cliente (API-17) abre o envelope de sucesso e entrega `dados` a `schema.parse(...)` antes de sair da camada de serviço. O schema de resposta fica em `lib/schemas/<entidade>.ts` (FORM-02) e o tipo vem de `z.infer` (FORM-03). **Descreva cada campo com o tipo exato que a API devolve**: `z.number()` se é número, `z.string()` se é texto. Não use `z.coerce` para "consertar" resposta; ele é para entrada de formulário (FORM-13). Datas: `z.iso.datetime()`. Schema que falha é um bug de contrato, não uma tela quebrada: vira erro 500 para `error.tsx` e vai ao monitoramento (PROD-05).
**✅ Certo:**
```ts
// lib/schemas/ocorrencia.ts (campos de ilustração)
export const ocorrenciaSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  status: z.enum(STATUS),
  responsavelId: z.number().nullable(),
  criadaEm: z.iso.datetime(),
})
export type Ocorrencia = z.infer<typeof ocorrenciaSchema>
```
```ts
return z.array(ocorrenciaSchema).parse(dados) // [API-04] `dados` já saiu do envelope
```
**❌ Errado:** `return (await res.json()) as Ocorrencia[]` (o `as` não valida nada); `id: z.coerce.string()` "por garantia".
**Como verificar:** `rg -n "res\.json\(\)" lib` só em `lib/api.ts`; `rg -n " as \w+(\[\])?$" lib` vazio.

### API-19: Listas paginadas e ordenadas conforme o contrato da API
**Fonte:** [DECISÃO] aprovada + `backend-api` (`assets/nestjs-referencia/comum/paginacao.dto.ts`: `pagina`, `limite` com máximo, resposta `{ itens, meta: { total, pagina, limite, paginas } }`)
**Regra:** Toda listagem manda `pagina` e `limite` (nunca pede "tudo") e, quando a tela ordena, só o campo e a direção que o DTO de listagem da API aceita. O schema de lista é um só, em `lib/schemas/pagina.ts`, e a função de serviço devolve `{ itens, meta }`. O `limite` tem um teto no front igual ou menor ao da API. A interface de paginação, busca e filtros vive na URL (PROD-06). Confirme os nomes reais dos parâmetros no controller da API antes de codar.
**✅ Certo:**
```ts
export const paginaSchema = <T extends z.ZodType>(item: T) => z.object({
  itens: z.array(item),
  meta: z.object({ total: z.number(), pagina: z.number(), limite: z.number(), paginas: z.number() }),
})
const url = new URL('/ocorrencias', env.API_URL)
url.searchParams.set('pagina', String(pagina)); url.searchParams.set('limite', '20') // [API-19]
```
**❌ Errado:** listar sem `limite` e paginar em memória no componente; `limite=1000`.
**Como verificar:** `rg -n "listar\w+\(" lib` e confira que cada uma recebe `pagina`/`limite`; `rg -n "slice\(" app components` não pagina dado vindo da API.

### API-14: Escrita: método HTTP certo, JSON, revalidar depois
**Fonte:** [SLIDE] APIS p. 5 (métodos: POST cria, PATCH atualiza parte, DELETE remove; "201 Criado"), p. 16 (`method: 'POST'`, `Content-Type: application/json`, `JSON.stringify`; "Formulário → Action → API → revalidatePath()"); FORMS p. 20 (`revalidatePath('/usuarios')`) + [DECISÃO] verbos conforme a `backend-api`
**Regra:** Funções de escrita ficam em `lib/<recurso>.ts` e são chamadas só por Server Actions, sempre pelo cliente (API-17). Criar = `POST`, alterar parte = `PATCH`, remover = `DELETE`; o cliente já manda `Content-Type: application/json`. `204` não tem corpo: o cliente não chama `res.json()`. Depois de gravar, a action chama `revalidatePath` (ou `revalidateTag`) da listagem afetada e então `redirect` (ROTA-20). Botão desabilitado durante o envio (FORM-08) evita o duplo clique.
**✅ Certo:**
```ts
export async function salvarOcorrencia(dados: NovaOcorrenciaData) {
  return api.post('/ocorrencias', dados, ocorrenciaSchema) // [API-14] POST + JSON + parse (API-17)
}
```
**❌ Errado:** esquecer `revalidatePath` e a lista mostrar dado velho; `GET` que altera dado; `PUT` para mudar um campo só (use `PATCH`).
**Como verificar:** `rg -n "method: '(POST|PUT|PATCH|DELETE)'" app components` vazio (só `lib/api.ts`); `rg -n "revalidatePath|revalidateTag" app` aparece em toda action de escrita.
**Nota de versão:** no Next 16, `revalidateTag` exige segundo argumento (`revalidateTag('ocorrencias', 'max')`); `revalidatePath` não mudou.
