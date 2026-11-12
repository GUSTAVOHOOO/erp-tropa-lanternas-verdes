import { PaginaAviso } from '@/components/PaginaAviso'

export default function FichaPainelNaoEncontrada() {
  return (
    <PaginaAviso
      titulo="Lanterna não encontrado"
      descricao="Não há Ficha com este endereço na Tropa."
      acao={{ href: '/painel', rotulo: 'Voltar ao Resumo' }}
    />
  )
}
