import { describe, expect, it, vi, beforeEach } from 'vitest'
vi.mock('server-only',()=>({}))
vi.mock('@/lib/env',()=>({get env(){return {API_URL:'http://localhost:43117'}}}))
vi.mock('@/lib/dal',()=>({lerTokenObrigatorio:vi.fn(async()=> 'fake-token')}))
import { listarOcorrencias, buscarOcorrencia, contarOcorrencias } from '@/lib/ocorrencias'
const item={id:'00000000-0000-4000-8000-000000000001',titulo:'Teste válido',descricao:'Descrição suficientemente longa',planeta:'Terra',setorId:0,gravidade:'baixa',status:'aberta',envolvidos:1,responsavelId:null,resolucao:null,criadaPorId:'00000000-0000-4000-8000-000000000002',criadaEm:'2026-01-01T00:00:00Z',resolvidaEm:null,prazoEm:'2026-01-02T00:00:00Z',vencida:false}
const envelope=(dados:unknown)=>new Response(JSON.stringify({sucesso:true,dados}),{status:200,headers:{'content-type':'application/json'}})
describe('serviço de ocorrências preparado pelo contrato',()=>{
 beforeEach(()=>vi.restoreAllMocks())
 it('envia filtros, paginação e Bearer sem cache',async()=>{const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(envelope({itens:[item],meta:{total:9,pagina:2,limite:1,paginas:9}}));const p=await listarOcorrencias({pagina:2,status:'aberta',setor:0,limite:1});expect(p.meta.total).toBe(9);expect(String(fetch.mock.calls[0][0])).toContain('setor=0');expect(fetch.mock.calls[0][1]?.cache).toBe('no-store');expect((fetch.mock.calls[0][1]?.headers as Record<string,string>).Authorization).toBe('Bearer fake-token')})
 it('recusa consulta fora do contrato antes da request',async()=>{const f=vi.spyOn(globalThis,'fetch');await expect(listarOcorrencias({setorId:2} as never)).rejects.toThrow();expect(f).not.toHaveBeenCalled()})
 it('UUID inválido não consulta e contagem usa meta.total',async()=>{const f=vi.spyOn(globalThis,'fetch').mockResolvedValue(envelope({itens:[],meta:{total:42,pagina:1,limite:1,paginas:42}}));expect(await buscarOcorrencia('bad')).toBeNull();expect(await contarOcorrencias()).toBe(42);expect(f).toHaveBeenCalledTimes(1)})
})

