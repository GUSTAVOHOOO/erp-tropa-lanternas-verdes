import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import type { Relation } from 'typeorm'
import { Recurso } from '../recursos/recurso.entity.js'

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn() id: number
  @Index() @Column({ name: 'usuario_id' }) usuarioId: number
  @Column('decimal', { precision: 12, scale: 2, default: 0 }) total: string
  @OneToMany(() => ItemReserva, (i) => i.reserva) itens: Relation<ItemReserva[]>
}

@Entity('itens_reserva')
export class ItemReserva {
  @PrimaryGeneratedColumn() id: number
  @Column({ type: 'int' }) qtd: number
  @Column('decimal', { name: 'valor_unit', precision: 10, scale: 2 }) valorUnit: string // cópia do valor na hora
  @Index() @ManyToOne(() => Reserva, (r) => r.itens, { nullable: false }) @JoinColumn({ name: 'reserva_id' })
  reserva: Relation<Reserva>
  @Index() @ManyToOne(() => Recurso, { nullable: false }) @JoinColumn({ name: 'recurso_id' })
  recurso: Relation<Recurso>
}
