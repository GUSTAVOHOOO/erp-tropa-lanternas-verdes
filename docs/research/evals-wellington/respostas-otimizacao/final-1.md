# Respostas — avaliação exploratória

## C1 — Revisão de atribuição

A action atual permite chamada sem autorização, confia no tipo TypeScript do argumento em tempo de execução, passa os valores originais em vez dos validados e engole o erro especial lançado por `redirect()` dentro do `try`. A correção abaixo autoriza Guardião primeiro, valida `unknown`, usa `parsed.data` e mantém a navegação após gravar. O `try/catch` cobre somente a gravação.

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

A validação de papel na própria action é necessária mesmo com o proxy protegendo `/painel`: a action é um endpoint público. `exigirPapel('guardiao')` também verifica a sessão. O redirect fica fora do `try` para não ser convertido em resultado de falha.

## C2 — Lista privada

A página deve verificar a sessão no servidor, aguardar `searchParams` (Promise no Next 16) e delegar a decisão do filtro ao helper. Assim, um Lanterna permanece preso ao setor da sessão mesmo se alterar `?setor=`; Guardião pode usar o filtro da URL.

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { EstadoVazio } from '@/components/estado-vazio'
import { ListaOcorrencias } from '@/components/lista-ocorrencias'

type Props = {
  searchParams: Promise<{ setor?: string }>
}

export default async function Pagina({ searchParams }: Props) {
  const sessao = await verificarSessao() // [AUTH-04]
  const { setor } = await searchParams // [ROTA-10]
  const setorId = setorParaFiltro(sessao, setor) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId }) // [API-01]

  if (itens.length === 0) {
    return <EstadoVazio mensagem="Nenhuma ocorrência encontrada." /> // [API-09]
  }

  return <ListaOcorrencias itens={itens} />
}
```

Os nomes/props dos componentes de vazio e lista são ilustrativos, pois suas assinaturas não foram fornecidas. A listagem precisa cobrir quatro estados: carregamento (por `loading.tsx`, com skeleton), vazio (mensagem e ação útil, como limpar o filtro), erro (por `error.tsx`, mensagem humana e tentativa novamente) e sucesso (lista). A chamada de serviço substitui `fetch` direto na página. O valor de setor da URL é uma string opcional do filtro; a regra de setor do Lanterna é imposta por `setorParaFiltro` no servidor.

## C3 — Justificativa acadêmica

Não dá para afirmar que “o professor exige Axios, TanStack Query e cookie HMAC” como um conjunto de exigências dos slides. Nesta bancada não há PDF para conferir os slides. A referência da skill registra que Axios foi ensinado como alternativa, mas a decisão do grupo é usar `fetch` nativo; registra TanStack Query como uma biblioteca apresentada para busca no cliente, enquanto a decisão local é não ter busca de cliente nem essa dependência. Também registra cookie HMAC como decisão do grupo, apoiada na documentação do Next sobre segredo de sessão, e não como exigência docente. Portanto, não instalar Axios ou TanStack Query com base nessa fala; seguir as escolhas locais documentadas. Sobre HMAC, implementar conforme AUTH-03 se a tarefa envolver sessão, mas descrever corretamente como decisão do grupo, não como regra comprovada do professor. Para atribuir uma exigência a slides, é preciso consultar o material do professor.

Referências consultadas: STACK-06 ([DECISÃO], lista fechada de dependências); DEC-01 ([DECISÃO] e [SLIDE], `fetch`/Axios); DEC-02 ([DECISÃO] e [SLIDE], TanStack Query); AUTH-03 ([DECISÃO] e [DOCS], cookie assinado). A skill não comprova que uma frase atribuída aos slides seja uma exigência: sem PDF, só é possível dizer “a referência da skill registra…”.

## C4 — Mudança pequena

Reduzir o tamanho no celular e recuperar o visual atual em telas maiores, sem alterar lógica ou dados:

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground md:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

Verificação proporcional: inspecionar a página em viewport de 375 px e em desktop, confirmando legibilidade, ausência de overflow e preservação do tamanho visual maior. Isto é uma proposta; não executei a aplicação nem fiz essa inspeção.

## Arquivos de orientação consultados

- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eficiencia-20261106\casos.md`
- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eficiencia-20261106\final\padroes-wellington\SKILL.md`
- `...\final\padroes-wellington\scripts\consultar.mjs` (leitor local de referências)
- `...\final\padroes-wellington\references\formularios-rhf-zod.md` (FORM-17, FORM-18)
- `...\final\padroes-wellington\references\autenticacao.md` (AUTH-03, AUTH-04, AUTH-05, AUTH-07)
- `...\final\padroes-wellington\references\consumo-apis.md` (API-01, API-09, API-14)
- `...\final\padroes-wellington\references\rotas-layouts.md` (ROTA-10, ROTA-20)
- `...\final\padroes-wellington\references\stack-e-decisoes.md` (STACK-06, DEC-01, DEC-02)
- `...\final\padroes-wellington\references\estilo-tailwind.md` (CSS-03)
