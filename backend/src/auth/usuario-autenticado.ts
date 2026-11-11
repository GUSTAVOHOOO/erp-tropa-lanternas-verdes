import type { PapelUsuario } from '../usuarios/usuario.entity.js'

export interface UsuarioAutenticado {
  id: string
  nome: string
  email: string
  papel: PapelUsuario
  lanternaId: string | null
  setorId: number | null
  criadoEm: Date
}

export interface RequisicaoAutenticada {
  headers: { authorization?: string }
  usuarioAtual?: UsuarioAutenticado
}
