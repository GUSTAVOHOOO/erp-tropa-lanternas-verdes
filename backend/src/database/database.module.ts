import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { validarAmbiente } from '../config/ambiente.js'
import { Comentario } from '../comentarios/comentario.entity.js'
import { ComentariosRepository } from '../comentarios/comentarios.repository.js'
import { Evento } from '../eventos/evento.entity.js'
import { EventosRepository } from '../eventos/eventos.repository.js'
import { Lanterna } from '../lanternas/lanterna.entity.js'
import { LanternasRepository } from '../lanternas/lanternas.repository.js'
import { Ocorrencia } from '../ocorrencias/ocorrencia.entity.js'
import { OcorrenciasRepository } from '../ocorrencias/ocorrencias.repository.js'
import { Setor } from '../setores/setor.entity.js'
import { SetoresRepository } from '../setores/setores.repository.js'
import { Usuario } from '../usuarios/usuario.entity.js'
import { UsuariosRepository } from '../usuarios/usuarios.repository.js'
import { criarOpcoesBanco } from './database-options.js'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => criarOpcoesBanco(validarAmbiente(process.env)),
    }),
    TypeOrmModule.forFeature([Setor, Lanterna, Usuario, Ocorrencia, Evento, Comentario]),
  ],
  providers: [
    SetoresRepository,
    LanternasRepository,
    UsuariosRepository,
    OcorrenciasRepository,
    EventosRepository,
    ComentariosRepository,
  ],
  exports: [
    SetoresRepository,
    LanternasRepository,
    UsuariosRepository,
    OcorrenciasRepository,
    EventosRepository,
    ComentariosRepository,
  ],
})
export class DatabaseModule {}
