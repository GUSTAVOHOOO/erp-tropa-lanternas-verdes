import type { Metadata } from 'next'
import Link from 'next/link'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { MolduraOa } from '@/components/oanet/PainelOa'
import { exigirPapel } from '@/lib/dal'
import { listarSetores } from '@/lib/setores'
import { ExcluirSetor } from './_components/ExcluirSetor'
import { FormSetor } from './_components/FormSetor'
import { SEM_CACHE } from '@/lib/api'

export const metadata: Metadata = { title: 'Gestão de Setores | Central de Comando' }

type SetoresPageProps = {
  searchParams: Promise<{ editar?: string }>
}

/** Página de gestão de setores restrita ao Guardião. [AUTH-05][AUTH-06] */
export default async function SetoresPage({ searchParams }: SetoresPageProps) {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]
  const { editar } = await searchParams
  const setores = await listarSetores(SEM_CACHE)

  const idEditar = editar !== undefined && editar !== '' ? Number(editar) : undefined
  const setorEmEdicao =
    idEditar !== undefined && !Number.isNaN(idEditar)
      ? setores.find((s) => s.id === idEditar)
      : undefined

  return (
    <div className="oa-page-content grid gap-6">
      <CabecalhoPagina
        titulo="Gestão de Setores"
        descricao="Cadastro, edição e remoção de setores espaciais da Tropa dos Lanternas Verdes."
      />

      {setorEmEdicao ? (
        <MolduraOa
          titulo={`Editar setor ${setorEmEdicao.id}`}
          icone="painel"
          acao={
            <Link
              href="/painel/setores"
              className="oa-button oa-button--linha text-xs inline-flex"
            >
              <span className="oa-button-content">Cancelar edição</span>
            </Link>
          }
        >
          <div className="oa-panel-body">
            <FormSetor setor={setorEmEdicao} />
          </div>
        </MolduraOa>
      ) : (
        <MolduraOa titulo="Novo setor" icone="painel">
          <div className="oa-panel-body">
            <FormSetor />
          </div>
        </MolduraOa>
      )}

      <MolduraOa titulo="Setores cadastrados" icone="painel">
        {setores.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum setor cadastrado"
            descricao="Cadastre o primeiro setor no formulário acima."
          />
        ) : (
          <div className="oa-table-scroll">
            <table className="oa-table w-full">
              <thead>
                <tr>
                  <th scope="col" className="text-left">Número</th>
                  <th scope="col" className="text-left">Nome</th>
                  <th scope="col" className="text-left">Descrição</th>
                  <th scope="col" className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {setores.map((setor) => (
                  <tr key={setor.id}>
                    <td className="font-mono">{setor.id}</td>
                    <td className="font-medium">{setor.nome}</td>
                    <td className="text-sm text-(--oa-muted) max-w-md truncate">{setor.descricao}</td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Link
                          href={`/painel/setores?editar=${setor.id}`}
                          className="oa-button oa-button--linha text-xs inline-flex"
                        >
                          <span className="oa-button-content">Editar</span>
                        </Link>
                        <ExcluirSetor setorId={setor.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MolduraOa>
    </div>
  )
}
