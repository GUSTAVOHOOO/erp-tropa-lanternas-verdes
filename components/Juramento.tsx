const VERSOS = [
  'No dia mais claro, na noite mais densa,',
  'o mal sucumbirá diante da minha presença.',
  'Todo aquele que venera o mal há de penar',
  'quando o poder do Lanterna Verde enfrentar!',
]

/** O juramento da Tropa, um verso por linha. Usado na home e no Sobre. [CSS-10] */
export function Juramento() {
  return (
    <figure className="grid gap-3">
      <blockquote className="font-heading text-2xl leading-tight font-semibold md:text-3xl"> {/* [CSS-13] */}
        {VERSOS.map((verso) => (
          <span key={verso} className="block">{verso} </span> // [COMP-13] cada verso é único e serve de key
        ))}
      </blockquote>
      <figcaption className="text-sm text-muted-foreground">Juramento da Tropa dos Lanternas Verdes</figcaption>
    </figure>
  )
}
