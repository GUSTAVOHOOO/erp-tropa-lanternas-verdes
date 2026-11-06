# Propostas de revisão — avaliação

## C1 — Atribuição de responsável

A action precisa exigir papel no servidor antes de validar ou gravar. O `redirect()` não deve ficar dentro do `try`, pois lança um erro interno que o `catch` atual engole, impedindo a navegação após sucesso. Mantenho a validação e o formato `ResultadoAcao`; o serviço recebe os dados já validados.

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

A autorização em `exigirPapel` é necessária mesmo com o proxy protegendo `/painel`: Server Actions são tratadas como endpoints públicos. O redirecionamento ocorre só após gravação e revalidação; erro da gravação retorna o resultado de falha. IDs/fontes: AUTH-05 [DOCS]/[SLIDE], FORM-17 [SLIDE]/[DECISÃO], ROTA-20 [SLIDE]/[DOCS].

## C2 — Lista privada

No Next 16, `searchParams` é assíncrono. A página deve verificar a sessão no servidor e passar o setor da URL pelo helper que força o setor da própria sessão para Lanternas. A consulta usa a camada de serviço, sem `fetch` direto nem concatenação de URL.

```tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'

export default async function Pagina({ searchParams }: {
  searchParams: Promise<{ setor?: string }>
}) {
  const sessao = await verificarSessao() // [AUTH-04]
  const params = await searchParams
  const setorId = setorParaFiltro(sessao, params.setor) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId })

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

Estados a cobrir: sem sessão (redirecionamento ao login); sessão Lanterna com setor fixado pelo servidor, mesmo se a URL pedir outro; Guardião com setor da URL ou sem filtro; resultado vazio; lista preenchida; carregamento enquanto a consulta aguarda; erro da API com opção de tentar novamente. A cópia da skill pede `loading.tsx` ou Suspense e `error.tsx` para rotas que aguardam dados (ROTA-21), além do estado vazio (API-09). IDs/fontes: AUTH-04 [DOCS]/[SLIDE], AUTH-07 [DECISÃO]/[DOCS], API-01/API-09 [DECISÃO]/[DOCS], ROTA-21 [SLIDE]/[DOCS].

## C3 — Justificativa acadêmica

Não dá para afirmar que o professor exige Axios, TanStack Query ou cookie HMAC com base nos slides nesta bancada: nenhum PDF está disponível, e a skill alerta que não se deve atribuir ao professor decisões locais. A referência da skill registra que o projeto escolheu `fetch` nos Server Components, não Axios (DEC-01); não usar TanStack Query nem SWR (DEC-02); e assinar o cookie com HMAC de `node:crypto`, sem biblioteca extra (AUTH-03, [DECISÃO]). A referência de autenticação declara expressamente que os slides não cobrem cookies de sessão nem papéis. Isso comprova o que a documentação interna da skill registra, não o conteúdo integral dos slides.

Decisão prática: não instalar Axios nem TanStack Query para este projeto; seguir as escolhas registradas e usar o serviço existente. Para HMAC, seguir a decisão local documentada, sem descrevê-la como exigência do professor. Se for necessário atribuir qualquer exigência aos slides, obter e conferir o PDF antes. IDs/fontes: DEC-01 e DEC-02 [DECISÃO]; AUTH-03 [DECISÃO]/[DOCS].

## C4 — Leitura do título no celular

Reduzir apenas o tamanho base para celular e manter o tamanho atual em telas médias e maiores. O componente continua sendo de servidor e o visual segue a escala já usada.

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground md:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

Verificação adequada: inspecionar o título em viewport de celular (375 px) e em desktop, conferindo leitura, quebra de linha e preservação da hierarquia visual. Para esta proposta não executei comandos nem testes. CSS-03 relaciona a fonte com responsividade mobile-first ([SLIDE]); a limitação é não ter feito inspeção visual real.

## Arquivos consultados

- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\casos.md`
- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\final\padroes-wellington\SKILL.md`
- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\final\padroes-wellington\references\autenticacao.md`
- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\final\padroes-wellington\references\formularios-rhf-zod.md`
- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\final\padroes-wellington\references\consumo-apis.md`
- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\final\padroes-wellington\references\rotas-layouts.md`
- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\final\padroes-wellington\references\stack-e-decisoes.md`
- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\final\padroes-wellington\references\estilo-tailwind.md`
- `C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\final\padroes-wellington\references\componentes-props-state.md`
