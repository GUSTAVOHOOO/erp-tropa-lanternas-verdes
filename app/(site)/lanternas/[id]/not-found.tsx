import { PaginaAviso } from '@/components/PaginaAviso'

export default function LanternaNaoEncontrado() {
  return (
    <PaginaAviso
      titulo="Lanterna não encontrado"
      descricao="Não há lanterna com este endereço na Tropa."
      acao={{ href: '/lanternas', rotulo: 'Ver todos os lanternas' }}
    />
  )
}
