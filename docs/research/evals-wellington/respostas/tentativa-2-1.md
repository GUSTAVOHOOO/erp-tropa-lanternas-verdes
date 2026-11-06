# Propostas para os quatro casos

## C1 — Revisão da action de atribuição

A action precisa autorizar pelo papel no servidor, validar antes de gravar e deixar o redirect() fora do try. Como redirect() lança um erro de controle de fluxo, o catch atual o captura e transforma o sucesso em falha, impedindo a navegação. O proxy não substitui a checagem da Server Action. [AUTH-05] [ROTA-20]

~~~ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
  } catch (erro) {
    console.error(erro)
    return { ok: false, erro: 'Não foi possível atribuir.' }
  }

  revalidatePath('/painel/ocorrencias')
  redirect('/painel/ocorrencias') // [ROTA-20]
}
~~~

Usei o resultado validado (parsed.data) para a gravação. A autorização precede a validação e a mutação; assim, apenas Guardião pode atribuir mesmo que a action seja chamada diretamente.

## C2 — Página privada de ocorrências

No App Router descrito pela referência, searchParams é uma Promise; a página deve aguardá-la. A sessão define o filtro efetivo no servidor: para Lanterna, setorParaFiltro ignora o setor informado na URL e fixa o setor da própria sessão; Guardião pode usar o setor da URL ou consultar todos. [ROTA-10] [AUTH-04] [AUTH-07]

~~~tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/sessao'

type Props = {
  searchParams: Promise<{ setor?: string }>
}

export default async function Pagina({ searchParams }: Props) {
  const sessao = await verificarSessao() // [AUTH-04]
  const parametros = await searchParams
  const setorId = setorParaFiltro(sessao, parametros.setor) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId }) // [API-05]

  if (itens.length === 0) {
    return <p>Nenhuma ocorrência encontrada para este filtro.</p> // [API-09]
  }

  return (
    <ul>
      {itens.map((item) => (
        <li key={item.id}>{item.titulo}</li>
      ))}
    </ul>
  )
}
~~~

Estados a cobrir na rota de listagem: carregamento (por loading.tsx), erro de busca (por error.tsx com mensagem humana e tentativa de novo), vazio (mensagem clara e, quando houver filtro, uma ação para limpá-lo) e sucesso (lista). A referência recomenda os quatro estados para telas com dados. [API-09] [API-10] [API-11]

## C3 — O que se pode afirmar sobre a stack

Com o PDF indisponível, não dá para confirmar que o professor exigiu Axios, TanStack Query ou cookie HMAC, nem atribuir essas escolhas aos slides. A referência da skill registra uma stack e decisões do grupo, não uma comprovação do conteúdo dos slides.

O que a referência registra é: fetch nos Server Components em vez de Axios [DEC-01]; ausência de TanStack Query e SWR [DEC-02]; e cookie HMAC implementado sem biblioteca extra como uma decisão do grupo, usando node:crypto [AUTH-03]. Esses registros permitem dizer qual é o padrão documentado do projeto, mas não provar o que o professor exige.

Orientação prática: não instalar Axios ou TanStack Query com base nessa alegação. Siga as decisões registradas para esta proposta e, se for necessário confirmar uma exigência acadêmica, peça ao colega a página ou o PDF dos slides antes de atribuí-la ao professor. Não altere a decisão de autenticação nem introduza bibliotecas sem motivo confirmado. [STACK-06]

## C4 — Leitura do título no celular

Aplique um tamanho menor como classe base para telas pequenas e preserve o tamanho atual a partir do breakpoint sm. É uma alteração apenas de apresentação. [CSS-03]

~~~tsx
export function Titulo() {
  return (
    <h1 className="text-3xl leading-tight font-bold text-foreground sm:text-5xl">
      Central de Comando
    </h1>
  )
}
~~~

Verificação adequada: conferir visualmente em viewport móvel de 375 px e em desktop para garantir leitura, quebra de linha e preservação do tamanho maior. Não há execução de testes nesta proposta.

## Arquivos de orientação consultados

- final/padroes-wellington/SKILL.md
- final/padroes-wellington/references/autenticacao.md
- final/padroes-wellington/references/formularios-rhf-zod.md
- final/padroes-wellington/references/consumo-apis.md
- final/padroes-wellington/references/rotas-layouts.md
- final/padroes-wellington/references/stack-e-decisoes.md
- final/padroes-wellington/references/componentes-props-state.md
- final/padroes-wellington/references/estilo-tailwind.md

As referências foram consultadas nesta cópia de teste. Nenhum código foi executado, nenhum teste foi rodado e não houve inspeção visual real; as verificações acima são propostas.
