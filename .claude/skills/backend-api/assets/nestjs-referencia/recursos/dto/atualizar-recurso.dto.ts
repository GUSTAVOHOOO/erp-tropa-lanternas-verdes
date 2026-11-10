import { PartialType } from '@nestjs/mapped-types'
import { CriarRecursoDto } from './criar-recurso.dto.js'

export class AtualizarRecursoDto extends PartialType(CriarRecursoDto) {}
