import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { UsuariosController } from './usuarios.controller.js'
import { UsuariosService } from './usuarios.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
