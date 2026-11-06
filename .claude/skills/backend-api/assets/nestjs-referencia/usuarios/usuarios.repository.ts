import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryFailedError, Repository } from 'typeorm'
import { Usuario } from './usuario.entity.js'

const VIOLACAO_UNICA = '23505' // PostgreSQL

@Injectable()
export class UsuariosRepository {
  constructor(@InjectRepository(Usuario) private readonly orm: Repository<Usuario>) {}

  existe(email: string) { return this.orm.existsBy({ email }) }

  /** senha_hash tem select: false, então precisa ser pedida de propósito. */
  buscarComSenha(email: string) {
    return this.orm
      .createQueryBuilder('u')
      .addSelect('u.senhaHash')
      .where('u.email = :email', { email })
      .getOne()
  }

  async criar(email: string, senhaHash: string) {
    try {
      return await this.orm.save(this.orm.create({ email, senhaHash }))
    } catch (e) {
      const codigo = (e as QueryFailedError & { driverError?: { code?: string } }).driverError?.code
      if (e instanceof QueryFailedError && codigo === VIOLACAO_UNICA) {
        throw new ConflictException('E-mail já cadastrado')
      }
      throw e
    }
  }
}
