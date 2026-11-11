import { SetMetadata } from '@nestjs/common'

export const PUBLICA_KEY = 'rota_publica'
export const Publica = () => SetMetadata(PUBLICA_KEY, true)
