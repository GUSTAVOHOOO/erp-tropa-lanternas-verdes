import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import type { Relation } from 'typeorm'
import { Recurso } from '../recursos/recurso.entity.js'

@Entity('grupos')
export class Grupo {
  @PrimaryGeneratedColumn() id: number
  @Column({ length: 120 }) nome: string
  @OneToMany(() => Recurso, (r) => r.grupo) recursos: Relation<Recurso[]>
}
