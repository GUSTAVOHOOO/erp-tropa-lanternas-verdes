import { SetMetadata } from '@nestjs/common'
import type { PapelUsuario } from '../usuarios/usuario.entity.js'

export const PAPEIS_KEY = 'papeis_permitidos'
export const Papeis = (...papeis: PapelUsuario[]) => SetMetadata(PAPEIS_KEY, papeis)
