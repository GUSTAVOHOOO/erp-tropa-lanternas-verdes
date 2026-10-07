import type { UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MensagemErro } from '@/components/MensagemErro'

type CampoTextoProps = {
  id: string
  rotulo: string
  registro: UseFormRegisterReturn
  erro?: string
  type?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'email'
  multilinha?: boolean
}

/** Campo de texto com label, mensagem de erro acessível e integração com o React Hook Form. */
export function CampoTexto({ id, rotulo, registro, erro, type = 'text', autoComplete, inputMode, multilinha = false }: CampoTextoProps) { // [FORM-22]
  const idErro = `${id}-erro`
  const acessibilidade = {
    'aria-invalid': erro ? true : undefined, // [FORM-10]
    'aria-describedby': erro ? idErro : undefined,
  }
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label> {/* [FORM-09] */}
      {multilinha ? (
        <Textarea id={id} rows={4} {...registro} {...acessibilidade} />
      ) : (
        <Input id={id} type={type} autoComplete={autoComplete} inputMode={inputMode} {...registro} {...acessibilidade} />
      )}
      {erro && <MensagemErro id={idErro}>{erro}</MensagemErro>}
    </div>
  )
}
