import { Module } from '@nestjs/common'
import { EventosController } from './eventos.controller.js'
import { EventosConsultaService } from './eventos-consulta.service.js'
import { DatabaseModule } from '../database/database.module.js'
import { EventosService } from './eventos.service.js'

@Module({ imports: [DatabaseModule], controllers: [EventosController], providers: [EventosService, EventosConsultaService], exports: [EventosService] })
export class EventosModule {}
