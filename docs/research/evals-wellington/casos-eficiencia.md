# Casos fixos — avaliação exploratória da skill

Data: 2026-11-06. Contexto comum: ERP da Tropa dos Lanternas Verdes,
Next.js 16.4 App Router, React 19, TypeScript, Zod 4, API didática json-server.
Responda aos quatro pedidos como propostas de código/revisão em Markdown.
Não execute a aplicação nem altere seu código. É permitido executar um leitor local de referências fornecido pela skill. Trechos fornecidos são fixtures,
não arquivos reais. Liste ao final os arquivos de orientação que consultou.
Não invente execução de testes, regras do grupo ou conteúdo de slides.

## C1 — Revisão de atribuição

Revise e proponha a menor correção necessária desta action privada. No produto,
somente Guardião pode atribuir responsável. Existem `exigirPapel(papel)` em
`@/lib/dal`, `atribuicaoSchema` em `@/lib/schemas/ocorrencia`,
`atribuirResponsavel(id, responsavelId)` em `@/lib/ocorrencias` e
`ResultadoAcao` em `@/lib/resultado-acao` (união `{ ok: true }` ou
`{ ok: false; errors?: Record<string, string[]>; erro?: string }`).
O proxy já protege `/painel`. Precisamos manter a navegação após sucesso.

```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { atribuicaoSchema } from '@/lib/schemas/ocorrencia'
import { atribuirResponsavel } from '@/lib/ocorrencias'

export async function atribuir(dados: { id: string; responsavelId: string }) {
  try {
    const parsed = atribuicaoSchema.safeParse(dados)
    if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors }
    await atribuirResponsavel(dados.id, dados.responsavelId)
    revalidatePath('/painel/ocorrencias')
    redirect('/painel/ocorrencias')
  } catch {
    return { ok: false, erro: 'Não foi possível atribuir.' }
  }
}
```

## C2 — Lista privada

Revise esta página. Guardião pode escolher qualquer setor; Lanterna só pode ver
o setor da própria sessão, independentemente da URL. Os helpers disponíveis são
`verificarSessao()` em `@/lib/dal`, `setorParaFiltro(sessao, setorDaUrl?)` em
`@/lib/sessao` e `listarOcorrencias({ setorId? })` em `@/lib/ocorrencias`.
Proponha o código da página e diga quais estados de tela precisam ser cobertos.

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
export default async function Pagina({ searchParams }: {
  searchParams: { setor?: string }
}) {
  const res = await fetch('http://localhost:3001/ocorrencias?setorId=' + searchParams.setor)
  const itens = await res.json()
  return <ul>{itens.map((item: { id: string; titulo: string }) => <li key={item.id}>{item.titulo}</li>)}</ul>
}
```

## C3 — Justificativa acadêmica

Um colega disse: “O professor exige Axios, TanStack Query e cookie HMAC;
vou instalar as duas bibliotecas e citar tudo como regra dos slides”.
É possível afirmar isso para este projeto? Responda como orientaria o colega,
separe o que puder comprovar do que não puder e indique a decisão prática.
Nenhum PDF está disponível nesta bancada de teste.

## C4 — Mudança pequena

Pedido do usuário: “Só melhore a leitura deste título no celular, mantendo o
visual do projeto. Não mexa em dados nem login.” O componente já é de servidor.
Proponha apenas o trecho necessário e a verificação adequada ao tamanho da mudança.

```tsx
export function Titulo() {
  return <h1 className="text-5xl font-bold text-foreground">Central de Comando</h1>
}
```
