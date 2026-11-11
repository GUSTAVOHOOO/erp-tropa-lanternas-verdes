export const IDS_FIXTURE_INTEGRACAO_A = {
  guardiao: 'f1f68873-7ea3-4e5a-817f-aca74d4d2814',
  guardiaoSecundario: 'd50dfc82-a05b-4aef-9bd2-5f2dd6f2674a',
  lanterna2814: '6d77f441-a918-4716-9343-7823028c2814',
  lanterna674: 'bed7e7b5-3144-4a65-9b71-f28619696740',
  lanternaSemFicha: '32facbd1-c095-45c0-b64a-fb8d238f0001',
} as const

export const IDS_FIXTURE_INTEGRACAO_B = {
  hal2814: 'fixture-hal-2814',
  kilowog674: 'fixture-kilowog-674',
  semSetor: 'fixture-sem-setor',
} as const

export const IDS_FIXTURE_INTEGRACAO_E = {
  comentarioLanterna: 'a0830000-0000-4000-8000-000000000001',
  comentarioGuardiao: 'a0830000-0000-4000-8000-000000000002',
  comentarioResolvido: 'a0830000-0000-4000-8000-000000000003',
  eventoComentarioApagado: 'a0840000-0000-4000-8000-000000000001',
} as const

export const SETORES_FIXTURE_A = [
  { id: 2814, nome: 'Setor 2814', descricao: 'Inclui a Terra. Um dos setores mais movimentados do universo.' },
  { id: 674, nome: 'Setor 674', descricao: 'Inclui Bolovax Vik, planeta natal de Kilowog.' },
] as const

export const CONTAS_FIXTURE_A = [
  { caso: 'G', id: IDS_FIXTURE_INTEGRACAO_A.guardiao, nome: 'Guardião de Teste', email: 'guardiao@fixture.invalid', papel: 'guardiao' as const, setorId: null },
  { caso: 'G2', id: IDS_FIXTURE_INTEGRACAO_A.guardiaoSecundario, nome: 'Segundo Guardião de Teste', email: 'guardiao-secundario@fixture.invalid', papel: 'guardiao' as const, setorId: null },
  { caso: 'L2814', id: IDS_FIXTURE_INTEGRACAO_A.lanterna2814, nome: 'Lanterna Setor 2814', email: 'l2814@fixture.invalid', papel: 'lanterna' as const, setorId: 2814 },
  { caso: 'L674', id: IDS_FIXTURE_INTEGRACAO_A.lanterna674, nome: 'Lanterna Setor 674', email: 'l674@fixture.invalid', papel: 'lanterna' as const, setorId: 674 },
  { caso: 'L-sem-ficha', id: IDS_FIXTURE_INTEGRACAO_A.lanternaSemFicha, nome: 'Lanterna sem Ficha', email: 'lanterna-sem-ficha@fixture.invalid', papel: 'lanterna' as const, setorId: 2814 },
] as const
