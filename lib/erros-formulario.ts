import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ResultadoAcao } from '@/lib/resultado-acao'

/** Leva os erros devolvidos pela Server Action para os campos do formulário. [FORM-18][FORM-19] */
export function aplicarErrosDoServidor<T extends FieldValues>(
  resultado: ResultadoAcao | undefined,
  setError: UseFormSetError<T>,
): void {
  if (!resultado) return
  for (const [campo, mensagens] of Object.entries(resultado.errors ?? {})) {
    if (mensagens?.[0]) setError(campo as Path<T>, { type: 'server', message: mensagens[0] }, { shouldFocus: true })
  }
  if (resultado.erro) setError('root', { type: 'server', message: resultado.erro })
}
