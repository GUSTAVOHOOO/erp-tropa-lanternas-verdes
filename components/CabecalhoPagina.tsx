type CabecalhoPaginaProps = {
  titulo: string
  descricao?: string
  /** Ação principal da página (link ou botão), alinhada à direita no desktop. */
  children?: React.ReactNode
}

/** Abertura padrão de toda página: um único h1, descrição opcional e ação opcional. [CSS-07][COMP-03] */
export function CabecalhoPagina({ titulo, descricao, children }: CabecalhoPaginaProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        <h1 className="font-heading text-4xl leading-none font-bold">{titulo}</h1> {/* [CSS-13] */}
        {descricao && <p className="max-w-prose text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </header>
  )
}
