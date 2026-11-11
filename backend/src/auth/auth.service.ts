import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { randomUUID } from 'node:crypto'
import { QueryFailedError } from 'typeorm'
import { ErroDominio } from '../comum/erro-dominio.js'
import { SetoresRepository } from '../setores/setores.repository.js'
import { UsuarioRespostaDto } from '../usuarios/usuario-resposta.dto.js'
import { UsuariosRepository } from '../usuarios/usuarios.repository.js'
import type { Usuario } from '../usuarios/usuario.entity.js'
import type { CadastroDto } from './dto/cadastro.dto.js'
import type { LoginDto } from './dto/login.dto.js'
import type { UsuarioAutenticado } from './usuario-autenticado.js'
import { SenhaService } from './senha.service.js'

const JWT_EXPIRA_EM_SEGUNDOS = 8 * 60 * 60

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly setores: SetoresRepository,
    private readonly jwt: JwtService,
    private readonly senhas: SenhaService,
  ) {}

  async cadastrar(dados: CadastroDto): Promise<UsuarioRespostaDto> {
    const setor = await this.setores.buscarPorId(dados.setorId)
    if (!setor) throw new ErroDominio(404, 'NAO_ENCONTRADO', 'Setor não encontrado')

    const email = dados.email.trim().toLocaleLowerCase('und')
    if (await this.usuarios.buscarPorEmail(email)) throw this.emailDuplicado()

    const usuario: Partial<Usuario> = {
      id: randomUUID(),
      nome: dados.nome.trim(),
      email,
      senhaHash: await this.senhas.hash(dados.senha),
      papel: 'lanterna',
      setorId: setor.id,
      lanternaId: null,
    }

    try {
      return UsuarioRespostaDto.de(await this.usuarios.salvar(usuario))
    } catch (erro) {
      if (this.eEmailDuplicado(erro)) throw this.emailDuplicado()
      throw erro
    }
  }

  async entrar(dados: LoginDto): Promise<{
    token: string
    expiresIn: number
    usuario: UsuarioRespostaDto
  }> {
    const email = dados.email.trim().toLocaleLowerCase('und')
    const usuario = await this.usuarios.buscarPorEmailComHash(email)
    const senhaValida = usuario
      ? await this.senhas.comparar(dados.senha, usuario.senhaHash)
      : await this.senhas.compararComIsca(dados.senha)
    if (!usuario || !senhaValida) {
      throw new ErroDominio(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos')
    }

    const token = await this.jwt.signAsync(
      { sub: usuario.id, email: usuario.email, papel: usuario.papel },
      { algorithm: 'HS256', expiresIn: '8h' },
    )
    return {
      token,
      expiresIn: JWT_EXPIRA_EM_SEGUNDOS,
      usuario: UsuarioRespostaDto.de(usuario),
    }
  }

  usuarioAtual(usuario: UsuarioAutenticado): UsuarioRespostaDto {
    return UsuarioRespostaDto.de(usuario)
  }

  private emailDuplicado(): ErroDominio {
    return new ErroDominio(409, 'EMAIL_JA_CADASTRADO', 'E-mail já cadastrado')
  }

  private eEmailDuplicado(erro: unknown): boolean {
    if (!(erro instanceof QueryFailedError)) return false
    const detalhe = erro as QueryFailedError & { driverError?: { message?: string } }
    return detalhe.driverError?.message?.includes('usuario.email') === true
  }
}
