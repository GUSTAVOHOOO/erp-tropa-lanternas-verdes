import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Grupo } from './grupo.entity.js'
import { GruposRepository } from './grupos.repository.js'
import { GruposService } from './grupos.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([Grupo])],
  providers: [GruposService, GruposRepository],
  exports: [GruposService],
})
export class GruposModule {}
