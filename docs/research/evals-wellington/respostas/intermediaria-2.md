# Respostas — avaliação exploratória (revisada)

## C1 — Revisão de atribuição

A action precisa autenticar e autorizar antes de validar ou gravar: somente Guardião pode atribuir. O `redirect()` também não deve ficar dentro do `try`, pois Next.js usa uma exceção interna para interromper a execução; o `catch` atual pode engoli-la e devolver erro depois do sucesso. Use os dados validados (`parsed.data`) e mantenha a revalidação antes do redirecionamento para preservar o destino após sucesso.

```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
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

  revalidatePath('/painel/ocorrencias')
  redirect('/painel/ocorrencias')
}
```

O trecho usa `z.flattenError`, então inclua `import * as z from 'zod'`. O requisito informa o schema e seus campos, mas não a assinatura completa do helper de atribuição nem os erros que ele pode lançar; ajuste o tratamento de falhas se o serviço expuser um contrato específico. A action continua privada mesmo com o proxy protegendo `/painel`. Referências: [AUTH-05], [FORM-17], [FORM-18] ([SLIDE]/[DOCS] conforme os IDs indicados na referência; autorização da atribuição também decorre do requisito do produto).

## C2 — Lista privada

A página deve verificar a sessão no servidor e calcular o filtro com `setorParaFiltro`; assim, valor de URL não pode ampliar o acesso do Lanterna. O Guardião pode usar o setor informado ou ver todos. A busca passa pelo serviço existente, em vez de acessar a API diretamente na página.

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'

type Props = {
  searchParams: Promise<{ setor?: string }>
}

export default async function Pagina({ searchParams }: Props) {
  const sessao = await verificarSessao() // [AUTH-04]
  const params = await searchParams
  const setorId = setorParaFiltro(sessao, params.setor) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId }) // [API-05]

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

Estados a cobrir: carregamento (por exemplo, `loading.tsx`); erro de busca (tratado pelo boundary/`error.tsx` adequado, sem exibir stack trace); lista vazia; lista com resultados. Também devem funcionar os dois escopos: Guardião sem setor (todos) ou com setor escolhido, e Lanterna preso ao setor da sessão mesmo se alterar `?setor=`. A verificação de sessão na página continua necessária embora o proxy proteja a rota. Referências: [AUTH-04], [AUTH-07], [API-05], [ROTA-14]. A assinatura tipada como `Promise` segue a convenção atual de `searchParams`; a documentação local do Next não foi consultada nesta bancada restrita.

## C3 — Justificativa acadêmica

Não é possível afirmar que o professor exige Axios, TanStack Query e cookie HMAC com o material disponível: nenhum PDF foi fornecido, portanto não conferi os slides. O que posso comprovar é o que registra a referência da skill:

- Axios aparece como alternativa ensinada, mas a escolha do projeto é `fetch` nativo em `lib/` ([DECISÃO] + [SLIDE], DEC-01).
- Para TanStack Query, não encontrei nas referências consultadas evidência de exigência ou de adoção. Não devo atribuí-la aos slides sem o PDF.
- O cookie assinado com HMAC é uma decisão documentada do grupo, usando `node:crypto` sem biblioteca extra; a referência não a apresenta como exigência do professor ([DECISÃO], AUTH-03).

Decisão prática: não instalar Axios ou TanStack Query com base nessa afirmação. Seguir `fetch` na camada `lib/` e a autenticação HMAC já definida pelo projeto. Se a banca ou o colega precisar provar uma exigência dos slides, conferir o PDF original antes de citá-lo. As tags [SLIDE], [DOCS] e [DECISÃO] devem permanecer distintas; referência da skill não equivale a conferência direta do PDF.

## C4 — Mudança pequena

Aplique um tamanho base menor no celular e recupere o tamanho atual em telas maiores. O componente segue servidor e nenhuma lógica ou dado precisa mudar.

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground sm:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

Verificação adequada: inspecionar a leitura e o ajuste do título em viewport móvel de 375 px e em desktop. Nenhum teste ou comando foi executado; trata-se de uma proposta. Referência: [CSS-03] ([SLIDE], mobile-first).

## Arquivos consultados

- `casos.md`
- `revisada/padroes-wellington/SKILL.md`
- `revisada/padroes-wellington/references/autenticacao.md`
- `revisada/padroes-wellington/references/formularios-rhf-zod.md`
- `revisada/padroes-wellington/references/consumo-apis.md`
- `revisada/padroes-wellington/references/rotas-layouts.md`
- `revisada/padroes-wellington/references/stack-e-decisoes.md`
- `revisada/padroes-wellington/references/componentes-props-state.md`
- `revisada/padroes-wellington/references/estilo-tailwind.md`

Não foram lidos arquivos da aplicação, `AGENTS.md`, `CLAUDE.md`, rubricas ou PDFs; não houve execução de código ou testes.
