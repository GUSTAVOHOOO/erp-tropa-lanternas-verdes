type SecaoVitrineProps = {
  id: string
  titulo: string
  descricao?: string
  children: React.ReactNode
}

/** Uma seção da vitrine: h2 ligado à section por aria-labelledby. [CSS-07] */
export function SecaoVitrine({ id, titulo, descricao, children }: SecaoVitrineProps) {
  return (
    <section aria-labelledby={id} className="grid gap-5 border-t border-border pt-8">
      <div className="grid gap-1">
        <h2 id={id} className="font-heading text-2xl font-semibold">{titulo}</h2>
        {descricao && <p className="max-w-prose text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </section>
  )
}
