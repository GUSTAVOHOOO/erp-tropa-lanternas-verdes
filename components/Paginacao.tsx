import Link from 'next/link'

export type PaginacaoProps = {
  pagina: number
  paginas: number
  caminho: string
  parametros: Record<string, string | undefined>
  parametro?: string
}

function montarHref(
  caminho: string,
  parametros: Record<string, string | undefined>,
  paginaAlvo: number,
  parametro: string = 'pagina',
): string {
  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== '' && chave !== parametro) {
      params.set(chave, valor)
    }
  }
  if (paginaAlvo > 1) {
    params.set(parametro, String(paginaAlvo))
  }
  const qs = params.toString()
  return qs ? `${caminho}?${qs}` : caminho
}

/** Componente de paginação acessível compatível com Server Components. [ROTA-14][ROTA-16] */
export function Paginacao({ pagina, paginas, caminho, parametros, parametro = 'pagina' }: PaginacaoProps) {
  if (paginas <= 1) return null

  const temAnterior = pagina > 1
  const temProxima = pagina < paginas

  return (
    <nav aria-label="Paginação" className="oa-button-row justify-center py-4">
      {temAnterior ? (
        <Link
          href={montarHref(caminho, parametros, pagina - 1, parametro)}
          className="oa-button oa-button--linha"
        >
          <span className="oa-button-content">Anterior</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="oa-button oa-button--linha opacity-40 cursor-not-allowed pointer-events-none select-none"
        >
          <span className="oa-button-content">Anterior</span>
        </span>
      )}

      <span
        aria-current="page"
        className="px-3 font-mono text-sm tracking-wider text-(--oa-muted)"
      >
        Página {pagina} de {paginas}
      </span>

      {temProxima ? (
        <Link
          href={montarHref(caminho, parametros, pagina + 1, parametro)}
          className="oa-button oa-button--linha"
        >
          <span className="oa-button-content">Próxima</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="oa-button oa-button--linha opacity-40 cursor-not-allowed pointer-events-none select-none"
        >
          <span className="oa-button-content">Próxima</span>
        </span>
      )}
    </nav>
  )
}
