'use client'

import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type * as z from 'zod'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { CampoSelect } from '@/components/CampoSelect'
import { CampoTexto } from '@/components/CampoTexto'
import { MensagemErro } from '@/components/MensagemErro'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import { atualizarStatusSchema, rotuloStatus, type StatusOcorrencia } from '@/lib/schemas/ocorrencia'
import { atualizarStatus } from '@/app/(painel)/painel/ocorrencias/actions'

type FormStatusProps = {
  ocorrenciaId: string
  statusAtual: StatusOcorrencia
  transicoes: StatusOcorrencia[]
}

type InputAtualizarStatus = z.input<typeof atualizarStatusSchema>
type OutputAtualizarStatus = z.output<typeof atualizarStatusSchema>

/** Formulário de transição de status. [FORM-01][FORM-06][FORM-16] */
export function FormStatus({ ocorrenciaId, statusAtual, transicoes }: FormStatusProps) {
  const [salvo, setSalvo] = useState(false) // [COMP-09]
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<InputAtualizarStatus, unknown, OutputAtualizarStatus>({
    resolver: zodResolver(atualizarStatusSchema), // [FORM-01]
    mode: 'onBlur', // [FORM-05]
    reValidateMode: 'onChange',
    defaultValues: {
      statusAtual,
      status: transicoes[0],
      resolucao: '',
      motivo: '',
    }, // [FORM-04]
  })
  const status = useWatch({ control, name: 'status' }) // [FORM-21]

  async function onSubmit(dados: OutputAtualizarStatus) {
    setSalvo(false)
    const resultado = await atualizarStatus(ocorrenciaId, {
      statusAtual,
      status: dados.status,
      resolucao: dados.resolucao,
      motivo: dados.motivo,
    })
    aplicarErrosDoServidor(resultado, setError) // [FORM-19]
    if (resultado.ok) setSalvo(true)
  }

  const itensTransicoes = Object.fromEntries(transicoes.map((t) => [t, rotuloStatus[t]]))

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5"> {/* [FORM-06][FORM-07] */}
      <Controller
        name="status"
        control={control}
        render={({ field, fieldState }) => ( // [FORM-16]
          <CampoSelect
            id="status"
            rotulo="Status"
            itens={itensTransicoes}
            valor={field.value}
            aoMudar={(v) => field.onChange(v as StatusOcorrencia)}
            aoSair={field.onBlur}
            refCampo={field.ref}
            erro={fieldState.error?.message}
          />
        )}
      />
      {status === 'resolvida' && ( // [COMP-14]
        <CampoTexto
          id="resolucao"
          rotulo="Como foi resolvida?"
          multilinha
          registro={register('resolucao')}
          erro={errors.resolucao?.message}
        />
      )}
      {status === 'aberta' && statusAtual === 'resolvida' && ( // [COMP-14]
        <CampoTexto
          id="motivo"
          rotulo="Motivo da reabertura"
          multilinha
          registro={register('motivo')}
          erro={errors.motivo?.message}
        />
      )}
      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}
      {salvo && <p role="status" className="text-sm text-(--oa-energy)">Status atualizado.</p>}
      <BotaoOa type="submit" tom="energia" disabled={isSubmitting} className="sm:justify-self-end"> {/* [FORM-08] */}
        {isSubmitting ? 'Salvando...' : 'Salvar status'}
      </BotaoOa>
    </form>
  )
}
