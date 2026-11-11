import { describe, expect, it } from 'vitest'
import { acoesPermitidas } from '@/lib/permissoes-ocorrencia'
import type { Sessao } from '@/lib/schemas/usuario'
import type { Ocorrencia } from '@/lib/schemas/ocorrencia'
const base = { id:'00000000-0000-4000-8000-000000000001', titulo:'Titulo valido', descricao:'Descricao suficientemente longa', planeta:'Terra', setorId:12, gravidade:'baixa', status:'aberta', envolvidos:1, responsavelId:'hal-jordan', resolucao:null, criadaPorId:'00000000-0000-4000-8000-000000000002', criadaEm:'2026-01-01T00:00:00Z', resolvidaEm:null, prazoEm:'2026-01-02T00:00:00Z', vencida:false } as Ocorrencia
const sessao = (papel:'guardiao'|'lanterna', setorId:number|null, id='00000000-0000-4000-8000-000000000002') => ({ id, papel, setorId, lanternaId:null, nome:'Teste', email:'teste@example.com', criadoEm:'2026-01-01T00:00:00Z' }) as Sessao
describe('acoesPermitidas', () => {
 it('aplica permissões da matriz por status e papel', () => {
  expect(acoesPermitidas(sessao('lanterna',12),base)).toEqual({iniciar:true,resolver:false,reabrir:false,atribuir:false,liberar:false,editar:true,excluir:false})
  expect(acoesPermitidas(sessao('guardiao',null),base)).toEqual({iniciar:true,resolver:false,reabrir:false,atribuir:true,liberar:true,editar:true,excluir:true})
  expect(acoesPermitidas(sessao('guardiao',null),{...base,status:'em_andamento'})).toEqual({iniciar:false,resolver:true,reabrir:false,atribuir:true,liberar:false,editar:true,excluir:true})
  expect(acoesPermitidas(sessao('lanterna',12),{...base,status:'resolvida'})).toEqual({iniciar:false,resolver:false,reabrir:false,atribuir:false,liberar:false,editar:false,excluir:false})
  expect(acoesPermitidas(sessao('guardiao',null),{...base,status:'resolvida'})).toEqual({iniciar:false,resolver:false,reabrir:true,atribuir:false,liberar:false,editar:false,excluir:true})
 })
 it('restringe lanterna a setor e criador, e iniciar requer responsável', () => {
  expect(acoesPermitidas(sessao('lanterna',13),base).editar).toBe(false)
  expect(acoesPermitidas(sessao('lanterna',12,'00000000-0000-4000-8000-000000000099'),base).editar).toBe(false)
  expect(acoesPermitidas(sessao('lanterna',12),{...base,responsavelId:null}).iniciar).toBe(false)
 })
})
