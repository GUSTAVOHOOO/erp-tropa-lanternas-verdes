# Propostas e revisão

## C1 — Atribuição

A action deve exigir o papel Guardião antes de validar os dados, tratar a entrada como `unknown`, validar e usar somente `parsed.data`. Em Zod 4, a extração de erros usa `z.flattenError`. A gravação fica no `try`; após sucesso, revalida-se a lista e chama-se `redirect` fora dele, pois `redirect` lança uma exceção interna que não deve ser engolida.

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

Assim, somente Guardião consegue atribuir, os valores enviados ao serviço são os validados, e uma gravação bem-sucedida mantém a navegação para a lista. IDs/fontes: AUTH-05 [DOCS]/[SLIDE], FORM-17 e FORM-18 [SLIDE], API-14 [SLIDE], ROTA-20 [SLIDE]/[DOCS].

## C2 — Lista privada

A página lê a sessão no servidor e calcula o filtro com `setorParaFiltro`; não usa o setor da URL diretamente. Esse helper aplica a regra de que Lanterna fica restrito ao setor da sessão, mesmo com query string manipulada. O Guardião pode receber o setor informado ou nenhum filtro. A busca passa pela camada de serviço.

```tsx
import { verificarSessao } from '@/lib/dal'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/sessao'

type Props = {
  searchParams: Promise<{ setor?: string }>
}

export default async function Pagina({ searchParams }: Props) {
  const sessao = await verificarSessao() // [AUTH-04]
  const { setor } = await searchParams
  const setorId = setorParaFiltro(sessao, setor)
  const itens = await listarOcorrencias({ setorId }) // [API-01]

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

Estados a cobrir: sessão ausente (redirecionamento para login pelo DAL), carregamento (arquivo `loading.tsx` da rota), lista vazia, lista com resultados e falha na consulta (boundary `error.tsx` ou estado de erro equivalente). Se o filtro recebido não corresponder a um setor permitido, deve-se cobrir o comportamento definido por `setorParaFiltro`; a restrição do Lanterna nunca pode depender só da interface. IDs/fontes: AUTH-04 [DOCS]/[SLIDE], AUTH-07 [DECISÃO]/[DOCS], API-01 [SLIDE], ROTA-02 [SLIDE].

## C3 — Justificativa acadêmica

Não dá para afirmar que o professor exige Axios, TanStack Query e cookie HMAC com o material disponível. Nenhum PDF foi fornecido, então não atribuo essa fala aos slides. A referência da skill registra que Axios foi ensinado como alternativa e que o grupo decidiu usar `fetch` nativo (DEC-01 [DECISÃO] + [SLIDE]); também registra TanStack Query como assunto ensinado para busca no cliente, mas a decisão local é não usar biblioteca de cache de cliente porque a busca é no servidor (DEC-02 [DECISÃO] + [SLIDE]). Portanto, a afirmação de que instalar ambas é uma exigência não é sustentada pelo registro consultado.

Sobre HMAC, a referência da skill registra cookie assinado com HMAC como padrão de autenticação do grupo (AUTH-03 [DECISÃO]/[DOCS]) e diz expressamente que os slides não cobrem cookies de sessão nem papéis. Isso não permite dizer que seja exigência do professor. Tampouco prova o que o PDF eventualmente diz: seria necessário consultar o material da disciplina ou confirmar diretamente com o professor.

**Decisão prática:** não instalar essas bibliotecas com base nessa alegação. Seguir a stack registrada: `fetch` nos serviços, sem TanStack Query e autenticação por cookie HMAC segundo a decisão do grupo. Se houver requisito avaliativo novo, confirmar a fonte primeiro e registrar a decisão de mudança antes de adicionar dependências. Referências: DEC-01, DEC-02, STACK-06 e AUTH-03.

## C4 — Título no celular

Reduzo apenas o tamanho base para celular e mantenho o tamanho atual em telas maiores, seguindo o padrão mobile-first e as classes existentes:

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground sm:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

Verificação proporcional: inspecionar visualmente em viewport móvel de 375 px e em desktop, conferindo que o título cabe e que no desktop conserva o tamanho visual atual. Como foi apenas proposta, não executei inspeção nem testes. ID/fonte: CSS-03 [SLIDE].

## Arquivos consultados

- `casos.md`
- `padroes-wellington/SKILL.md`
- `padroes-wellington/references/formularios-rhf-zod.md`
- `padroes-wellington/references/autenticacao.md`
- `padroes-wellington/references/consumo-apis.md`
- `padroes-wellington/references/rotas-layouts.md`
- `padroes-wellington/references/stack-e-decisoes.md`
- `padroes-wellington/references/estilo-tailwind.md`
