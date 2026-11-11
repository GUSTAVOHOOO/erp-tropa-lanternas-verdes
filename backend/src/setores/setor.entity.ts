import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm'
import type { Relation } from 'typeorm'
import type { Lanterna } from '../lanternas/lanterna.entity.js'
import type { Ocorrencia } from '../ocorrencias/ocorrencia.entity.js'
import type { Usuario } from '../usuarios/usuario.entity.js'

@Entity('setor')
export class Setor {
  @PrimaryColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'text' })
  nome!: string

  @Column({ type: 'text' })
  descricao!: string

  @OneToMany('Lanterna', 'setor')
  lanternas!: Relation<Lanterna[]>

  @OneToMany('Usuario', 'setor')
  usuarios!: Relation<Usuario[]>

  @OneToMany('Ocorrencia', 'setor')
  ocorrencias!: Relation<Ocorrencia[]>
}
