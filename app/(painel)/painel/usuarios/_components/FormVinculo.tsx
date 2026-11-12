'use client'

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { CampoSelect } from '@/components/CampoSelect'
import { MensagemErro } from '@/components/MensagemErro'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import {
  vinculoFormularioSchema,
  type VinculoFormularioData,
} from '@/lib/schemas/gestao-usuario'
import type { LanternaLista } from '@/lib/schemas/lanterna'
import type { Usuario } from '@/lib/schemas/usuario'
import { vincularLanternaAcao } from '@/app/(painel)/painel/usuarios/actions'

export type FormVinculoProps = {
  usuario: Pick<Usuario, 'id' | 'lanternaId' | 'setorId' | 'nome'>
  lanternas: LanternaLista[]
}

/** Formulário para vincular ou desvincular conta a uma Ficha de Lanterna. [FORM-01][FORM-06][FORM-19] */
export function FormVinculo({ usuario, lanternas }: FormVinculoProps) {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VinculoFormularioData>({
    resolver: zodResolver(vinculoFormularioSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      lanternaId: usuario.lanternaId ?? '',
    },
  })

  useEffect(() => {
    reset({
      lanternaId: usuario.lanternaId ?? '',
    })
  }, [usuario, reset])

  async function onSubmit(dados: VinculoFormularioData) {
    const resultado = await vincularLanternaAcao(usuario.id, dados)
    aplicarErrosDoServidor(resultado, setError)
  }

  const fichasDisponiveis =
    usuario.setorId !== null && usuario.setorId !== undefined
      ? lanternas.filter((l) => l.setorId === usuario.setorId)
      : lanternas

  const itensFicha: Record<string, string> = {
    '': 'Sem vínculo',
    ...Object.fromEntries(fichasDisponiveis.map((l) => [l.id, l.codinome])),
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <Controller
        name="lanternaId"
        control={control}
        render={({ field, fieldState }) => (
          <CampoSelect
            id="lanternaId"
            rotulo="Ficha de Lanterna"
            itens={itensFicha}
            valor={field.value ?? ''}
            aoMudar={(v) => field.onChange(v ?? '')}
            aoSair={field.onBlur}
            refCampo={field.ref}
            erro={fieldState.error?.message}
            placeholder="Escolha uma ficha"
          />
        )}
      />

      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}

      <BotaoOa type="submit" tom="energia" disabled={isSubmitting} className="sm:justify-self-end">
        {isSubmitting ? 'Salvando...' : 'Salvar vínculo'}
      </BotaoOa>
    </form>
  )
}
