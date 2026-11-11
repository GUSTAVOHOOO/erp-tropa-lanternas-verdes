import { Injectable, OnModuleInit } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import * as bcrypt from 'bcrypt'

const CUSTO_BCRYPT = 10

@Injectable()
export class SenhaService implements OnModuleInit {
  private hashIsca!: string

  async onModuleInit(): Promise<void> {
    const segredoDescartavel = randomBytes(48).toString('base64url')
    this.hashIsca = await bcrypt.hash(segredoDescartavel, CUSTO_BCRYPT)
  }

  hash(senha: string): Promise<string> {
    return bcrypt.hash(senha, CUSTO_BCRYPT)
  }

  comparar(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash)
  }

  compararComIsca(senha: string): Promise<boolean> {
    return bcrypt.compare(senha, this.hashIsca)
  }
}
