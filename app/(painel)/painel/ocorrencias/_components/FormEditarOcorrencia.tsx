'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type * as z from 'zod'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { CampoSelect } from '@/components/CampoSelect'
import { CampoTexto } from '@/components/CampoTexto'
import { MensagemErro } from '@/components/MensagemErro'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import { edicaoOcorrenciaSchema, rotuloGravidade, type Ocorrencia } from '@/lib/schemas/ocorrencia'
import { editarOcorrencia } from '@/app/(painel)/painel/ocorrencias/actions'

type FormEditarOcorrenciaProps = {
  ocorrencia: Pick<Ocorrencia, 'id' | 'titulo' | 'descricao' | 'planeta' | 'gravidade' | 'envolvidos'>
}

type InputEdicaoOcorrencia = z.input<typeof edicaoOcorrenciaSchema>
type OutputEdicaoOcorrencia = z.output<typeof edicaoOcorrenciaSchema>

/** Formulário para editar dados da ocorrência. [FORM-01][FORM-06][FORM-19] */
export function FormEditarOcorrencia({ ocorrencia }: FormEditarOcorrenciaProps) {
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<InputEdicaoOcorrencia, unknown, OutputEdicaoOcorrencia>({
    resolver: zodResolver(edicaoOcorrenciaSchema), // [FORM-01]
    mode: 'onBlur', // [FORM-05]
    reValidateMode: 'onChange',
    defaultValues: {
      titulo: ocorrencia.titulo,
      descricao: ocorrencia.descricao,
      planeta: ocorrencia.planeta,
      gravidade: ocorrencia.gravidade,
      envolvidos: ocorrencia.envolvidos,
    }, // [FORM-04]
  })

  async function onSubmit(dados: OutputEdicaoOcorrencia) {
    const resultado = await editarOcorrencia(ocorrencia.id, dados)
    aplicarErrosDoServidor(resultado, setError) // [FORM-19]
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5"> {/* [FORM-06][FORM-07] */}
      <CampoTexto id="titulo" rotulo="Título" registro={register('titulo')} erro={errors.titulo?.message} />
      <CampoTexto id="descricao" rotulo="Descrição" multilinha registro={register('descricao')} erro={errors.descricao?.message} />
      <CampoTexto id="planeta" rotulo="Planeta" registro={register('planeta')} erro={errors.planeta?.message} />
      <Controller
        name="gravidade"
        control={control}
        render={({ field, fieldState }) => ( // [FORM-16]
          <CampoSelect
            id="gravidade"
            rotulo="Gravidade"
            itens={rotuloGravidade}
            valor={field.value}
            aoMudar={field.onChange}
            aoSair={field.onBlur}
            refCampo={field.ref}
            erro={fieldState.error?.message}
          />
        )}
      />
      <CampoTexto id="envolvidos" rotulo="Seres envolvidos" type="number" inputMode="numeric" registro={register('envolvidos')} erro={errors.envolvidos?.message} /> {/* [FORM-13] */}
      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}
      <BotaoOa type="submit" tom="energia" disabled={isSubmitting} className="sm:justify-self-end"> {/* [FORM-08] */}
        {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
      </BotaoOa>
    </form>
  )
}
