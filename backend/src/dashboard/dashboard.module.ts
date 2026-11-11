import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { DashboardController } from './dashboard.controller.js'
import { DashboardRepository } from './dashboard.repository.js'
import { DashboardService } from './dashboard.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardRepository, DashboardService],
})
export class DashboardModule {}
