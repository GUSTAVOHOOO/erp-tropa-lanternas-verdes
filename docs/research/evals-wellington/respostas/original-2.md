# Resposta 2

## C1 — Revisão de atribuição

A action precisa validar autorização dentro dela: o proxy não substitui a checagem da Server Action. Também não se deve capturar `redirect()`, pois ele navega por meio de uma exceção interna. A menor correção é exigir o papel antes de validar, usar os dados já validados, e deixar o redirecionamento fora do `try`.

```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { exigirPapel } from '@/lib/dal'
import { atribuicaoSchema } from '@/lib/schemas/ocorrencia'
import { atribuirResponsavel } from '@/lib/ocorrencias'
import type { ResultadoAcao } from '@/lib/resultado-acao'

export async function atribuir(dados: { id: string; responsavelId: string }): Promise<ResultadoAcao> {
  await exigirPapel('guardiao') // [AUTH-05]
  const parsed = atribuicaoSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await atribuirResponsavel(parsed.data.id, parsed.data.responsavelId)
  } catch {
    return { ok: false, erro: 'Não foi possível atribuir.' }
  }

  revalidatePath('/painel/ocorrencias')
  redirect('/painel/ocorrencias') // [ROTA-20]
}
```

A navegação após sucesso é mantida. `exigirPapel('guardiao')` também faz a checagem de sessão; o Lanternista autenticado sem esse papel é enviado à página de acesso negado.

## C2 — Lista privada

`searchParams` é assíncrono no Next 16. A página deve obter a sessão no servidor, derivar o filtro com `setorParaFiltro` e chamar a camada de serviço. Assim, um Lanternista não consegue trocar o setor pela URL. O helper fornece o escopo de autorização; `listarOcorrencias` faz a busca.

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'

type Props = { searchParams: Promise<{ setor?: string }> }

export default async function Pagina({ searchParams }: Props) {
  const sessao = await verificarSessao() // [AUTH-04]
  const { setor } = await searchParams // [ROTA-10]
  const setorId = setorParaFiltro(sessao, setor) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId }) // [API-05]

  if (itens.length === 0) {
    return <p>Nenhuma ocorrência encontrada.</p>
  }

  return (
    <ul>
      {itens.map((item) => <li key={item.id}>{item.titulo}</li>)}
    </ul>
  )
}
```

A implementação real também deve cobrir estes estados de tela: carregamento (por exemplo, `loading.tsx` ou Suspense), lista vazia, erro de carregamento com possibilidade de tentar novamente (`error.tsx`), e lista com resultados. A sessão inválida é redirecionada ao login por `verificarSessao`; os erros da camada de serviço devem chegar ao tratamento da rota, sem serem disfarçados como lista vazia. O filtro de setor inválido pode ser validado antes do serviço, conforme o formato aceito pelo schema da aplicação.

## C3 — Justificativa acadêmica

Não dá para confirmar que o professor exige Axios, TanStack Query ou cookie HMAC. Nesta bancada não há PDF para conferir os slides, então não devo transformar uma afirmação do colega em fato comprovado.

O que a orientação disponível permite afirmar:

- A skill registra Axios e TanStack Query como opções que aparecem nos slides de APIs (APIS p. 8, 9 e 15), mas declara a decisão do grupo por `fetch` em Server Components (`DEC-01` e `DEC-02`). Portanto, não há base nela para dizer que as duas bibliotecas são obrigatórias.
- A assinatura HMAC com `node:crypto` está registrada como decisão do grupo (`AUTH-03`), não como exigência dos slides. A própria orientação diz que slides não cobrem cookies de sessão nem papéis.
- A skill distingue fontes `[SLIDE]`, `[DOCS]` e `[DECISÃO]`; só uma regra marcada `[SLIDE]` pode ser atribuída ao professor. Sem o PDF, consigo relatar o que a orientação documenta, mas não auditar o conteúdo original dos slides.

Decisão prática: não instalar Axios nem TanStack Query para esta mudança; seguir `fetch` conforme a decisão documentada. Manter HMAC como escolha do projeto, justificando-a como decisão técnica do grupo, sem apresentá-la como regra do professor. Se for necessário citar uma exigência literal dos slides, conferir o PDF antes.

## C4 — Mudança pequena

Use um tamanho menor na classe base para celular e preserve o tamanho atual em telas maiores:

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground sm:text-5xl">Central de Comando</h1>
}
```

Isso segue o padrão mobile-first de Tailwind (`CSS-03`) e mantém o restante do visual. Para uma alteração só de classes, a verificação adequada é conferir visualmente o título em uma largura de celular e em uma tela maior, observando legibilidade e que o estilo maior continue aplicado no breakpoint. Não é necessário alegar execução de testes.

## Arquivos de orientação consultados

- `casos.md`
- `original/padroes-wellington/SKILL.md`
- `original/padroes-wellington/references/autenticacao.md`
- `original/padroes-wellington/references/formularios-rhf-zod.md`
- `original/padroes-wellington/references/consumo-apis.md`
- `original/padroes-wellington/references/stack-e-decisoes.md`
- `original/padroes-wellington/references/estilo-tailwind.md`
- `original/padroes-wellington/references/rotas-layouts.md`
