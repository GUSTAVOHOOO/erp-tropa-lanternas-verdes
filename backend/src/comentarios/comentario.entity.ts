import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'
import type { Relation } from 'typeorm'
import type { Ocorrencia } from '../ocorrencias/ocorrencia.entity.js'
import type { Usuario } from '../usuarios/usuario.entity.js'

@Entity('comentario')
@Index('IDX_comentario_ocorrencia_criadoEm', ['ocorrenciaId', 'criadoEm'])
export class Comentario {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string

  @Column({ type: 'varchar', length: 36 })
  ocorrenciaId!: string

  @ManyToOne('Ocorrencia', 'comentarios', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ocorrenciaId' })
  ocorrencia!: Relation<Ocorrencia>

  @Column({ type: 'varchar', length: 36 })
  autorId!: string

  @ManyToOne('Usuario', 'comentarios', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'autorId' })
  autor!: Relation<Usuario>

  @Column({ type: 'text' })
  texto!: string

  @CreateDateColumn({ type: 'datetime' })
  criadoEm!: Date

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  excluidoEm!: Date | null
}
