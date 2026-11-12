import type { Metadata } from 'next'
import Link from 'next/link'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { MolduraOa, SeloOa } from '@/components/oanet/PainelOa'
import { Paginacao } from '@/components/Paginacao'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { exigirPapel } from '@/lib/dal'
import { buscarLanterna, listarLanternas, listarTodosLanternas } from '@/lib/lanternas'
import { filtroLanternasSchema, rotuloStatusLanterna } from '@/lib/schemas/lanterna'
import { listarSetores } from '@/lib/setores'
import { FormLanterna } from '@/app/(painel)/painel/lanternas/_components/FormLanterna'
import { StatusLanterna } from '@/app/(painel)/painel/lanternas/_components/StatusLanterna'

export const metadata: Metadata = { title: 'Gestão de Lanternas | Central de Comando' }

type PainelLanternasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Página de gestão de Fichas de Lanterna restrita ao Guardião. [AUTH-05][AUTH-06][ROTA-10] */
export default async function PainelLanternasPage({ searchParams }: PainelLanternasPageProps) {
  await exigirPapel('guardiao') // [AUTH-05][AUTH-06]

  const parametros = await searchParams
  const filtro = filtroLanternasSchema.parse(parametros)
  const editarSlug = typeof parametros.editar === 'string' ? parametros.editar : undefined

  const [paginaLanternas, setores, todosLanternas, fichaParaEditar] = await Promise.all([
    listarLanternas({ ...filtro, limite: 20 }),
    listarSetores(),
    listarTodosLanternas(),
    editarSlug ? buscarLanterna(editarSlug) : Promise.resolve(null),
  ])

  const mapaSetores = Object.fromEntries(setores.map((s) => [s.id, s.nome]))

  const parametrosPaginacao: Record<string, string | undefined> = {
    busca: filtro.busca,
    status: filtro.status,
    setor: filtro.setor !== undefined ? String(filtro.setor) : undefined,
    ordenar: filtro.ordenar,
    ordem: filtro.ordem,
  }

  return (
    <div className="grid gap-8">
      <CabecalhoPagina
        titulo="Gestão de Lanternas"
        descricao="Cadastro, edição e controle de status das Fichas da Tropa"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <MolduraOa titulo="Fichas da Tropa" icone="pessoal">
            {paginaLanternas.itens.length === 0 ? (
              <EstadoVazio
                titulo="Nenhuma ficha encontrada"
                descricao="Nenhum Lanterna corresponde aos filtros aplicados."
              />
            ) : (
              <div className="grid gap-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codinome</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ingresso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginaLanternas.itens.map((lanterna) => (
                      <TableRow key={lanterna.id}>
                        <TableCell>
                          <Link
                            href={`/lanternas/${lanterna.id}`}
                            className="oa-record-link font-medium"
                          >
                            <strong>{lanterna.codinome}</strong>
                          </Link>
                          {lanterna.identidadeCivil && (
                            <small className="block text-xs text-(--oa-muted)">
                              {lanterna.identidadeCivil}
                            </small>
                          )}
                        </TableCell>
                        <TableCell>
                          {lanterna.setorId !== null ? (
                            <span>
                              Setor {lanterna.setorId}
                              {mapaSetores[lanterna.setorId] ? ` (${mapaSetores[lanterna.setorId]})` : ''}
                            </span>
                          ) : (
                            <span className="text-(--oa-muted)">Sem setor</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <SeloOa
                            tom={
                              lanterna.status === 'ativo'
                                ? 'verde'
                                : lanterna.status === 'em_missao'
                                  ? 'azul'
                                  : 'ambar'
                            }
                          >
                            {rotuloStatusLanterna[lanterna.status]}
                          </SeloOa>
                        </TableCell>
                        <TableCell>
                          {lanterna.anoIngresso ?? <span className="text-(--oa-muted)">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <Link
                              href={`/painel/lanternas?editar=${lanterna.id}`}
                              className="oa-button oa-button--linha text-xs"
                            >
                              <span className="oa-button-content">Editar</span>
                            </Link>
                            <StatusLanterna
                              slug={lanterna.id}
                              status={lanterna.status}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Paginacao
                  pagina={paginaLanternas.meta.pagina}
                  paginas={paginaLanternas.meta.paginas}
                  caminho="/painel/lanternas"
                  parametros={parametrosPaginacao}
                />
              </div>
            )}
          </MolduraOa>
        </div>

        <div className="lg:col-span-5">
          <MolduraOa
            titulo={fichaParaEditar ? `Editar Ficha: ${fichaParaEditar.codinome}` : 'Nova Ficha'}
            icone="mais"
          >
            <div className="oa-panel-body">
              <FormLanterna
                modo={fichaParaEditar ? 'edicao' : 'criacao'}
                ficha={fichaParaEditar}
                setores={setores}
                lanternas={todosLanternas}
              />
            </div>
          </MolduraOa>
        </div>
      </div>
    </div>
  )
}
