import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { EventosModule } from '../eventos/eventos.module.js'
import { LanternasModule } from '../lanternas/lanternas.module.js'
import { EditarOcorrenciaPipe } from './editar-ocorrencia.pipe.js'
import { OcorrenciasController } from './ocorrencias.controller.js'
import { OcorrenciasService } from './ocorrencias.service.js'
import { CicloVidaService } from './ciclo-vida.service.js'

@Module({
  imports: [DatabaseModule, EventosModule, LanternasModule],
  controllers: [OcorrenciasController],
  providers: [OcorrenciasService, CicloVidaService, EditarOcorrenciaPipe],
})
export class OcorrenciasModule {}
