import { IconeOa } from './IconeOa'
import { sair } from '@/app/(painel)/actions'

/** Saída da casca: formulário servidor com a Server Action real, funciona sem JavaScript. [AUTH-09] */
export function FormSairOa() {
  return (
    <form action={sair} className="oa-back-form">
      <button type="submit" className="oa-back-link oa-back-button">
        <IconeOa nome="sair" />
        Sair
      </button>
    </form>
  )
}
