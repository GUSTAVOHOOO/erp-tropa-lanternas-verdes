import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GruposModule } from '../grupos/grupos.module.js'
import { Recurso } from './recurso.entity.js'
import { RecursosController } from './recursos.controller.js'
import { RecursosRepository } from './recursos.repository.js'
import { RecursosService } from './recursos.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([Recurso]), GruposModule],
  controllers: [RecursosController],
  providers: [RecursosService, RecursosRepository],
  exports: [RecursosService, RecursosRepository],
})
export class RecursosModule {}
