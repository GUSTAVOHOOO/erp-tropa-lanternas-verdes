import { Column, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import type { Relation } from 'typeorm'
import { Grupo } from '../grupos/grupo.entity.js'

@Entity('recursos')
export class Recurso {
  @PrimaryGeneratedColumn() id: number
  @Column({ length: 120 }) nome: string
  @Column('decimal', { precision: 10, scale: 2 }) valor: string
  @Column({ type: 'int', default: 0 }) disponivel: number

  @Index()
  @ManyToOne(() => Grupo, (g) => g.recursos, { nullable: false })
  @JoinColumn({ name: 'grupo_id' })
  grupo: Relation<Grupo>

  @DeleteDateColumn({ name: 'excluido_em' }) excluidoEm?: Date
}
