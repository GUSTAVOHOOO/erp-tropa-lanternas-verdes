import type { Metadata } from 'next'
import { PaginaAviso } from '@/components/PaginaAviso'

export const metadata: Metadata = { title: 'Acesso negado | Central de Oa' }

/** Logado, mas sem permissão: o "403" explicado (APIS p. 5). */
export default function AcessoNegadoPage() { // [AUTH-06]
  return (
    <PaginaAviso
      titulo="Acesso negado"
      descricao="Você está conectado, mas seu papel não permite abrir esta página. Atribuir responsáveis é exclusivo dos Guardiões, e cada Lanterna só acessa as ocorrências do próprio setor."
      acao={{ href: '/painel', rotulo: 'Voltar ao painel' }}
    />
  )
}
