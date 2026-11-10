import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcrypt'
import { UsuariosRepository } from '../usuarios/usuarios.repository.js'
import { LoginDto, RegistroDto } from './dto.js'

const CUSTO = 10
// Hash real de uma senha aleatória: login de e-mail inexistente gasta o mesmo tempo.
const HASH_ISCA = bcrypt.hashSync(crypto.randomUUID(), CUSTO)

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly jwt: JwtService,
  ) {}

  async registrar(dto: RegistroDto) {
    if (await this.usuarios.existe(dto.email)) throw new ConflictException('E-mail já cadastrado')
    const u = await this.usuarios.criar(dto.email, await bcrypt.hash(dto.senha, CUSTO))
    return { id: u.id, email: u.email } // nunca o objeto inteiro: ele contém o hash
  }

  async entrar(dto: LoginDto) {
    const u = await this.usuarios.buscarComSenha(dto.email)
    const ok = await bcrypt.compare(dto.senha, u?.senhaHash ?? HASH_ISCA)
    if (!u || !ok) throw new UnauthorizedException('E-mail ou senha inválidos')
    const payload = { sub: u.id, email: u.email, papel: u.papel }
    return { accessToken: await this.jwt.signAsync(payload) }
  }
}
