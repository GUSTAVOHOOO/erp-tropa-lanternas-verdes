import { IsIn, IsUrl, ValidateIf } from 'class-validator'

export class FonteCampoDto {
  @IsIn(['verificado', 'nao_verificado'])
  estado!: 'verificado' | 'nao_verificado'

  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  url?: string
}
