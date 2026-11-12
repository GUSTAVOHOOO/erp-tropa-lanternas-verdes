import type { Metadata } from 'next'
import Link from 'next/link'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { BotaoOa, MolduraOa } from '@/components/oanet/PainelOa'
import { Paginacao } from '@/components/Paginacao'
import { exigirPapel } from '@/lib/dal'
import { listarUsuarios } from '@/lib/gestao-usuarios'
import { listarTodosLanternas } from '@/lib/lanternas'
import { filtroUsuariosSchema } from '@/lib/schemas/gestao-usuario'
import { listarSetores } from '@/lib/setores'
import { FormPapel } from '@/app/(painel)/painel/usuarios/_components/FormPapel'
import { FormVinculo } from '@/app/(painel)/painel/usuarios/_components/FormVinculo'

// Tela de gestão: Fichas e Setores recém-criados ou alterados precisam aparecer na hora. [API-14]
const SEM_CACHE = { cache: 'no-store' } as const

export const metadata: Metadata = { title: 'Usuários | Central de Comando' }

type UsuariosPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Página de gestão de contas e papéis restrita ao Guardião. [AUTH-06][ROTA-10][ROTA-21] */
export default async function UsuariosPage({ searchParams }: UsuariosPageProps) {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]

  const rawParams = await searchParams // [ROTA-10]
  const filtro = filtroUsuariosSchema.parse(rawParams) // [ROTA-11]
  const contaId = typeof rawParams?.conta === 'string' ? rawParams.conta : undefined

  const [resultado, setores, lanternas] = await Promise.all([
    listarUsuarios({
      ...filtro,
      limite: filtro.limite ?? 20,
    }),
    listarSetores(SEM_CACHE),
    listarTodosLanternas({}, SEM_CACHE),
  ])

  const nomeSetorMap = new Map(setores.map((s) => [s.id, s.nome]))
  const codinomeLanternaMap = new Map(lanternas.map((l) => [l.id, l.codinome]))

  const contaSelecionada = contaId ? resultado.itens.find((u) => u.id === contaId) : undefined

  const parametrosPaginacao: Record<string, string | undefined> = {
    busca: filtro.busca,
    ordenar: filtro.ordenar,
    ordem: filtro.ordem,
    conta: contaId,
  }

  return (
    <article className="oa-screen grid gap-6">
      <CabecalhoPagina
        titulo="Gestão de Usuários"
        descricao="Gerencie papéis e vínculos de contas da Tropa com Fichas de Lanterna."
      />

      {contaId && (
        <section aria-label="Gerenciamento da conta">
          {contaSelecionada ? (
            <MolduraOa titulo={`Gerenciar conta: ${contaSelecionada.nome}`} icone="hierarquia">
              <div className="oa-panel-body">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-4 text-base font-semibold">Papel da conta</h3>
                    <FormPapel key={contaSelecionada.id} usuario={contaSelecionada} setores={setores} />
                  </div>
                  <div>
                    <h3 className="mb-4 text-base font-semibold">Vínculo com Ficha de Lanterna</h3>
                    <FormVinculo usuario={contaSelecionada} lanternas={lanternas} />
                  </div>
                </div>
              </div>
            </MolduraOa>
          ) : (
            <div role="status" className="oa-panel p-4 text-center">
              <p className="text-(--oa-text)">Conta não encontrada nesta página</p>
            </div>
          )}
        </section>
      )}

      <MolduraOa titulo="Contas cadastradas" icone="hierarquia">
        <form method="GET" action="/painel/usuarios" className="oa-filter-bar mb-6 flex flex-wrap items-end gap-4">
          <label className="oa-field min-w-56 flex-1">
            <span className="text-sm font-medium">Buscar por nome ou e-mail</span>
            <input
              type="search"
              name="busca"
              defaultValue={filtro.busca ?? ''}
              placeholder="Digite o nome ou e-mail..."
              className="oa-input"
            />
          </label>
          <label className="oa-field">
            <span className="text-sm font-medium">Ordenar por</span>
            <select name="ordenar" defaultValue={filtro.ordenar ?? 'nome'} className="oa-select">
              <option value="nome">Nome</option>
              <option value="criadoEm">Data de criação</option>
            </select>
          </label>
          <label className="oa-field">
            <span className="text-sm font-medium">Ordem</span>
            <select name="ordem" defaultValue={filtro.ordem ?? 'asc'} className="oa-select">
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          </label>
          <div className="flex gap-2">
            <BotaoOa type="submit" tom="energia">Filtrar</BotaoOa>
            {(filtro.busca || filtro.ordenar || filtro.ordem || (filtro.pagina && filtro.pagina > 1)) && (
              <Link href="/painel/usuarios" className="oa-button oa-button--linha inline-flex">
                <span className="oa-button-content">Limpar</span>
              </Link>
            )}
          </div>
        </form>

        {resultado.itens.length === 0 ? (
          filtro.busca ? (
            <EstadoVazio
              titulo="Nenhuma conta encontrada"
              descricao="Nenhuma conta corresponde ao termo de busca informado."
              acao={{ href: '/painel/usuarios', rotulo: 'Limpar busca' }}
            />
          ) : (
            <EstadoVazio
              titulo="Nenhuma conta cadastrada"
              descricao="Não há contas registradas no sistema."
            />
          )
        ) : (
          <>
            <div className="oa-table-scroll">
              <table className="oa-table">
                <thead>
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">E-mail</th>
                    <th scope="col">Papel</th>
                    <th scope="col">Setor</th>
                    <th scope="col">Ficha vinculada</th>
                    <th scope="col">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.itens.map((usuario) => {
                    const papelTexto = usuario.papel === 'guardiao' ? 'Guardião' : 'Lanterna'
                    const setorTexto =
                      usuario.setorId !== null && usuario.setorId !== undefined
                        ? (nomeSetorMap.get(usuario.setorId) ?? `Setor ${usuario.setorId}`)
                        : 'Sem setor'
                    const fichaTexto = usuario.lanternaId
                      ? (codinomeLanternaMap.get(usuario.lanternaId) ?? usuario.lanternaId)
                      : 'Sem vínculo'

                    const queryGerenciar = new URLSearchParams()
                    if (filtro.busca) queryGerenciar.set('busca', filtro.busca)
                    if (filtro.ordenar) queryGerenciar.set('ordenar', filtro.ordenar)
                    if (filtro.ordem) queryGerenciar.set('ordem', filtro.ordem)
                    if (filtro.pagina && filtro.pagina > 1) {
                      queryGerenciar.set('pagina', String(filtro.pagina))
                    }
                    queryGerenciar.set('conta', usuario.id)

                    return (
                      <tr key={usuario.id}>
                        <td className="align-middle">
                          <strong>{usuario.nome}</strong>
                        </td>
                        <td className="align-middle">{usuario.email}</td>
                        <td className="align-middle">{papelTexto}</td>
                        <td className="align-middle">{setorTexto}</td>
                        <td className="align-middle">{fichaTexto}</td>
                        <td className="align-middle">
                          <Link
                            href={`/painel/usuarios?${queryGerenciar.toString()}`}
                            className="oa-button oa-button--linha inline-flex text-xs"
                          >
                            <span className="oa-button-content">Gerenciar</span>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Paginacao
              pagina={resultado.meta.pagina}
              paginas={resultado.meta.paginas}
              caminho="/painel/usuarios"
              parametros={parametrosPaginacao}
            />
          </>
        )}
      </MolduraOa>
    </article>
  )
}
