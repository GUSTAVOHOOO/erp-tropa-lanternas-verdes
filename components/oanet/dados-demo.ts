export type TelaOa = 'central' | 'ocorrencias' | 'lanternas' | 'construtos' | 'componentes' | 'portal' | 'acesso' | 'nova'

export const titulosTela: Record<TelaOa, string> = {
  central: 'Central de Comando', ocorrencias: 'Registro de ocorrências',
  lanternas: 'Lanternas da Tropa', componentes: 'Arsenal de interface',
  portal: 'A vontade protege o universo.', acesso: 'Identifique-se, Lanterna.',
  nova: 'Registrar ocorrência',
  construtos: 'Arquivo de construtos',
}

export const ocorrenciasDemo = [
  { id: 'OA-0284', titulo: 'Distúrbio em Coast City', setor: '2814', gravidade: 'Alta', status: 'Em atendimento', responsavel: 'Hal Jordan', hora: 'Há 12 min' },
  { id: 'OA-0283', titulo: 'Sinal desconhecido em Vega', setor: '1187', gravidade: 'Crítica', status: 'Aberta', responsavel: 'Não atribuído', hora: 'Há 28 min' },
  { id: 'OA-0282', titulo: 'Patrulha de reconhecimento', setor: '674', gravidade: 'Baixa', status: 'Em atendimento', responsavel: 'Kilowog', hora: 'Há 45 min' },
  { id: 'OA-0281', titulo: 'Anomalia no corredor espacial', setor: '2814', gravidade: 'Média', status: 'Aberta', responsavel: 'John Stewart', hora: 'Há 1 h' },
  { id: 'OA-0280', titulo: 'Evacuação de Korugar', setor: '1417', gravidade: 'Alta', status: 'Resolvida', responsavel: 'Soranik Natu', hora: 'Há 2 h' },
  { id: 'OA-0279', titulo: 'Restabelecimento de comunicação', setor: '2814', gravidade: 'Baixa', status: 'Resolvida', responsavel: 'Jessica Cruz', hora: 'Há 3 h' },
] as const

export const lanternasDemo = [
  { nome: 'Hal Jordan', setor: '2814', sigla: 'HJ', papel: 'Oficial de patrulha', frase: 'A coragem é seguir em frente, mesmo com medo.', missao: 'Patrulha da Terra', energia: 98 },
  { nome: 'John Stewart', setor: '2814', sigla: 'JS', papel: 'Comandante tático', frase: 'Cada construção começa com uma vontade inabalável.', missao: 'Defesa de Coast City', energia: 96 },
  { nome: 'Kilowog', setor: '674', sigla: 'KW', papel: 'Instrutor da Tropa', frase: 'Ninguém protege o universo sozinho.', missao: 'Formação em Oa', energia: 100 },
  { nome: 'Jessica Cruz', setor: '2814', sigla: 'JC', papel: 'Oficial de reconhecimento', frase: 'Superar o medo. Uma escolha de cada vez.', missao: 'Reconhecimento orbital', energia: 94 },
] as const
