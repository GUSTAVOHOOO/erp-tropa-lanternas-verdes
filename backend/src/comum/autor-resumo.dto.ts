import type { Usuario } from '../usuarios/usuario.entity.js'

export class AutorResumoDto {
  id!: string
  nome!: string
  papel!: Usuario['papel']

  static de(usuario: Pick<Usuario, 'id' | 'nome' | 'papel'>): AutorResumoDto {
    const autor = new AutorResumoDto()
    Object.assign(autor, { id: usuario.id, nome: usuario.nome, papel: usuario.papel })
    return autor
  }
}
