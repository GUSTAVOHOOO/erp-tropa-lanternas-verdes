type CabecalhoPaginaProps = {
  titulo: string
  descricao?: string
  /** Ação principal da página (link ou botão), alinhada à direita no desktop. */
  children?: React.ReactNode
}

/** Abertura padrão de toda página: um único h1, descrição opcional e ação opcional. [CSS-07][COMP-03] */
export function CabecalhoPagina({ titulo, descricao, children }: CabecalhoPaginaProps) {
  return (
    <header className="oa-page-heading">
      <div>
        <h1>{titulo}</h1> {/* [CSS-13] */}
        {descricao && <p>{descricao}</p>}
      </div>
      {children}
    </header>
  )
}
