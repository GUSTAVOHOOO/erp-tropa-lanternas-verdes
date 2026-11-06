import { Injectable, NotFoundException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import type { UsuarioToken } from '../auth/decorators.js'
import { SemDisponibilidadeException } from '../comum/excecao-dominio.js'
import { Recurso } from '../recursos/recurso.entity.js'
import { RecursosRepository } from '../recursos/recursos.repository.js'
import { CriarReservaDto } from './dto/criar-reserva.dto.js'
import { ItemReserva, Reserva } from './reserva.entity.js'

@Injectable()
export class ReservasService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly recursos: RecursosRepository,
  ) {}

  criar(dto: CriarReservaDto, usuario: UsuarioToken) {
    return this.dataSource.transaction(async (manager) => {
      const reserva = await manager.save(Reserva, manager.create(Reserva, { usuarioId: usuario.sub }))
      let centavos = 0
      // ordem fixa de ids: duas transações não travam uma à outra em ordem inversa
      for (const item of [...dto.itens].sort((a, b) => a.recursoId - b.recursoId)) {
        const recurso = await manager.findOneBy(Recurso, { id: item.recursoId })
        if (!recurso) throw new NotFoundException('Recurso não encontrado')
        const baixou = await this.recursos.baixarDisponivel(recurso.id, item.qtd, manager)
        if (!baixou) throw new SemDisponibilidadeException(recurso.id)
        await manager.save(ItemReserva, manager.create(ItemReserva, { reserva, recurso, qtd: item.qtd, valorUnit: recurso.valor }))
        centavos += Math.round(Number(recurso.valor) * 100) * item.qtd
      }
      reserva.total = (centavos / 100).toFixed(2)
      return manager.save(reserva)
    })
  }

  async buscarDoUsuario(id: number, usuario: UsuarioToken) {
    const reserva = await this.dataSource.manager.findOneBy(Reserva, { id })
    // 404 também para quem não é dono: não revela que o id existe
    if (!reserva || (reserva.usuarioId !== usuario.sub && usuario.papel !== 'admin')) {
      throw new NotFoundException('Reserva não encontrada')
    }
    return reserva
  }

  listarDoUsuario(usuario: UsuarioToken) {
    return this.dataSource.manager.findBy(Reserva, { usuarioId: usuario.sub })
  }
}
