'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { CampoTexto } from '@/components/CampoTexto'
import { MensagemErro } from '@/components/MensagemErro'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import { novoComentarioSchema, type NovoComentarioData } from '@/lib/schemas/comentario'
import { comentar } from '@/app/(painel)/painel/ocorrencias/comentarios-actions'

type FormComentarioProps = {
  ocorrenciaId: string
}

/** Formulário para adicionar comentário a uma ocorrência. [FORM-01][FORM-08][FORM-19] */
export function FormComentario({ ocorrenciaId }: FormComentarioProps) {
  const [publicado, setPublicado] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NovoComentarioData>({
    resolver: zodResolver(novoComentarioSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { texto: '' },
  })

  const texto = useWatch({ control, name: 'texto' }) ?? ''

  async function onSubmit(dados: NovoComentarioData) {
    setPublicado(false)
    const resultado = await comentar(ocorrenciaId, { texto: dados.texto })
    aplicarErrosDoServidor(resultado, setError)
    if (resultado.ok) {
      reset()
      setPublicado(true)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <CampoTexto
        id="texto"
        rotulo="Comentário"
        multilinha
        registro={register('texto')}
        erro={errors.texto?.message}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-(--oa-muted)">
          {texto.length}/1000
        </span>
        <BotaoOa type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Comentando...' : 'Comentar'}
        </BotaoOa>
      </div>
      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}
      {publicado && <p role="status" className="text-sm text-(--oa-energy)">Comentário publicado.</p>}
    </form>
  )
}
