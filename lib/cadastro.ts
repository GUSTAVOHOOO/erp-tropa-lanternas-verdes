import 'server-only'
import * as z from 'zod'
import { requisitarApi } from '@/lib/api'
import { setorPublicoSchema, type CadastroData, type Setor } from '@/lib/schemas/cadastro'
import { usuarioSchema } from '@/lib/schemas/usuario'

/** Lista os setores disponíveis para o cadastro público de novas contas. */
export async function listarSetoresParaCadastro(): Promise<Setor[]> {
  return requisitarApi('/setores', z.array(setorPublicoSchema), {
    cache: { revalidate: 60 },
  })
}

/** Cadastra uma nova conta de Lanterna na Central de Oa. */
export async function cadastrarConta(dados: CadastroData): Promise<void> {
  await requisitarApi('/auth/cadastro', usuarioSchema, // valida o 201 sem devolver o usuário à tela
    {
    metodo: 'POST',
    corpo: dados,
    cache: { cache: 'no-store' },
  })
}
