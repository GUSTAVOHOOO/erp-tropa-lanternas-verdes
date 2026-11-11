import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { EventosModule } from '../eventos/eventos.module.js'
import { ComentariosController } from './comentarios.controller.js'
import { ComentariosService } from './comentarios.service.js'

@Module({
  imports: [DatabaseModule, EventosModule],
  controllers: [ComentariosController],
  providers: [ComentariosService],
})
export class ComentariosModule {}
