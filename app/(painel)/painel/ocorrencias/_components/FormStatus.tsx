'use client'

import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { CampoSelect } from '@/components/CampoSelect'
import { CampoTexto } from '@/components/CampoTexto'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import { atualizarStatusSchema, rotuloStatus, type AtualizarStatusData, type StatusOcorrencia } from '@/lib/schemas/ocorrencia'
import { atualizarStatus } from '@/app/(painel)/painel/ocorrencias/actions'

type FormStatusProps = {
  ocorrenciaId: string
  statusAtual: StatusOcorrencia
  resolucaoAtual: string
}

/** Muda o status da ocorrência. O campo "resolução" só aparece para "Resolvida". */
export function FormStatus({ ocorrenciaId, statusAtual, resolucaoAtual }: FormStatusProps) {
  const [salvo, setSalvo] = useState(false) // [COMP-09]
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(atualizarStatusSchema), // [FORM-01]
    mode: 'onBlur', // [FORM-05]
    reValidateMode: 'onChange',
    defaultValues: { status: statusAtual, resolucao: resolucaoAtual }, // [FORM-04]
  })
  const status = useWatch({ control, name: 'status' }) // [FORM-21]

  async function onSubmit(dados: AtualizarStatusData) {
    setSalvo(false)
    const resultado = await atualizarStatus(ocorrenciaId, dados)
    aplicarErrosDoServidor(resultado, setError) // [FORM-19]
    if (resultado.ok) setSalvo(true)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-4 rounded-xl border p-4"> {/* [FORM-06][FORM-07] */}
      <h2 className="font-semibold">Atualizar status</h2>
      <Controller
        name="status"
        control={control}
        render={({ field, fieldState }) => ( // [FORM-16]
          <CampoSelect id="status" rotulo="Status" itens={rotuloStatus} valor={field.value} aoMudar={field.onChange} aoSair={field.onBlur} refCampo={field.ref} erro={fieldState.error?.message} />
        )}
      />
      {status === 'resolvida' && ( // [COMP-14]
        <CampoTexto id="resolucao" rotulo="Como foi resolvida?" multilinha registro={register('resolucao')} erro={errors.resolucao?.message} />
      )}
      {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
      {salvo && <p role="status" className="text-sm text-primary">Status atualizado.</p>}
      <Button type="submit" disabled={isSubmitting}> {/* [FORM-08] */}
        {isSubmitting ? 'Salvando...' : 'Salvar status'}
      </Button>
    </form>
  )
}
