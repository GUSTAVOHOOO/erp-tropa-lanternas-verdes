import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm'
import type { Relation } from 'typeorm'
import type { Setor } from '../setores/setor.entity.js'
import type { Lanterna } from '../lanternas/lanterna.entity.js'
import type { Usuario } from '../usuarios/usuario.entity.js'
import type { Evento } from '../eventos/evento.entity.js'
import type { Comentario } from '../comentarios/comentario.entity.js'

export type GravidadeOcorrencia = 'baixa' | 'media' | 'alta' | 'critica'
export type StatusOcorrencia = 'aberta' | 'em_andamento' | 'resolvida'

@Entity('ocorrencia')
@Index('IDX_ocorrencia_setor_status', ['setorId', 'status'])
@Index('IDX_ocorrencia_responsavel_status', ['responsavelId', 'status'])
@Index('IDX_ocorrencia_criadaEm', ['criadaEm'])
export class Ocorrencia {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string

  @Column({ type: 'text' })
  titulo!: string

  @Column({ type: 'text' })
  tituloBusca!: string

  @Column({ type: 'text' })
  descricao!: string

  @Column({ type: 'text' })
  planeta!: string

  @Column({ type: 'integer' })
  setorId!: number

  @ManyToOne('Setor', 'ocorrencias', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'setorId' })
  setor!: Relation<Setor>

  @Column({ type: 'simple-enum', enum: ['baixa', 'media', 'alta', 'critica'] })
  gravidade!: GravidadeOcorrencia

  @Column({ type: 'simple-enum', enum: ['aberta', 'em_andamento', 'resolvida'] })
  status!: StatusOcorrencia

  @Column({ type: 'integer' })
  envolvidos!: number

  @Column({ type: 'text', nullable: true })
  responsavelId!: string | null

  @ManyToOne('Lanterna', 'ocorrenciasResponsavel', {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'responsavelId' })
  responsavel!: Relation<Lanterna> | null

  @Column({ type: 'text', nullable: true })
  resolucao!: string | null

  @Column({ type: 'varchar', length: 36 })
  criadaPorId!: string

  @ManyToOne('Usuario', 'ocorrenciasCriadas', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'criadaPorId' })
  criadaPor!: Relation<Usuario>

  @CreateDateColumn({ type: 'datetime' })
  criadaEm!: Date

  @Column({ type: 'datetime', nullable: true })
  resolvidaEm!: Date | null

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  excluidaEm!: Date | null

  @OneToMany('Evento', 'ocorrencia')
  eventos!: Relation<Evento[]>

  @OneToMany('Comentario', 'ocorrencia')
  comentarios!: Relation<Comentario[]>
}
