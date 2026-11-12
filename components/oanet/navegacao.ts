import type { Papel } from '@/lib/schemas/usuario'
import type { LinkCascaOa } from './CascaOa'

const LINKS_BASE: LinkCascaOa[] = [
  { href: '/', nome: 'Início', icone: 'painel', codigo: '01' },
  { href: '/lanternas', nome: 'Lanternas', icone: 'pessoal', codigo: '02' },
  { href: '/sobre', nome: 'Sobre', icone: 'escudo', codigo: '03' },
  { href: '/painel', nome: 'Central de Comando', icone: 'setores', codigo: '04' },
]

const LINK_CADASTRO: LinkCascaOa = {
  href: '/cadastro',
  nome: 'Cadastrar',
  icone: 'mais',
  codigo: '05',
}

/** Retorna os links da casca pública por papel (visitante vê "Cadastrar"). */
export function linksDoSite(logado: boolean): LinkCascaOa[] {
  if (logado) {
    return [...LINKS_BASE]
  }
  return [...LINKS_BASE, LINK_CADASTRO]
}

const LINKS_PAINEL_BASE: Omit<LinkCascaOa, 'codigo'>[] = [
  { href: '/painel', nome: 'Resumo', icone: 'painel' },
  { href: '/painel/ocorrencias', nome: 'Ocorrências', icone: 'ocorrencias' },
  { href: '/painel/ocorrencias/nova', nome: 'Registrar ocorrência', icone: 'mais' },
]

const LINK_MINHA_FILA: Omit<LinkCascaOa, 'codigo'> = {
  href: '/painel/minha-fila',
  nome: 'Minha fila',
  icone: 'alvo',
}

/** Retorna os links da Central de Comando conforme o papel do usuário. */
export function linksDoPainel(papel: Papel): LinkCascaOa[] {
  const itens = papel === 'lanterna'
    ? [LINKS_PAINEL_BASE[0], LINK_MINHA_FILA, ...LINKS_PAINEL_BASE.slice(1)]
    : [...LINKS_PAINEL_BASE]

  return itens.map((item, index) => ({
    ...item,
    codigo: String(index + 1).padStart(2, '0'),
  }))
}
