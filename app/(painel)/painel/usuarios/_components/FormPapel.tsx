'use client'

import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { CampoSelect } from '@/components/CampoSelect'
import { MensagemErro } from '@/components/MensagemErro'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import {
  papelFormularioSchema,
  type PapelFormularioInput,
  type PapelFormularioOutput,
} from '@/lib/schemas/gestao-usuario'
import type { Setor } from '@/lib/schemas/setor'
import type { Usuario } from '@/lib/schemas/usuario'
import { alterarPapelAcao } from '@/app/(painel)/painel/usuarios/actions'

export type FormPapelProps = {
  usuario: Pick<Usuario, 'id' | 'papel' | 'setorId' | 'nome'>
  setores: Setor[]
}

const ITENS_PAPEL: Record<string, string> = {
  guardiao: 'Guardião',
  lanterna: 'Lanterna',
}

/** Formulário para alteração de papel do usuário pelo Guardião. [FORM-01][FORM-06][FORM-19] */
export function FormPapel({ usuario, setores }: FormPapelProps) {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PapelFormularioInput, unknown, PapelFormularioOutput>({
    resolver: zodResolver(papelFormularioSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      papel: usuario.papel,
      setorId: '',
    },
  })

  useEffect(() => {
    reset({
      papel: usuario.papel,
      setorId: '',
    })
  }, [usuario, reset])

  const papelAtual = useWatch({ control, name: 'papel' })

  async function onSubmit(dados: PapelFormularioOutput) {
    const resultado = await alterarPapelAcao(usuario.id, dados)
    aplicarErrosDoServidor(resultado, setError)
  }

  const itensSetor: Record<string, string> = {
    '': 'Manter o setor atual',
    ...Object.fromEntries(setores.map((s) => [String(s.id), `Setor ${s.id} · ${s.nome}`])),
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <Controller
        name="papel"
        control={control}
        render={({ field, fieldState }) => (
          <CampoSelect
            id="papel"
            rotulo="Papel da conta"
            itens={ITENS_PAPEL}
            valor={field.value}
            aoMudar={(v) => field.onChange(v ?? 'lanterna')}
            aoSair={field.onBlur}
            refCampo={field.ref}
            erro={fieldState.error?.message}
            placeholder="Escolha o papel"
          />
        )}
      />

      {papelAtual === 'lanterna' && (
        <Controller
          name="setorId"
          control={control}
          render={({ field, fieldState }) => (
            <CampoSelect
              id="setorId"
              rotulo="Setor da conta"
              itens={itensSetor}
              valor={field.value !== undefined && field.value !== null ? String(field.value) : ''}
              aoMudar={(v) => field.onChange(v ?? '')}
              aoSair={field.onBlur}
              refCampo={field.ref}
              erro={fieldState.error?.message}
              placeholder="Manter o setor atual"
            />
          )}
        />
      )}

      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}

      <BotaoOa type="submit" tom="energia" disabled={isSubmitting} className="sm:justify-self-end">
        {isSubmitting ? 'Salvando...' : 'Salvar papel'}
      </BotaoOa>
    </form>
  )
}
