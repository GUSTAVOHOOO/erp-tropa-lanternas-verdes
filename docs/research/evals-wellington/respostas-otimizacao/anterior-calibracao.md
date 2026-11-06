# Propostas e revisão

## C1 — Revisão de atribuição

A action atual aceita uma forma de entrada fixada em TypeScript (que não protege a fronteira pública da Server Action), não confere sessão/papel e usa valores originais em vez do resultado validado. Além disso, `redirect()` lança uma exceção que seria capturada pelo `catch`, anulando a navegação de sucesso. A menor correção é receber `unknown`, exigir Guardião antes da validação, usar `parsed.data`, capturar somente a falha de gravação e deixar revalidação/redirecionamento após o `try`.

```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as z from 'zod'
import { exigirPapel } from '@/lib/dal'
import { atribuicaoSchema } from '@/lib/schemas/ocorrencia'
import { atribuirResponsavel } from '@/lib/ocorrencias'
import type { ResultadoAcao } from '@/lib/resultado-acao'

export async function atribuir(dados: unknown): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05]

  const parsed = atribuicaoSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]
  }

  try {
    await atribuirResponsavel(parsed.data.id, parsed.data.responsavelId)
  } catch {
    return { ok: false, erro: 'Não foi possível atribuir.' }
  }

  revalidatePath('/painel/ocorrencias') // [API-14]
  redirect('/painel/ocorrencias') // [ROTA-20]
}
```

A proteção do proxy não substitui a autorização nesta action: a própria referência orienta conferir sessão e papel em cada Server Action. A autorização no servidor atende ao requisito de que somente Guardião atribua. Não envolvi `redirect` no `try`, para que a exceção de navegação não vire uma resposta de erro.

## C2 — Lista privada

A consulta direta à API e o setor vindo da URL sem política de sessão deixam o Lanterna livre para tentar outro setor. A página deve validar sessão, aceitar `searchParams` assíncrono no Next 16 e delegar a decisão do filtro a `setorParaFiltro`, que mantém o Lanterna no setor da sessão e permite ao Guardião usar o filtro informado.

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ setor?: string }>
}) {
  const sessao = await verificarSessao() // [AUTH-04]
  const filtros = await searchParams
  const setorId = setorParaFiltro(sessao, filtros.setor) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId })

  return (
    <main>
      <h1>Ocorrências</h1>
      {itens.length === 0 ? (
        <p>Nenhuma ocorrência encontrada.</p>
      ) : (
        <ul>
          {itens.map((item) => <li key={item.id}>{item.titulo}</li>)}
        </ul>
      )}
    </main>
  )
}
```

A prop `Promise` e o `await` seguem ROTA-10. O `id` preserva chave única e estável da lista (COMP-13). Para o fluxo completo da rota com dados, precisam ser cobertos os quatro estados da referência API-09: carregamento, erro, vazio e dados. Carregamento e erro são tratados pelos arquivos convencionais da rota (`loading.tsx` e `error.tsx`, conforme ROTA-21/API-10/API-11); a página acima mostra os estados vazio e com dados. Em erro, a mensagem deve ser legível e oferecer nova tentativa, conforme API-11/API-13.

## C3 — Justificativa acadêmica

Não dá para afirmar, com o material disponível nesta bancada, que o professor exige Axios, TanStack Query ou cookie HMAC. Nenhum PDF foi fornecido; portanto, não consultei slides e não atribuo essas exigências ao professor.

O que a referência da skill registra é que Axios foi ensinado como alternativa, enquanto a decisão deste projeto é usar `fetch` nativo na camada `lib/` (DEC-01). Também registra que TanStack Query aparece nos slides como ferramenta de busca no cliente, mas a decisão do projeto é não usar TanStack Query nem SWR, pois a busca é feita no servidor (DEC-02/API-15). Para sessão, AUTH-03 registra HMAC com `node:crypto` como decisão do grupo, sem biblioteca adicional; a própria referência observa que a documentação oficial sugere alternativas como `jose`/`iron-session`. Isso não demonstra uma exigência dos slides.

Decisão prática: não instalar as duas bibliotecas nem apresentar o HMAC como ordem do professor. Seguir as decisões locais documentadas: `fetch` em `lib/`, sem TanStack Query/SWR e HMAC conforme AUTH-03. Se for necessário justificar o que o professor pediu, conferir os PDFs originais antes de fazer essa atribuição.

## C4 — Mudança pequena

Reduzo o tamanho do título apenas no breakpoint base de celular e restauro o tamanho atual em telas médias ou maiores. As outras classes e o componente de servidor permanecem como estão.

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground md:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

A verificação adequada é inspecionar visualmente em largura de celular (375 px) e em desktop, conferindo leitura e preservação do tamanho atual em telas maiores. É proposta de código; não executei aplicação, testes ou inspeção visual nesta bancada.

## Arquivos consultados

- `casos.md`
- `anterior/padroes-wellington/SKILL.md`
- `anterior/padroes-wellington/references/autenticacao.md`
- `anterior/padroes-wellington/references/formularios-rhf-zod.md`
- `anterior/padroes-wellington/references/consumo-apis.md`
- `anterior/padroes-wellington/references/rotas-layouts.md`
- `anterior/padroes-wellington/references/stack-e-decisoes.md`
- `anterior/padroes-wellington/references/estilo-tailwind.md`
- `anterior/padroes-wellington/references/componentes-props-state.md`
