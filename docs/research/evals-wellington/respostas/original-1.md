# Propostas

## C1 — Revisão de atribuição

A action precisa autorizar o papel no servidor antes de validar ou alterar dados. A proteção do proxy não substitui essa checagem. Também é necessário manter `redirect()` fora do `try`: no Next ele sinaliza a navegação lançando uma exceção interna, que o `catch` atual captura como se a atribuição tivesse falhado. Receba dados como `unknown`, valide-os e use os valores validados.

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

O trecho mantém navegação após sucesso, impede Lanternas de invocar a action diretamente e deixa a falha da operação como resultado de action. IDs e fontes: AUTH-05 (DOCS e FORMS p. 20), FORM-17 (FORMS p. 8, 13, 20 e 21), ROTA-20 (ROTAS p. 20; DOCS para chamar `redirect` fora do `try`). A referência FORM-17 recomenda `unknown` e usar `parsed.data`. Embora o fixture mostre `parsed.error.flatten()`, a regra FORM-18 descreve a API Zod 4 `z.flattenError(...)`; como o tipo de retorno fornecido já especifica o mapa de erros, a proposta conserva o formato solicitado pelo caso. Convém ajustar à API instalada do projeto antes de uma implementação real.

## C2 — Lista privada

A página deve verificar a sessão independentemente do proxy, resolver o filtro com a regra de papel no servidor e chamar a camada de serviço. No Next 16, `searchParams` é uma Promise.

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
  const { setor } = await searchParams // [ROTA-10]
  const setorId = setorParaFiltro(sessao, setor) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId }) // [API-05]

  if (itens.length === 0) {
    return <p>Nenhuma ocorrência encontrada.</p>
  }

  return (
    <ul>
      {itens.map((item) => (
        <li key={item.id}>{item.titulo}</li>
      ))}
    </ul>
  )
}
```

Para Lanterna, `setorParaFiltro` deve ignorar o setor da URL e restringir a consulta ao setor da sessão; para Guardião, pode respeitar o filtro ou listar todos. Estados a cobrir: carregamento (`loading.tsx` ou `Suspense`), lista com resultados, lista vazia, erro da consulta com opção de tentar novamente (`error.tsx`), não autenticado (redirecionar ao login por `verificarSessao`) e acesso negado quando aplicável (403/rota `/acesso-negado` via checagem apropriada). O filtro de setor por si só não torna a lista negada; o Lanterninha recebe apenas dados do seu setor. As referências indicam loading/error para páginas que aguardam dados (ROTA-21), resposta vazia de lista, e controle de acesso (AUTH-04/06/07). A fixture não fornece tipos dos itens nem estrutura de componentes de estado, então o snippet é deliberadamente mínimo.

## C3 — Justificativa acadêmica

Não é possível afirmar, com o material desta bancada, que o professor exige Axios, TanStack Query ou cookie HMAC. Nenhum PDF está disponível para conferir o que foi efetivamente apresentado. O que há aqui é a skill de padrões, que registra Axios como alternativa mostrada em APIS p. 8 e TanStack Query em APIS p. 15, mas registra decisões do grupo para não adotá-los: DEC-01 usa `fetch` na camada de serviço, DEC-02 dispensa TanStack Query porque não há busca cliente. A regra STACK-06 também limita dependências e pede uma decisão `[DECISÃO]` para bibliotecas adicionais. Essas citações são evidência do registro da skill, não verificação independente dos slides.

A própria skill identifica AUTH-03 (HMAC com `node:crypto`) como decisão do grupo combinada com recomendação da documentação, e diz expressamente que slides não cobrem cookies de sessão nem papéis. Portanto não se deve apresentar HMAC como exigência do professor com as evidências atuais. Decisão prática: não instalar Axios nem TanStack Query para esta aplicação; seguir a decisão registrada de `fetch` no servidor. Não instalar biblioteca de cookie para HMAC: o padrão registrado usa `node:crypto` já disponível. Se a banca exigir comprovação literal dos slides, pedir ao colega o PDF e verificar as páginas referenciadas antes de atribuir qualquer regra ao professor. Fontes consultadas na skill: STACK-06, DEC-01, DEC-02 e AUTH-03.

## C4 — Mudança pequena

Reduzir o tamanho base para celular e preservar o tamanho atual a partir de `sm`, em linha com mobile-first:

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground sm:text-5xl">Central de Comando</h1>
}
```

A verificação proporcional é conferir o título em viewport estreita (375 px) e em largura maior: o texto deve caber melhor no celular e manter o aspecto atual no breakpoint `sm`. CSS-03 registra a estratégia mobile-first. Como o pedido é uma proposta e o caso proíbe execução, não fiz verificação visual real nem executei testes.

## Arquivos de orientação consultados

- `casos.md`
- `original/padroes-wellington/SKILL.md`
- `original/padroes-wellington/references/autenticacao.md`
- `original/padroes-wellington/references/formularios-rhf-zod.md`
- `original/padroes-wellington/references/consumo-apis.md`
- `original/padroes-wellington/references/rotas-layouts.md`
- `original/padroes-wellington/references/stack-e-decisoes.md`
- `original/padroes-wellington/references/estilo-tailwind.md`
