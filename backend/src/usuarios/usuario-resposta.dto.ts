import type { Usuario } from './usuario.entity.js'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'

export class UsuarioRespostaDto {
  id!: string
  nome!: string
  email!: string
  papel!: Usuario['papel']
  lanternaId!: string | null
  setorId!: number | null
  criadoEm!: string

  static de(usuario: Usuario | UsuarioAutenticado): UsuarioRespostaDto {
    const resposta = new UsuarioRespostaDto()
    resposta.id = usuario.id
    resposta.nome = usuario.nome
    resposta.email = usuario.email
    resposta.papel = usuario.papel
    resposta.lanternaId = usuario.lanternaId ?? null
    resposta.setorId = usuario.setorId ?? null
    resposta.criadoEm = usuario.criadoEm.toISOString()
    return resposta
  }
}
