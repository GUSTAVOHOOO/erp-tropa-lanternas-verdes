export const IDS_SEED_MINIMO = {
  guardiao: '55ee8d6c-275f-49f9-b172-9ecce899ec00',
  hal: 'bc180d15-abce-4a0c-9253-96aeb6a32814',
  kilowog: 'bc180d15-abce-4a0c-9253-96aeb6a00674',
}

export const IDS_SEED_OCORRENCIAS = {
  o1: 'a0850000-0000-4000-8000-000000000001',
  o2: 'a0850000-0000-4000-8000-000000000002',
  o3: 'a0850000-0000-4000-8000-000000000003',
  o4: 'a0850000-0000-4000-8000-000000000004',
  o5: 'a0850000-0000-4000-8000-000000000005',
  o6: 'a0850000-0000-4000-8000-000000000006',
  o7: 'a0850000-0000-4000-8000-000000000007',
  o8: 'a0850000-0000-4000-8000-000000000008',
  o9: 'a0850000-0000-4000-8000-000000000009',
} as const

export const IDS_SEED_EVENTOS = {
  criada: [
    'a0860000-0000-4000-8000-000000000001', 'a0860000-0000-4000-8000-000000000002',
    'a0860000-0000-4000-8000-000000000003', 'a0860000-0000-4000-8000-000000000004',
    'a0860000-0000-4000-8000-000000000005', 'a0860000-0000-4000-8000-000000000006',
    'a0860000-0000-4000-8000-000000000007', 'a0860000-0000-4000-8000-000000000008',
    'a0860000-0000-4000-8000-000000000009',
  ],
  atribuida: {
    o1: 'a0860000-0000-4000-8000-000000000011', o3: 'a0860000-0000-4000-8000-000000000031',
    o5: 'a0860000-0000-4000-8000-000000000051', o6: 'a0860000-0000-4000-8000-000000000061',
    o7: 'a0860000-0000-4000-8000-000000000071', o8: 'a0860000-0000-4000-8000-000000000081',
  },
  status: {
    o1: 'a0860000-0000-4000-8000-000000000012', o3: 'a0860000-0000-4000-8000-000000000032',
    o5: 'a0860000-0000-4000-8000-000000000052', o6: 'a0860000-0000-4000-8000-000000000062',
    o7: 'a0860000-0000-4000-8000-000000000072',
  },
  resolvida: {
    o3: 'a0860000-0000-4000-8000-000000000033', o6: 'a0860000-0000-4000-8000-000000000063',
    o7: 'a0860000-0000-4000-8000-000000000073',
  },
} as const

export const IDS_SEED_COMENTARIOS = [
  'a0870000-0000-4000-8000-000000000001', 'a0870000-0000-4000-8000-000000000002',
  'a0870000-0000-4000-8000-000000000003', 'a0870000-0000-4000-8000-000000000004',
  'a0870000-0000-4000-8000-000000000005', 'a0870000-0000-4000-8000-000000000006',
] as const

export const ID_EVENTO_COMENTARIO_SEED = 'a0880000-0000-4000-8000-000000000001'

export const SETORES_SEED_MINIMO = [
  { id: 0, nome: 'Setor 0', descricao: 'Oa, sede da Tropa e lar dos Guardiões.' },
  { id: 674, nome: 'Setor 674', descricao: 'Inclui Bolovax Vik, planeta natal de Kilowog.' },
  { id: 2814, nome: 'Setor 2814', descricao: 'Inclui a Terra. Um dos setores mais movimentados do universo.' },
] as const

export const SETORES_SEED_COMPLETO = [
  ...SETORES_SEED_MINIMO,
  { id: 1417, nome: 'Setor 1417', descricao: 'Inclui Korugar, planeta natal de Sinestro e de Lanternas do setor.' },
  { id: 3601, nome: 'Setor 3601', descricao: 'Setor sem Lanterna designado nesta demonstração.' },
  { id: 2813, nome: 'Setor 2813', descricao: 'Setor vizinho ao Setor 2814, incluindo Xudar.' },
  { id: 2, nome: 'Setor 2', descricao: 'Inclui Ovacron 6, planeta natal de Hannu.' },
] as const

export const CONTA_GUARDIAO_SEED = {
  id: IDS_SEED_MINIMO.guardiao,
  nome: 'Ganthet',
  email: 'ganthet@oa.tropa',
  papel: 'guardiao' as const,
  setorId: null,
  lanternaId: null,
}

export const CONTAS_LANTERNA_SEED = [
  {
    id: IDS_SEED_MINIMO.hal, nome: 'Hal Jordan', email: 'hal@oa.tropa', papel: 'lanterna' as const,
    setorId: 2814, lanternaId: 'hal-jordan', senha: 'lanterna123',
  },
  {
    id: IDS_SEED_MINIMO.kilowog, nome: 'Kilowog', email: 'kilowog@oa.tropa', papel: 'lanterna' as const,
    setorId: 674, lanternaId: 'kilowog', senha: 'lanterna123',
  },
] as const
