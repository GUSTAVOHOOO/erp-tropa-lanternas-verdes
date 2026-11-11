import type { Setor } from './setor.entity.js'

export class SetorRespostaDto {
  id!: number
  nome!: string
  descricao!: string

  static de(setor: Setor): SetorRespostaDto {
    const resposta = new SetorRespostaDto()
    resposta.id = setor.id
    resposta.nome = setor.nome
    resposta.descricao = setor.descricao
    return resposta
  }
}
