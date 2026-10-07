'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { CampoSelect } from '@/components/CampoSelect'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import type { Lanterna } from '@/lib/schemas/lanterna'
import { atribuicaoSchema, type AtribuicaoData } from '@/lib/schemas/ocorrencia'
import { atribuirResponsavel } from '@/app/(painel)/painel/ocorrencias/actions'

type FormAtribuirProps = {
  ocorrenciaId: string
  lanternas: Lanterna[]
  responsavelAtual: string | null
}

/** Guardião escolhe o lanterna responsável. Em caso de sucesso a action volta para o detalhe. */
export function FormAtribuir({ ocorrenciaId, lanternas, responsavelAtual }: FormAtribuirProps) {
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(atribuicaoSchema), // [FORM-01]
    mode: 'onBlur', // [FORM-05]
    reValidateMode: 'onChange',
    defaultValues: { responsavelId: responsavelAtual ?? '' }, // [FORM-04]
  })

  async function onSubmit(dados: AtribuicaoData) {
    const resultado = await atribuirResponsavel(ocorrenciaId, dados)
    aplicarErrosDoServidor(resultado, setError) // [FORM-19]
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-4"> {/* [FORM-06][FORM-07] */}
      <Controller
        name="responsavelId"
        control={control}
        render={({ field, fieldState }) => ( // [FORM-16]
          <CampoSelect
            id="responsavelId"
            rotulo="Lanterna responsável"
            itens={Object.fromEntries(lanternas.map((l) => [l.id, l.nome]))}
            valor={field.value}
            aoMudar={field.onChange}
            aoSair={field.onBlur}
            refCampo={field.ref}
            erro={fieldState.error?.message}
            placeholder="Escolha o lanterna"
          />
        )}
      />
      {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
      <Button type="submit" disabled={isSubmitting}> {/* [FORM-08] */}
        {isSubmitting ? 'Salvando...' : 'Atribuir responsável'}
      </Button>
    </form>
  )
}
