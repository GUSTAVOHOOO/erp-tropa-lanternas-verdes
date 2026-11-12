import 'server-only'
import { requisitarApi, type OpcoesApi } from '@/lib/api'
import { lerTokenObrigatorio } from '@/lib/dal'
import { paginaDe, type Pagina } from '@/lib/schemas/paginacao'
import { usuarioSchema, type Papel, type Usuario } from '@/lib/schemas/usuario'
import type { FiltroUsuarios } from '@/lib/schemas/gestao-usuario'

export type AlterarPapelEntrada = {
  papel: Papel
  setorId?: number
}

export type FiltroListaUsuarios = Partial<FiltroUsuarios>

const PARAMETROS_LISTA = new Set(['busca', 'pagina', 'limite', 'ordenar', 'ordem'])

async function opcoes(extra: Omit<OpcoesApi, 'cache' | 'token'> = {}): Promise<OpcoesApi> {
  return { ...extra, token: await lerTokenObrigatorio(), cache: { cache: 'no-store' } }
}

function caminho(id: string, sufixo = ''): string {
  return `/usuarios/${encodeURIComponent(id)}${sufixo}`
}

/** Lista de usuários com paginação, busca e ordenação. Exclusivo para Guardião. [API-19] */
export async function listarUsuarios(filtro: FiltroListaUsuarios = {}): Promise<Pagina<Usuario>> {
  const desconhecido = Object.keys(filtro).find((chave) => !PARAMETROS_LISTA.has(chave))
  if (desconhecido) throw new Error(`Parâmetro fora do contrato em listarUsuarios: ${desconhecido}`)
  return requisitarApi('/usuarios', paginaDe(usuarioSchema), await opcoes({ consulta: filtro }))
}

/** Altera papel de um usuário. Quando destino for guardião, setorId é omitido. */
export async function alterarPapel(id: string, entrada: AlterarPapelEntrada): Promise<Usuario> {
  const corpo = {
    papel: entrada.papel,
    ...(entrada.papel === 'lanterna' && entrada.setorId !== undefined && entrada.setorId !== null
      ? { setorId: entrada.setorId }
      : {}),
  }
  return requisitarApi(caminho(id, '/papel'), usuarioSchema, await opcoes({ metodo: 'PATCH', corpo }))
}

/** Vincula conta a uma Ficha de Lanterna pelo slug, ou desvincula passando null. */
export async function vincularLanterna(id: string, lanternaId: string | null): Promise<Usuario> {
  return requisitarApi(
    caminho(id, '/lanterna'),
    usuarioSchema,
    await opcoes({ metodo: 'PATCH', corpo: { lanternaId } }),
  )
}
