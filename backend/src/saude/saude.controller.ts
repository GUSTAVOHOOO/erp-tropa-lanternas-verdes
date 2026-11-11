import { Controller, Get } from '@nestjs/common'
import { Publica } from '../comum/publica.decorator.js'

@Publica()
@Controller('saude')
export class SaudeController {
  @Get()
  verificar() {
    return { status: 'ok' }
  }
}
