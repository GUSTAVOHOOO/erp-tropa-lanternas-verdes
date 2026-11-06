# Respostas — avaliação exploratória

## C1 — Revisão de atribuição

A action precisa autorizar o papel Guardião antes de validar ou gravar, tratar a entrada como não confiável, usar somente os dados validados e não capturar o `redirect()` no `catch`. A menor correção coerente com as regras é:

```ts
'use server'
import * as z from 'zod'
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
  redirect('/painel/ocorrencias') // [API-14] [ROTA-20]
}
```

O snippet assume que `atribuicaoSchema` valida `id` e `responsavelId`, como sugere o objeto recebido pela action. Se o schema só validar o responsável, o `id` também deve ser validado na entrada antes de ser usado. O `redirect` após a revalidação mantém a navegação para a lista; se a gravação falhar, a action devolve o erro geral.

## C2 — Lista privada

A página deve buscar no servidor e determinar o setor efetivo usando a sessão. A URL pode fornecer filtro ao Guardião; o Lanterna fica limitado pelo helper ao setor da sessão. Em Next 16, `searchParams` é assíncrono (ROTA-10).

```tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Pagina({ searchParams }: Props) {
  const sessao = await verificarSessao() // [AUTH-04]
  const parametros = await searchParams // [ROTA-10]
  const setorDaUrl = typeof parametros.setor === 'string' ? parametros.setor : undefined
  const setorId = setorParaFiltro(sessao, setorDaUrl) // [AUTH-07]
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

Cobrir os estados de carregamento (por exemplo, `loading.tsx`), falha da busca (`error.tsx` com mensagem e opção de tentar novamente), lista vazia e lista com resultados. A ausência de sessão deve seguir o comportamento de `verificarSessao()`/proxy; URL com parâmetro repetido ou malformado não deve ampliar o acesso. O filtro de setor não substitui autorização no servidor.

## C3 — Justificativa acadêmica

Não dá para afirmar que o professor exige Axios, TanStack Query ou cookie HMAC com a evidência disponível: nenhum PDF está nesta bancada, então não conferi os slides. A própria skill separa `[SLIDE]`, `[DOCS]` e `[DECISÃO]`; não se deve apresentar uma decisão local como exigência docente.

O que a referência da skill registra:

- **Axios:** `[DECISÃO] DEC-01` adota `fetch` nativo na camada `lib/`; a regra também cita o slide de APIs p. 9 como recomendação de `fetch` nos Server Components e registra Axios como alternativa ensinada, não adotada.
- **TanStack Query:** `[DECISÃO] DEC-02` não usa TanStack Query nem SWR porque a busca do MVP ocorre no servidor. A referência cita o slide p. 15 para uso em busca no cliente, não como exigência geral.
- **HMAC:** `[DECISÃO] AUTH-03` registra cookie assinado com HMAC usando `node:crypto` para evitar dependência adicional; a fonte indicada é decisão do grupo e documentação oficial sobre segredo em variável de ambiente. Isso não prova exigência dos slides.

Decisão prática: não instalar as bibliotecas nem atribuir essas três escolhas ao professor. Manter a stack e as decisões documentadas para este projeto; se surgir requisito concreto para busca no cliente ou mudança de autenticação, propor e registrar uma nova decisão antes de alterar a stack. Para comprovar uma exigência acadêmica, consultar o PDF pertinente quando estiver disponível.

## C4 — Mudança pequena

Alterar somente as classes responsivas do título: tamanho menor no celular e o tamanho atual a partir do breakpoint `md`, preservando fonte, peso e cor.

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground md:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

Verificação proporcional: inspecionar o título em viewport de 375 px e em desktop, conferindo leitura, quebra de linha e preservação do visual. Como isto é uma proposta e não foi aplicada, não executei inspeção nem testes.

## Arquivos de orientação consultados

- `casos.md`
- `validada/padroes-wellington/SKILL.md`
- `validada/padroes-wellington/references/formularios-rhf-zod.md`
- `validada/padroes-wellington/references/autenticacao.md`
- `validada/padroes-wellington/references/consumo-apis.md`
- `validada/padroes-wellington/references/rotas-layouts.md`
- `validada/padroes-wellington/references/stack-e-decisoes.md`
- `validada/padroes-wellington/references/estilo-tailwind.md`

Não consultei a documentação local do Next nem o repositório da aplicação, conforme o escopo restrito desta bancada. Não executei código ou testes.
