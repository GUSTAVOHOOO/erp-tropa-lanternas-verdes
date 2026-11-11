'use client'

import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type * as z from 'zod'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { CampoSelect } from '@/components/CampoSelect'
import { CampoTexto } from '@/components/CampoTexto'
import { MensagemErro } from '@/components/MensagemErro'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import { novaOcorrenciaSchema, rotuloGravidade } from '@/lib/schemas/ocorrencia'
import type { Setor } from '@/lib/schemas/setor'
import { registrarOcorrencia } from '@/app/(painel)/painel/ocorrencias/actions'

type FormOcorrenciaProps = {
  setores: Setor[]
  exigeSetor: boolean
}

type InputNovaOcorrencia = z.input<typeof novaOcorrenciaSchema>
type OutputNovaOcorrencia = z.output<typeof novaOcorrenciaSchema>

/** Formulário "Registrar ocorrência". [FORM-01][FORM-06][FORM-07] */
export function FormOcorrencia({ setores, exigeSetor }: FormOcorrenciaProps) {
  const schema = useMemo(() => {
    if (!exigeSetor) return novaOcorrenciaSchema
    return novaOcorrenciaSchema.refine((d) => d.setorId !== undefined && d.setorId !== null, {
      message: 'Escolha o setor da ocorrência.',
      path: ['setorId'],
    })
  }, [exigeSetor])

  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<InputNovaOcorrencia, unknown, OutputNovaOcorrencia>({
    resolver: zodResolver(schema), // [FORM-01]
    mode: 'onBlur', // [FORM-05]
    reValidateMode: 'onChange',
    defaultValues: {
      titulo: '',
      descricao: '',
      planeta: '',
      setorId: undefined,
      gravidade: 'media',
      envolvidos: 1,
    }, // [FORM-04]
  })

  async function onSubmit(dados: OutputNovaOcorrencia) {
    const payload = exigeSetor
      ? dados
      : {
          titulo: dados.titulo,
          descricao: dados.descricao,
          planeta: dados.planeta,
          gravidade: dados.gravidade,
          envolvidos: dados.envolvidos,
        }
    const resultado = await registrarOcorrencia(payload)
    aplicarErrosDoServidor(resultado, setError) // [FORM-19]
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5"> {/* [FORM-06][FORM-07] */}
      <CampoTexto id="titulo" rotulo="Título" registro={register('titulo')} erro={errors.titulo?.message} />
      <CampoTexto id="descricao" rotulo="Descrição" multilinha registro={register('descricao')} erro={errors.descricao?.message} />
      <CampoTexto id="planeta" rotulo="Planeta" registro={register('planeta')} erro={errors.planeta?.message} />
      {exigeSetor && ( // [AUTH-07]
        <Controller
          name="setorId"
          control={control}
          render={({ field, fieldState }) => ( // [FORM-16]
            <CampoSelect
              id="setorId"
              rotulo="Setor"
              itens={Object.fromEntries(setores.map((s) => [String(s.id), `Setor ${s.id} · ${s.nome}`]))}
              valor={field.value !== undefined && field.value !== null ? String(field.value) : ''}
              aoMudar={(v) => field.onChange(v !== null && v !== '' ? Number(v) : undefined)}
              aoSair={field.onBlur}
              refCampo={field.ref}
              erro={fieldState.error?.message}
              placeholder="Escolha o setor"
            />
          )}
        />
      )}
      <Controller
        name="gravidade"
        control={control}
        render={({ field, fieldState }) => ( // [FORM-16]
          <CampoSelect id="gravidade" rotulo="Gravidade" itens={rotuloGravidade} valor={field.value} aoMudar={field.onChange} aoSair={field.onBlur} refCampo={field.ref} erro={fieldState.error?.message} />
        )}
      />
      <CampoTexto id="envolvidos" rotulo="Seres envolvidos" type="number" inputMode="numeric" registro={register('envolvidos')} erro={errors.envolvidos?.message} /> {/* [FORM-13] */}
      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}
      <BotaoOa type="submit" tom="energia" disabled={isSubmitting} className="sm:justify-self-end"> {/* [FORM-08] */}
        {isSubmitting ? 'Registrando...' : 'Registrar ocorrência'}
      </BotaoOa>
    </form>
  )
}
