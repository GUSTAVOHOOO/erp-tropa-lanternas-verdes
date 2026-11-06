# Propostas de revisão — quatro casos

## C1 — Revisão da action de atribuição

A action atual tem três problemas: não verifica o papel, aceita um tipo de entrada confiável em tempo de compilação e usa `redirect()` dentro do `try`. Como `redirect` lança uma exceção de controle de fluxo, o `catch` pode convertê-lo em erro genérico e impedir a navegação esperada. A menor correção é:

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

  revalidatePath('/painel/ocorrencias')
  redirect('/painel/ocorrencias') // [ROTA-20]
}
```

A autorização ocorre antes da validação e da gravação. A validação usa os dados normalizados de `parsed.data`; falha da gravação retorna `ResultadoAcao`, enquanto sucesso revalida e redireciona fora do `try`. Isso conserva a navegação após sucesso. Referências: AUTH-05, FORM-17, FORM-18 e ROTA-20; a regra da action com gravação e redirect também remete a API-14.

## C2 — Página privada de ocorrências

A página não deve buscar a API diretamente nem confiar no parâmetro de URL para limitar Lanterna. A sessão é verificada na página; `setorParaFiltro` aplica a regra por papel no servidor. Guardião pode usar o setor da URL e Lanterna fica limitado ao setor da sessão.

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'

export default async function Pagina({ searchParams }: {
  searchParams: Promise<{ setor?: string }>
}) {
  const sessao = await verificarSessao() // [AUTH-04]
  const filtros = await searchParams
  const setorId = setorParaFiltro(sessao, filtros.setor) // [AUTH-07]

  let itens
  try {
    itens = await listarOcorrencias({ setorId }) // [API-05]
  } catch {
    return (
      <main>
        <h1>Ocorrências</h1>
        <p role="alert">Não foi possível carregar as ocorrências. Tente novamente.</p>
      </main>
    )
  }

  return (
    <main>
      <h1>Ocorrências</h1>
      {itens.length === 0 ? (
        <p>Nenhuma ocorrência encontrada para este filtro.</p>
      ) : (
        <ul>
          {itens.map((item) => <li key={item.id}>{item.titulo}</li>)}
        </ul>
      )}
    </main>
  )
}
```

Estados a cobrir: carregamento enquanto a rota aguarda a busca (por `loading.tsx`/estado de carregamento apropriado à rota), erro de busca, lista vazia e lista com resultados. Acesso sem sessão é tratado por `verificarSessao()`; Lanterna com URL apontando a outro setor continua vendo apenas o setor próprio. A página não precisa expor escolha de setor para Lanterna. Referências: AUTH-04, AUTH-07, API-05 e regras de rota para loading/estados.

## C3 — O que se pode afirmar sobre a stack

Não é possível afirmar, com o material desta bancada, que o professor exige Axios, TanStack Query ou cookie HMAC. Nenhum PDF está disponível para conferir a fala atribuída aos slides; a referência da skill registra decisões e fontes de forma mista, e isso não equivale a confirmar uma exigência do professor.

O que a referência consultada permite sustentar: STACK-03 registra React Hook Form, resolvers e Zod; STACK-04 registra json-server como API didática; STACK-06 mantém uma lista de dependências e diz que outra dependência exige uma nova decisão `[DECISÃO]`. A lista explicitamente não inclui Axios nem TanStack Query. A autenticação documenta uma implementação de sessão assinada com HMAC como decisão de arquitetura do projeto, mas isso não comprova que o professor tenha exigido HMAC nos slides.

Orientação prática: não instalar as duas bibliotecas nem citar os slides como fonte sem consultar o PDF. Manter as decisões e dependências registradas; se surgir uma necessidade concreta para Axios ou TanStack Query, apresentar o motivo e registrar uma decisão do grupo antes de adicionar dependências. Tratar HMAC como escolha documentada do projeto até que uma fonte primária (o slide) possa ser verificada. Fontes: STACK-03, STACK-04, STACK-06 e AUTH-02; estas referências não permitem validar o conteúdo dos slides ausentes.

## C4 — Ajuste de leitura no celular

Aplicar tamanho menor como classe base e recuperar o tamanho atual em tela maior, sem mexer em dados, login ou arquitetura:

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground md:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

A verificação adequada é inspecionar o título em viewport de celular e desktop, confirmando leitura no primeiro e preservação do tamanho atual no segundo. Por ser proposta de código, não houve execução nem inspeção visual nesta bancada. Referência: CSS-03 (mobile-first); nenhuma mudança de estado ou comportamento exige ajuste adicional.

## Arquivos de orientação consultados

- `casos.md`
- `validada/padroes-wellington/SKILL.md`
- `validada/padroes-wellington/references/formularios-rhf-zod.md`
- `validada/padroes-wellington/references/autenticacao.md`
- `validada/padroes-wellington/references/consumo-apis.md`
- `validada/padroes-wellington/references/rotas-layouts.md`
- `validada/padroes-wellington/references/stack-e-decisoes.md`
- `validada/padroes-wellington/references/estilo-tailwind.md`
- `validada/padroes-wellington/references/componentes-props-state.md`

Sem execução de código, testes, lint, build ou inspeção do produto; as respostas são propostas baseadas nas fixtures e referências listadas.
