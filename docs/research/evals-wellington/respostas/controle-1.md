# Propostas de revisão

## C1 — Revisão de atribuição

A action precisa exigir o papel de Guardião antes de alterar dados. Também não deve capturar o `redirect`: no Next.js ele interrompe a execução por meio de uma exceção especial, que o `catch` atual converteria em erro e impediria a navegação. Faça a revalidação e o redirecionamento depois do `try`.

```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { exigirPapel } from '@/lib/dal'
import { atribuicaoSchema } from '@/lib/schemas/ocorrencia'
import { atribuirResponsavel } from '@/lib/ocorrencias'
import type { ResultadoAcao } from '@/lib/resultado-acao'

export async function atribuir(dados: {
  id: string
  responsavelId: string
}): Promise<ResultadoAcao> {
  await exigirPapel('Guardião')

  const parsed = atribuicaoSchema.safeParse(dados)
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors }
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

A checagem de papel é feita no servidor, mesmo com o proxy protegendo `/painel`. A validação usa os dados já parseados. Falhas de autorização ficam a cargo do helper de autorização; só falhas da operação de atribuição são convertidas no erro de domínio indicado.

## C2 — Lista privada

A página deve obter a sessão no servidor e deixar `setorParaFiltro` decidir o filtro efetivo. Assim, para Lanternas, a URL não pode ampliar o acesso além do setor da sessão; Guardiões podem selecionar setor. Em Next.js 16.4, `searchParams` é assíncrono.

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'

export default async function Pagina({ searchParams }: {
  searchParams: Promise<{ setor?: string }>
}) {
  const [sessao, params] = await Promise.all([
    verificarSessao(),
    searchParams,
  ])
  const setorId = setorParaFiltro(sessao, params.setor)
  const itens = await listarOcorrencias({ setorId })

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

Estados de tela a cobrir: carregamento (por exemplo, com `loading.tsx` se a busca puder demorar), lista com resultados, resultado vazio, erro ao carregar e sessão ausente/inválida ou sem autorização. O redirecionamento ou resposta de acesso negado depende do comportamento definido por `verificarSessao`; não se deve mostrar a lista antes dessa verificação.

## C3 — Justificativa acadêmica

Com as informações desta bancada, não é possível afirmar que o professor exige Axios, TanStack Query ou cookie HMAC, nem atribuir essas exigências aos slides: nenhum PDF está disponível para conferência. O contexto fornecido identifica Next.js 16.4, React 19, TypeScript, Zod 4 e uma API didática com json-server, mas não comprova exigência de bibliotecas específicas nem de um formato de cookie.

Eu orientaria o colega a não instalar as bibliotecas nem registrar essas tecnologias como regra acadêmica até conferir o material da disciplina ou perguntar ao professor. A decisão prática agora é seguir o que o projeto e os requisitos confirmados já usam; quando os slides estiverem disponíveis, verificar o trecho relevante e então decidir se alguma dependência é necessária.

## C4 — Mudança pequena

Aplicar uma escala tipográfica menor em telas estreitas e preservar o tamanho atual a partir do breakpoint `sm`:

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground sm:text-5xl">Central de Comando</h1>
}
```

Verificação adequada: conferir visualmente o título em uma largura de celular e em uma largura de desktop, observando legibilidade, quebra de linha e preservação do estilo existente. Para essa alteração isolada de classes, uma checagem visual é suficiente; não há motivo para afirmar execução de testes.

## Arquivos consultados

- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\casos.md`
