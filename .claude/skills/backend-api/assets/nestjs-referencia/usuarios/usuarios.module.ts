import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from './usuario.entity.js'
import { UsuariosRepository } from './usuarios.repository.js'

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [UsuariosRepository],
  exports: [UsuariosRepository],
})
export class UsuariosModule {}
