import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'
import type { Relation } from 'typeorm'
import type { Ocorrencia } from '../ocorrencias/ocorrencia.entity.js'
import type { Usuario } from '../usuarios/usuario.entity.js'

export type TipoEvento =
  | 'criada'
  | 'atribuida'
  | 'status_alterado'
  | 'reaberta'
  | 'resolvida'
  | 'comentario_apagado'

@Entity('evento')
@Index('IDX_evento_ocorrencia_criadoEm', ['ocorrenciaId', 'criadoEm'])
export class Evento {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string

  @Column({ type: 'varchar', length: 36 })
  ocorrenciaId!: string

  @ManyToOne('Ocorrencia', 'eventos', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ocorrenciaId' })
  ocorrencia!: Relation<Ocorrencia>

  @Column({ type: 'simple-enum', enum: [
    'criada',
    'atribuida',
    'status_alterado',
    'reaberta',
    'resolvida',
    'comentario_apagado',
  ] })
  tipo!: TipoEvento

  @Column({ type: 'varchar', length: 36 })
  autorId!: string

  @ManyToOne('Usuario', 'eventos', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'autorId' })
  autor!: Relation<Usuario>

  @Column({ type: 'simple-json' })
  dados!: Record<string, unknown>

  @CreateDateColumn({ type: 'datetime' })
  criadoEm!: Date
}
