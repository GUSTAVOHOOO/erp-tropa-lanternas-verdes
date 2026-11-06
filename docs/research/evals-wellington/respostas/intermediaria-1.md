# Propostas para os quatro casos

## C1 — Revisão de atribuição

A action precisa autorizar o papel no servidor antes de validar ou gravar. O tipo público de entrada deve ser `unknown`, e somente `parsed.data` deve seguir ao serviço. Também não se deve capturar a exceção de `redirect`: ele interrompe o fluxo por exceção. A menor correção mantém o redirecionamento após a gravação e a revalidação.

```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { exigirPapel } from '@/lib/dal'
import { atribuicaoSchema } from '@/lib/schemas/ocorrencia'
import { atribuirResponsavel } from '@/lib/ocorrencias'
import type { ResultadoAcao } from '@/lib/resultado-acao'
import { z } from 'zod'

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

  revalidatePath('/painel/ocorrencias')
  redirect('/painel/ocorrencias')
}
```

`exigirPapel('guardiao')` também valida sessão; para Lanterna, o padrão do projeto envia a `/acesso-negado`. Caso a camada de serviço já converta falhas conhecidas em `ResultadoAcao`, esse tratamento pode ser adaptado a ela. Os IDs aplicáveis são [AUTH-05] e [AUTH-06] ([DECISÃO]/[DOCS]) e [FORM-17]/[FORM-18] ([SLIDE], com a forma de flatten do Zod 4). A navegação após sucesso é preservada pelo `redirect`, fora do `try/catch`.

## C2 — Lista privada

A página deve consultar sessão no servidor, aguardar `searchParams` (Next 16) e derivar o filtro com o helper de autorização antes de listar. Assim, a URL não consegue ampliar a visão do Lanterna.

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'

export default async function Pagina({ searchParams }: {
  searchParams: Promise<{ setor?: string }>
}) {
  const sessao = await verificarSessao() // [AUTH-04]
  const params = await searchParams // [ROTA-10]
  const setorId = setorParaFiltro(sessao, params.setor) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId }) // [API-05]

  if (itens.length === 0) {
    return <p>Nenhuma ocorrência encontrada para este filtro.</p> // [API-09]
  }

  return (
    <ul>
      {itens.map((item) => <li key={item.id}>{item.titulo}</li>)}
    </ul>
  )
}
```

A assinatura exata dos tipos retornados por `listarOcorrencias` deve ser confirmada no projeto real; o fixture só informa a função e seu argumento. Para uma entrega integrada, cobrir os quatro estados da tela: carregamento (por `loading.tsx` ou Suspense apropriado), vazio (com explicação e ação útil, por exemplo limpar filtro), erro (por `error.tsx` com tentar novamente) e sucesso (lista). A página de exemplo mostra vazio e sucesso; os demais estados são arquivos/limites de rota, não ramos de `fetch` dentro dela. Regras: [AUTH-04]/[AUTH-07] ([DOCS]/[DECISÃO]), [ROTA-10] ([SLIDE]/[DOCS]), [API-05]/[API-09] ([SLIDE]/[DECISÃO]).

## C3 — Justificativa acadêmica

Não dá para afirmar que o professor exige Axios, TanStack Query ou cookie HMAC com base nesta bancada: nenhum PDF foi disponibilizado. A referência da skill registra o fetch nativo como decisão do grupo e atribui ao slide apenas a preferência por `fetch` em Server Components ([DEC-01], [SLIDE] APIS p. 9); registra ausência de TanStack Query/SWR como decisão do grupo ([DEC-02], [DECISÃO]); e descreve cookie assinado com HMAC como padrão de autenticação do projeto ([AUTH-03], fontes conforme a própria referência). Isso não prova uma exigência dos slides.

Orientaria o colega a não instalar as bibliotecas nem apresentar essas afirmações como regra do professor sem conferir o material. A decisão prática, conforme os padrões registrados, é manter `fetch` em `lib/` para as buscas server-side, não adicionar TanStack Query e seguir o mecanismo de sessão já definido. Se a banca pedir comprovação, consultar os PDFs originais e distinguir explicitamente [SLIDE], [DOCS] e [DECISÃO].

## C4 — Mudança pequena

Ajustar somente a escala responsiva do título: base menor para celular e o tamanho atual a partir do breakpoint `md`.

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground md:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

A regra aplicada é mobile-first ([CSS-03], [SLIDE]). Como a alteração é só visual, a verificação adequada é inspecionar o título em viewport móvel de 375 px e em desktop, conferindo leitura, quebra de linha e preservação do tamanho visual maior. Não houve execução nem inspeção nesta proposta.

## Arquivos de orientação consultados

- `casos.md`
- `revisada/padroes-wellington/SKILL.md`
- `revisada/padroes-wellington/references/formularios-rhf-zod.md`
- `revisada/padroes-wellington/references/autenticacao.md`
- `revisada/padroes-wellington/references/consumo-apis.md`
- `revisada/padroes-wellington/references/rotas-layouts.md`
- `revisada/padroes-wellington/references/stack-e-decisoes.md`
- `revisada/padroes-wellington/references/componentes-props-state.md`
- `revisada/padroes-wellington/references/estilo-tailwind.md`
