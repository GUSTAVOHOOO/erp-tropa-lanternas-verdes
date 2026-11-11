import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { LanternasController } from './lanternas.controller.js'
import { LanternasService } from './lanternas.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [LanternasController],
  providers: [LanternasService],
  exports: [LanternasService],
})
export class LanternasModule {}
