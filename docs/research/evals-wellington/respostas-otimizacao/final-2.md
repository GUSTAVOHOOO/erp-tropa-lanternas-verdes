# Respostas — avaliação exploratória

## C1 — Revisão de atribuição

A action precisa exigir papel de Guardião mesmo com o proxy, aceitar `unknown`, validar antes de usar os dados e não engolir o `redirect` (que lança internamente). A menor correção fica assim:

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

A autorização precede a validação; os argumentos da gravação vêm de `parsed.data`. A revalidação e o redirecionamento ficam após o `try`, para a exceção de navegação não ser convertida em erro da action.

## C2 — Lista privada

```tsx
// app/(painel)/painel/ocorrencias/page.tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { EstadoVazio } from '@/components/EstadoVazio'
import { ListaOcorrencias } from '@/components/ListaOcorrencias'

type Props = {
  searchParams: Promise<{ setor?: string }>
}

export default async function Pagina({ searchParams }: Props) {
  const sessao = await verificarSessao() // [AUTH-04]
  const { setor } = await searchParams // [ROTA-10]
  const setorId = setorParaFiltro(sessao, setor) // [AUTH-07]
  const itens = await listarOcorrencias({ setorId })

  if (itens.length === 0) {
    return <EstadoVazio mensagem="Nenhuma ocorrência encontrada." /> // [API-09]
  }

  return <ListaOcorrencias itens={itens} />
}
```

`setorParaFiltro` aplica a regra no servidor: para Guardião usa o setor informado (ou todos, se ausente); para Lanterna ignora o filtro da URL e fixa o setor da sessão. Não se deve buscar a lista ampla e filtrá-la no cliente. Os imports de `EstadoVazio` e `ListaOcorrencias` representam componentes do projeto; ajustar os caminhos/props às assinaturas existentes.

A listagem deve cobrir os quatro estados de tela: carregamento (skeleton em `loading.tsx`), vazio (mensagem e ação útil para o contexto, como limpar filtros), erro (`error.tsx`, mensagem humana e tentar novamente) e sucesso (lista). A página acima mostra os ramos de vazio e sucesso; os dois estados de rota devem ser implementados nos arquivos correspondentes. Se houver validação/normalização adicional de filtros, ela deve ocorrer antes de passá-los ao serviço, conforme ROTA-11; a assinatura disponível não informa um schema de setor.

## C3 — Justificativa acadêmica

Eu orientaria o colega a não instalar as bibliotecas nem atribuir essa exigência ao professor sem uma fonte que a confirme. Nesta bancada não há PDF, então só posso dizer que **a referência da skill registra**:

- Axios foi ensinado como alternativa; a decisão local é usar `fetch` nativo em `lib/` (DEC-01). A referência atribui a preferência também ao slide APIS p. 9, mas isso não prova que o professor exija Axios; indica o contrário.
- TanStack Query aparece nos slides como opção para busca no cliente, mas a decisão local registra que o projeto não faz busca no cliente e não usa essa biblioteca (DEC-02).
- A referência de cookie HMAC (AUTH-03) marca HMAC com `node:crypto` como **decisão do grupo** para evitar dependência extra, apoiada em documentação do Next sobre segredo. Ela não registra isso como exigência dos slides.
- A lista local de dependências fechada (STACK-06) também classifica a simplicidade como decisão do grupo e exige uma nova decisão registrada para dependências fora da lista.

Decisão prática: seguir `fetch` e o mecanismo de sessão já definido na skill; não adicionar Axios nem TanStack Query para cumprir uma suposta regra docente. Se o professor realmente pediu algo diferente, solicitar/consultar o slide ou enunciado e, só então, registrar a mudança como decisão do projeto quando necessário.

## C4 — Mudança pequena

Manter o tamanho de desktop e reduzir a escala base para celular:

```tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground md:text-5xl">Central de Comando</h1> // [CSS-03]
}
```

Verificação adequada: inspecionar visualmente o título em largura móvel de 375 px e em desktop, confirmando que cabe e continua legível e que o tamanho de desktop permanece igual. Como esta é uma proposta, nenhuma inspeção foi executada.

## Arquivos de orientação consultados

- `casos.md` (contexto e fixtures fornecidos).
- `final/padroes-wellington/SKILL.md`.
- `final/padroes-wellington/scripts/consultar.mjs` (leitor local indicado pela skill).
- `final/padroes-wellington/references/formularios-rhf-zod.md` (FORM-17, FORM-18).
- `final/padroes-wellington/references/autenticacao.md` (AUTH-03, AUTH-04, AUTH-05, AUTH-07).
- `final/padroes-wellington/references/consumo-apis.md` (API-09, API-14).
- `final/padroes-wellington/references/rotas-layouts.md` (ROTA-10, ROTA-11, ROTA-20).
- `final/padroes-wellington/references/estilo-tailwind.md` (CSS-03).
- `final/padroes-wellington/references/stack-e-decisoes.md` (STACK-06, DEC-01, DEC-02).
