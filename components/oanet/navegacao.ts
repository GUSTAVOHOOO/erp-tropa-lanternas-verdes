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
