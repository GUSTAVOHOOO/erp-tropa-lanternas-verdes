import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RecursosModule } from '../recursos/recursos.module.js'
import { ItemReserva, Reserva } from './reserva.entity.js'
import { ReservasController } from './reservas.controller.js'
import { ReservasService } from './reservas.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, ItemReserva]), RecursosModule],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
