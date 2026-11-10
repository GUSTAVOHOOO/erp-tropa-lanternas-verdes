'use client'

import { useEffect, type RefObject } from 'react'

/** Um observer para o laboratório, incluindo SVGs trocados sem navegar de tela. */
export function useMovimentoOa(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const raiz = ref.current
    if (!raiz || typeof IntersectionObserver === 'undefined') return
    const observados = new Set<Element>()
    const seletor = '.oa-panel, [data-oa-motion]'
    const observer = new IntersectionObserver(entradas => {
      for (const entrada of entradas) {
        entrada.target.setAttribute('data-offscreen', String(!entrada.isIntersecting))
      }
    })
    function registrar(elemento: Element) {
      if (observados.has(elemento)) return
      observados.add(elemento)
      elemento.setAttribute('data-offscreen', 'true')
      observer.observe(elemento)
    }
    function percorrer(no: Node, acao: (elemento: Element) => void) {
      if (!(no instanceof Element)) return
      if (no.matches(seletor)) acao(no)
      no.querySelectorAll(seletor).forEach(acao)
    }
    raiz.querySelectorAll(seletor).forEach(registrar)
    const mutacoes = new MutationObserver(registros => {
      for (const registro of registros) {
        registro.removedNodes.forEach(no => percorrer(no, elemento => {
          observer.unobserve(elemento)
          observados.delete(elemento)
        }))
        registro.addedNodes.forEach(no => percorrer(no, registrar))
      }
    })
    mutacoes.observe(raiz, { childList: true, subtree: true })
    return () => {
      mutacoes.disconnect()
      observer.disconnect()
      observados.clear()
    }
  }, [ref])
}
