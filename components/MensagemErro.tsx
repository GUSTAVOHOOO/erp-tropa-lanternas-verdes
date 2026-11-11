import { IconeOa } from '@/components/oanet/IconeOa'

type MensagemErroProps = {
  id?: string
  children: React.ReactNode
}

/** Erro de formulário: texto + ícone (nunca só a cor), anunciado pelo leitor de tela. [FORM-10][CSS-10] */
export function MensagemErro({ id, children }: MensagemErroProps) {
  return (
    <p id={id} role="alert" className="oa-tone-danger flex items-center gap-1.5 text-xs">
      <IconeOa nome="ocorrencias" className="size-4 shrink-0" />
      {children}
    </p>
  )
}
