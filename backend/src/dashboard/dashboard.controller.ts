import { Controller, Get, Query } from '@nestjs/common'
import { UsuarioAtual } from '../comum/usuario-atual.decorator.js'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import { DashboardService } from './dashboard.service.js'
import { FiltroDashboardDto } from './dto/filtro-dashboard.dto.js'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  consultar(@Query() filtros: FiltroDashboardDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.dashboard.consultar(filtros, usuario)
  }
}
