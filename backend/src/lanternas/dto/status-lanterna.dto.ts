import { IsIn } from 'class-validator'

export class StatusLanternaDto {
  @IsIn(['ativo', 'afastado'])
  status!: 'ativo' | 'afastado'
}
