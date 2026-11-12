'use client'

import { useEffect, useState } from 'react'
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

/**
 * Formulário para alteração de papel do usuário pelo Guardião. [FORM-01][FORM-06][FORM-19]
 * O setor só aparece quando importa: é obrigatório ao rebaixar um Guardião (que não tem setor) e,
 * para quem já é Lanterna, só quando o Guardião marca a transferência; fora disso é omitido.
 */
export function FormPapel({ usuario, setores }: FormPapelProps) {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
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
  // A página monta o formulário com key = id da conta: trocar de conta zera esta escolha.
  const [transferir, setTransferir] = useState(false)
  // Guardião não tem setor: virar Lanterna exige escolher um (a API responde SETOR_OBRIGATORIO).
  const exigeSetor = usuario.papel === 'guardiao' && papelAtual === 'lanterna'
  const mostraSetor = exigeSetor || (usuario.papel === 'lanterna' && papelAtual === 'lanterna' && transferir)

  useEffect(() => {
    if (!mostraSetor) setValue('setorId', '')
  }, [mostraSetor, setValue])

  async function onSubmit(dados: PapelFormularioOutput) {
    if (exigeSetor && dados.setorId === undefined) {
      setError('setorId', { message: 'Escolha o setor: a conta vai virar Lanterna e precisa de um.' })
      return
    }
    if (transferir && !exigeSetor && dados.setorId === undefined) {
      setError('setorId', { message: 'Escolha o setor de destino da transferência.' })
      return
    }
    const resultado = await alterarPapelAcao(usuario.id, dados)
    aplicarErrosDoServidor(resultado, setError)
  }

  // Na transferência, o setor atual da conta não aparece como destino.
  const itensSetor: Record<string, string> = Object.fromEntries(
    setores.filter((s) => exigeSetor || s.id !== usuario.setorId).map((s) => [String(s.id), `Setor ${s.id} · ${s.nome}`]),
  )

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

      {usuario.papel === 'lanterna' && papelAtual === 'lanterna' && (
        <label className="oa-field oa-field--inline">
          <input
            type="checkbox"
            className="oa-checkbox"
            checked={transferir}
            onChange={(e) => setTransferir(e.target.checked)}
          />
          <span>Transferir para outro setor{usuario.setorId !== null ? ` (hoje: Setor ${usuario.setorId})` : ''}</span>
        </label>
      )}

      {mostraSetor && (
        <Controller
          name="setorId"
          control={control}
          render={({ field, fieldState }) => (
            <CampoSelect
              id="setorId"
              rotulo={exigeSetor ? 'Setor da conta' : 'Novo setor da conta'}
              itens={itensSetor}
              valor={field.value !== undefined && field.value !== null ? String(field.value) : ''}
              aoMudar={(v) => field.onChange(v ?? '')}
              aoSair={field.onBlur}
              refCampo={field.ref}
              erro={fieldState.error?.message}
              placeholder="Escolha o setor"
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
