import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm'
import type { Relation } from 'typeorm'
import type { Setor } from '../setores/setor.entity.js'
import type { Usuario } from '../usuarios/usuario.entity.js'
import type { Ocorrencia } from '../ocorrencias/ocorrencia.entity.js'

export type StatusLanterna = 'ativo' | 'em_missao' | 'afastado'

@Entity('lanterna')
export class Lanterna {
  @PrimaryColumn({ type: 'text' })
  id!: string

  @Column({ type: 'text' })
  codinome!: string

  @Column({ type: 'text', nullable: true })
  identidadeCivil!: string | null

  @Column({ type: 'text', nullable: true })
  especie!: string | null

  @Column({ type: 'text', nullable: true })
  planetaNatal!: string | null

  @Column({ type: 'integer', nullable: true })
  setorId!: number | null

  @ManyToOne('Setor', 'lanternas', { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'setorId' })
  setor!: Relation<Setor> | null

  @Column({ type: 'simple-enum', enum: ['ativo', 'em_missao', 'afastado'] })
  status!: StatusLanterna

  @Column({ type: 'integer', nullable: true })
  anoIngresso!: number | null

  @Column({ type: 'text', nullable: true })
  primeiraAparicao!: string | null

  @Column({ type: 'simple-json' })
  habilidades!: string[]

  @Column({ type: 'text', nullable: true })
  mentorId!: string | null

  @ManyToOne('Lanterna', 'aprendizes', { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mentorId' })
  mentor!: Relation<Lanterna> | null

  @OneToMany('Lanterna', 'mentor')
  aprendizes!: Relation<Lanterna[]>

  @Column({ type: 'text', nullable: true })
  citacao!: string | null

  @Column({ type: 'text', nullable: true })
  biografia!: string | null

  @Column({ type: 'simple-json' })
  fontes!: Record<string, { estado: 'verificado' | 'nao_verificado'; url?: string }>

  @Column({ type: 'text' })
  codinomeBusca!: string

  @OneToOne('Usuario', 'lanterna')
  usuario!: Relation<Usuario> | null

  @OneToMany('Ocorrencia', 'responsavel')
  ocorrenciasResponsavel!: Relation<Ocorrencia[]>
}
