import 'server-only'
import { requisitarApi } from '@/lib/api'
import type { CadastroData } from '@/lib/schemas/cadastro'
import { usuarioSchema } from '@/lib/schemas/usuario'

/** Cadastra uma nova conta de Lanterna na Central de Oa. */
export async function cadastrarConta(dados: CadastroData): Promise<void> {
  await requisitarApi('/auth/cadastro', usuarioSchema, // valida o 201 sem devolver o usuário à tela
    {
    metodo: 'POST',
    corpo: dados,
    cache: { cache: 'no-store' },
  })
}
