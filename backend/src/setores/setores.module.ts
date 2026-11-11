import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { SetoresController } from './setores.controller.js'
import { SetoresService } from './setores.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [SetoresController],
  providers: [SetoresService],
  exports: [SetoresService],
})
export class SetoresModule {}
