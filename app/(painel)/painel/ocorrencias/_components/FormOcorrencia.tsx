'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { CampoSelect } from '@/components/CampoSelect'
import { CampoTexto } from '@/components/CampoTexto'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import { novaOcorrenciaSchema, rotuloGravidade, type NovaOcorrenciaData } from '@/lib/schemas/ocorrencia'
import type { Setor } from '@/lib/schemas/setor'
import { registrarOcorrencia } from '@/app/(painel)/painel/ocorrencias/actions'

type FormOcorrenciaProps = {
  setores: Setor[]
  setorFixo: string | null
}

/** Formulário "Registrar ocorrência". */
export function FormOcorrencia({ setores, setorFixo }: FormOcorrenciaProps) {
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(novaOcorrenciaSchema), // [FORM-01]
    mode: 'onBlur', // [FORM-05]
    reValidateMode: 'onChange',
    defaultValues: { titulo: '', descricao: '', planeta: '', setorId: setorFixo ?? '', gravidade: 'media', envolvidos: 1 }, // [FORM-04]
  })

  async function onSubmit(dados: NovaOcorrenciaData) {
    const resultado = await registrarOcorrencia(dados)
    aplicarErrosDoServidor(resultado, setError) // [FORM-19]
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-4"> {/* [FORM-06][FORM-07] */}
      <CampoTexto id="titulo" rotulo="Título" registro={register('titulo')} erro={errors.titulo?.message} />
      <CampoTexto id="descricao" rotulo="Descrição" multilinha registro={register('descricao')} erro={errors.descricao?.message} />
      <CampoTexto id="planeta" rotulo="Planeta" registro={register('planeta')} erro={errors.planeta?.message} />
      {!setorFixo && ( // [AUTH-07]
        <Controller
          name="setorId"
          control={control}
          render={({ field, fieldState }) => ( // [FORM-16]
            <CampoSelect
              id="setorId"
              rotulo="Setor"
              itens={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
              valor={field.value}
              aoMudar={field.onChange}
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
      {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
      <Button type="submit" disabled={isSubmitting}> {/* [FORM-08] */}
        {isSubmitting ? 'Registrando...' : 'Registrar ocorrência'}
      </Button>
    </form>
  )
}
