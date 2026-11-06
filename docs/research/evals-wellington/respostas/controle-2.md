# Respostas — avaliação exploratória

## C1 — Revisão de atribuição

A action precisa autenticar e autorizar o papel Guardião antes de executar a atribuição. Também deve usar os dados já validados (parsed.data) e não capturar o redirecionamento: redirect() interrompe a execução por exceção, então dentro do try atual o sucesso acaba virando uma resposta de erro.

~~~ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { exigirPapel } from '@/lib/dal'
import { atribuicaoSchema } from '@/lib/schemas/ocorrencia'
import { atribuirResponsavel } from '@/lib/ocorrencias'
import type { ResultadoAcao } from '@/lib/resultado-acao'

export async function atribuir(
  dados: { id: string; responsavelId: string },
): Promise<ResultadoAcao> {
  await exigirPapel('Guardião')

  const parsed = atribuicaoSchema.safeParse(dados)
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await atribuirResponsavel(parsed.data.id, parsed.data.responsavelId)
    revalidatePath('/painel/ocorrencias')
  } catch {
    return { ok: false, erro: 'Não foi possível atribuir.' }
  }

  redirect('/painel/ocorrencias')
}
~~~

O exemplo assume que exigirPapel recebe o nome do papel exatamente como definido no projeto. A verificação fica fora do try para que uma falha de autorização não seja convertida em erro genérico de operação. A validação ocorre antes da chamada de domínio. Em caso de falha de atribuição, a action devolve o erro; em caso de sucesso, revalida a lista e navega para ela.

## C2 — Lista privada

A página não deve consultar a API diretamente nem confiar no setor vindo da URL. Deve resolver a sessão no servidor e passar a sessão e o filtro solicitado ao helper que aplica a regra de acesso.

~~~tsx
import { verificarSessao } from '@/lib/dal'
import { setorParaFiltro } from '@/lib/sessao'
import { listarOcorrencias } from '@/lib/ocorrencias'

type Props = {
  searchParams: Promise<{ setor?: string }>
}

export default async function Pagina({ searchParams }: Props) {
  const sessao = await verificarSessao()
  const params = await searchParams
  const setorId = setorParaFiltro(sessao, params.setor)

  let itens
  try {
    itens = await listarOcorrencias({ setorId })
  } catch {
    return <p role="alert">Não foi possível carregar as ocorrências. Tente novamente.</p>
  }

  if (itens.length === 0) {
    return <p>Nenhuma ocorrência encontrada para este setor.</p>
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

O tipo de searchParams como promessa segue o contexto de App Router indicado; a página aguarda esse valor antes de usá-lo. O helper setorParaFiltro deve impor a regra: para Guardião, pode considerar o setor solicitado; para Lanterna, deve retornar somente o setor da sessão, mesmo que a URL peça outro. A página precisa cobrir:

- carregamento, se houver uma fronteira de carregamento da rota;
- falha ao listar, com mensagem de erro e caminho para tentar novamente;
- lista vazia;
- lista com resultados;
- sessão ausente ou papel sem acesso, tratada pela proteção de sessão/rota (verificarSessao ou camada de layout, conforme o contrato existente).

Para oferecer escolha de setor ao Guardião, a interface pode apresentar um filtro que altera o parâmetro da URL. A página ainda deve delegar a decisão de escopo ao helper, sem confiar no valor enviado pelo navegador.

## C3 — Justificativa acadêmica

Com o material disponível, não é possível afirmar que o professor exige Axios, TanStack Query ou cookie HMAC, nem que esses itens constam dos slides. O contexto fornecido identifica Next.js, React, TypeScript, Zod e uma API didática com json-server; ele não comprova requisitos acadêmicos adicionais. Como nenhum PDF foi disponibilizado, atribuir essas afirmações aos slides seria inventar evidência.

Eu orientaria o colega a conferir o enunciado ou os slides e pedir a referência exata antes de registrar esses itens como exigências. Decisão prática: não instalar Axios ou TanStack Query apenas com base nessa afirmação não verificada; seguir o padrão já adotado no projeto até confirmar o requisito. Também não introduzir cookie HMAC como regra acadêmica sem fonte. Se surgir uma exigência confirmada, avaliar cada dependência e a abordagem de sessão separadamente.

## C4 — Mudança pequena

Ajuste somente a escala tipográfica em telas estreitas, mantendo o tamanho atual a partir do breakpoint responsivo:

~~~tsx
export function Titulo() {
  return <h1 className="text-3xl font-bold text-foreground sm:text-5xl">Central de Comando</h1>
}
~~~

A verificação adequada é abrir a tela em uma largura de celular e confirmar que o título fica legível e não causa overflow; conferir também uma largura maior para garantir que o título preserva o tamanho e a aparência atuais. A mudança é localizada em classes de apresentação, então não exige mexer em dados ou login nem executar uma suíte de testes.

## Arquivos consultados

- C:\Users\WINDOW~1\AppData\Local\Temp\wellington-eval-20261106\casos.md
