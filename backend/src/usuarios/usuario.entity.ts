import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm'
import type { Relation } from 'typeorm'
import type { Lanterna } from '../lanternas/lanterna.entity.js'
import type { Setor } from '../setores/setor.entity.js'
import type { Evento } from '../eventos/evento.entity.js'
import type { Comentario } from '../comentarios/comentario.entity.js'
import type { Ocorrencia } from '../ocorrencias/ocorrencia.entity.js'

export type PapelUsuario = 'guardiao' | 'lanterna'

@Entity('usuario')
export class Usuario {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string

  @Column({ type: 'text' })
  nome!: string

  @Column({ type: 'text', unique: true })
  email!: string

  @Column({ type: 'text' })
  nomeBusca!: string

  @Column({ type: 'text' })
  emailBusca!: string

  @Column({ type: 'text', select: false })
  senhaHash!: string

  @Column({ type: 'simple-enum', enum: ['guardiao', 'lanterna'] })
  papel!: PapelUsuario

  @Column({ type: 'integer', nullable: true })
  setorId!: number | null

  @ManyToOne('Setor', 'usuarios', { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'setorId' })
  setor!: Relation<Setor> | null

  @Column({ type: 'varchar', length: 80, nullable: true, unique: true })
  lanternaId!: string | null

  @OneToOne('Lanterna', 'usuario', { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lanternaId' })
  lanterna!: Relation<Lanterna> | null

  @CreateDateColumn({ type: 'datetime' })
  criadoEm!: Date

  @OneToMany('Ocorrencia', 'criadaPor')
  ocorrenciasCriadas!: Relation<Ocorrencia[]>

  @OneToMany('Evento', 'autor')
  eventos!: Relation<Evento[]>

  @OneToMany('Comentario', 'autor')
  comentarios!: Relation<Comentario[]>
}
