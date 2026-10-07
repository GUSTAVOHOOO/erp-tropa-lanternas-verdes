import { PaginaAviso } from '@/components/PaginaAviso'

export default function OcorrenciaNaoEncontrada() {
  return (
    <PaginaAviso
      titulo="Ocorrência não encontrada"
      descricao="Ela pode ter sido removida ou o endereço está errado."
      acao={{ href: '/painel/ocorrencias', rotulo: 'Ver ocorrências' }}
    />
  )
}
