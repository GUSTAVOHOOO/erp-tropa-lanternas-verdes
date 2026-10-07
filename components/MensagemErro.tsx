import { CircleAlertIcon } from 'lucide-react'

type MensagemErroProps = {
  id?: string
  children: React.ReactNode
}

/** Erro de formulário: texto + ícone (nunca só a cor), anunciado pelo leitor de tela. [FORM-10][CSS-10] */
export function MensagemErro({ id, children }: MensagemErroProps) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
      <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
      {children}
    </p>
  )
}
