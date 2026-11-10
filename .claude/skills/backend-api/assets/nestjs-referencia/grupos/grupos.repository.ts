import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Grupo } from './grupo.entity.js'

@Injectable()
export class GruposRepository {
  constructor(@InjectRepository(Grupo) private readonly orm: Repository<Grupo>) {}
  buscarPorId(id: number) { return this.orm.findOneBy({ id }) }
  salvar(dados: Partial<Grupo>) { return this.orm.save(this.orm.create(dados)) }
}
