import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn() id: number
  @Column({ unique: true }) email: string
  @Column({ name: 'senha_hash', select: false }) senhaHash: string
  @Column({ default: 'usuario' }) papel: string
}
