# Propostas de revisão — quatro casos

## C1 — Revisão de atribuição

A action é um endpoint público: deve exigir o papel Guardião antes de validar. A action recebe `unknown`, valida com o schema existente e usa `parsed.data`. O Zod 4 expõe os erros por `z.flattenError`. A escrita fica protegida pelo `try`; `revalidatePath` e `redirect` vêm depois, fora dele, porque `redirect()` lança uma exceção de controle de fluxo.

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exigirPapel } from '@/lib/dal'
import { atribuirResponsavel } from '@/lib/ocorrencias'
import { atribuicaoSchema } from '@/lib/schemas/ocorrencia'
import { z } from 'zod'
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

A navegação após sucesso é mantida. A autorização não depende do proxy. A proposta presume que `atribuicaoSchema` e `atribuirResponsavel` conservam as assinaturas descritas no caso.

## C2 — Lista privada

A página verifica a sessão no servidor e deriva o setor pelo helper existente. Assim, a URL pode escolher o setor para Guardião, enquanto Lanterna permanece limitado ao setor da sessão. No Next 16, `searchParams` é uma `Promise`; um parâmetro repetido é representado como array, então só um valor string não vazio é aceito como filtro.

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/sessao'
import { EstadoVazio } from '@/components/estado-vazio'
import { ListaOcorrencias } from '@/components/lista-ocorrencias'

 type Props = {
  searchParams: Promise<{ setor?: string | string[] }>
}

export default async function Pagina({ searchParams }: Props) {
  const sessao = await verificarSessao() // [AUTH-04]
  const params = await searchParams // [ROTA-10]
  const setorDaUrl = typeof params.setor === 'string' && params.setor.trim()
    ? params.setor
    : undefined
  const setorId = setorParaFiltro(sessao, setorDaUrl) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId })

  if (itens.length === 0) {
    return <EstadoVazio mensagem="Nenhuma ocorrência encontrada." /> // [API-09]
  }

  return <ListaOcorrencias itens={itens} />
}
```

Os imports de `EstadoVazio` e `ListaOcorrencias` ilustram componentes de apresentação; ajustar seus caminhos e props às assinaturas reais do projeto. A fixture não fornece essas assinaturas nem informa o texto/ação final do estado vazio.

Estados de tela a cobrir: carregamento com `loading.tsx` e skeleton; vazio com mensagem e ação útil (por exemplo, limpar o filtro); erro com `error.tsx`, mensagem humana e botão de tentar novamente; sucesso com a lista. A camada de serviço deve propagar erro para o boundary. Conforme API-11, a referência registra que no Next 16.4 o mecanismo de retry documentado é `retry()`; esta proposta não inventa o conteúdo do `error.tsx`.

## C3 — Justificativa acadêmica

Não dá para afirmar que o professor exige Axios, TanStack Query e cookie HMAC com o material desta bancada: o PDF não está disponível. A orientação ao colega seria distinguir a fonte de cada decisão e não atribuir uma escolha do grupo aos slides sem conferir a página correspondente.

O que a referência da skill registra:

- Axios: DEC-01 registra a decisão local de usar `fetch` nativo em `lib/`; a fonte é mista, decisão do grupo e preferência registrada nos slides. Ela descreve Axios como alternativa ensinada, não exigência.
- TanStack Query: DEC-02 registra a decisão local de não usar TanStack Query nem SWR porque o projeto não faz buscas no cliente. A própria regra menciona que os slides apresentam TanStack Query para busca no cliente, mas isso não prova exigência de instalação.
- Cookie HMAC: AUTH-03 é marcado como `[DECISÃO]` para assinar com `node:crypto` sem dependência extra, junto de `[DOCS]` sobre segredo de sessão. Portanto, HMAC aparece como decisão de arquitetura do grupo, não como exigência docente comprovada.
- STACK-06 mantém uma lista fechada de dependências e requer registrar uma nova decisão `[DECISÃO]` antes de adicionar outra biblioteca.

Decisão prática: não instalar Axios nem TanStack Query, e não adicionar bibliotecas para HMAC. Seguir `fetch` e `node:crypto` conforme as decisões registradas. Se o professor realmente pediu essas tecnologias, pedir a página/arquivo do material e então revisar a decisão do grupo com evidência. Não citar nenhum dos três como “regra dos slides” antes dessa conferência.

## C4 — Mudança pequena

Ajustar apenas o tamanho tipográfico base para celular e manter o tamanho atual em telas médias ou maiores:

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground md:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

Verificação adequada: inspecionar o título em uma viewport de 375 px e em desktop, confirmando legibilidade no celular e preservação do visual em telas maiores. Como é uma proposta, essa inspeção não foi executada; não há alteração de dados, autenticação ou comportamento do componente.

## Arquivos de orientação consultados

- `casos.md` da bancada isolada.
- `final/padroes-wellington/SKILL.md`.
- `final/padroes-wellington/references/formularios-rhf-zod.md` (FORM-17, FORM-18).
- `final/padroes-wellington/references/autenticacao.md` (AUTH-03, AUTH-04, AUTH-05, AUTH-07).
- `final/padroes-wellington/references/consumo-apis.md` (API-09, API-11, API-14).
- `final/padroes-wellington/references/rotas-layouts.md` (ROTA-10, ROTA-11, ROTA-20).
- `final/padroes-wellington/references/estilo-tailwind.md` (CSS-03).
- `final/padroes-wellington/references/stack-e-decisoes.md` (STACK-06, DEC-01, DEC-02).
- `final/padroes-wellington/scripts/consultar.mjs` (leitor local usado para extrair as regras).
