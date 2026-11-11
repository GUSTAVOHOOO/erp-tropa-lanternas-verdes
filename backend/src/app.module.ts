import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { LogMiddleware } from './comum/log.middleware.js'
import { AuthModule } from './auth/auth.module.js'
import { SaudeController } from './saude/saude.controller.js'
import { SetoresModule } from './setores/setores.module.js'
import { LanternasModule } from './lanternas/lanternas.module.js'
import { UsuariosModule } from './usuarios/usuarios.module.js'
import { OcorrenciasModule } from './ocorrencias/ocorrencias.module.js'
import { EventosModule } from './eventos/eventos.module.js'
import { ComentariosModule } from './comentarios/comentarios.module.js'
import { DashboardModule } from './dashboard/dashboard.module.js'

@Module({
  imports: [AuthModule, SetoresModule, LanternasModule, UsuariosModule, OcorrenciasModule, EventosModule, ComentariosModule, DashboardModule],
  controllers: [SaudeController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LogMiddleware).forRoutes('*path')
  }
}
