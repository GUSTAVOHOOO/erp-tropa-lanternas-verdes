'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { CampoSelect } from '@/components/CampoSelect'
import { MensagemErro } from '@/components/MensagemErro'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import type { LanternaLista } from '@/lib/schemas/lanterna'
import { atribuicaoSchema, type AtribuicaoData } from '@/lib/schemas/ocorrencia'
import { atribuirResponsavel } from '@/app/(painel)/painel/ocorrencias/actions'

type FormAtribuirProps = {
  ocorrenciaId: string
  lanternas: LanternaLista[]
  responsavelAtual: string | null
  podeLiberar: boolean
}

/** Guardião escolhe o lanterna responsável ou libera a ocorrência aberta. [FORM-01][FORM-06][FORM-19] */
export function FormAtribuir({ ocorrenciaId, lanternas, responsavelAtual, podeLiberar }: FormAtribuirProps) {
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<AtribuicaoData>({
    resolver: zodResolver(atribuicaoSchema), // [FORM-01]
    mode: 'onBlur', // [FORM-05]
    reValidateMode: 'onChange',
    defaultValues: { responsavelId: responsavelAtual ?? '' }, // [FORM-04]
  })

  async function onSubmit(dados: AtribuicaoData) {
    const resultado = await atribuirResponsavel(ocorrenciaId, dados)
    aplicarErrosDoServidor(resultado, setError) // [FORM-19]
  }

  const itens = {
    ...(podeLiberar ? { '': 'Sem responsável (liberar)' } : {}),
    ...Object.fromEntries(lanternas.map((l) => [l.id, l.codinome])),
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5"> {/* [FORM-06][FORM-07] */}
      <Controller
        name="responsavelId"
        control={control}
        render={({ field, fieldState }) => ( // [FORM-16]
          <CampoSelect
            id="responsavelId"
            rotulo="Lanterna responsável"
            itens={itens}
            valor={field.value}
            aoMudar={(v) => field.onChange(v ?? '')}
            aoSair={field.onBlur}
            refCampo={field.ref}
            erro={fieldState.error?.message}
            placeholder="Escolha o lanterna"
          />
        )}
      />
      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}
      <BotaoOa type="submit" tom="energia" disabled={isSubmitting} className="sm:justify-self-end"> {/* [FORM-08] */}
        {isSubmitting ? 'Salvando...' : 'Atribuir responsável'}
      </BotaoOa>
    </form>
  )
}
