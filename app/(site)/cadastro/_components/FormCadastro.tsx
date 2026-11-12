'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CampoTexto } from '@/components/CampoTexto'
import { CampoSelect } from '@/components/CampoSelect'
import { MensagemErro } from '@/components/MensagemErro'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { IconeOa } from '@/components/oanet/IconeOa'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import { cadastroSchema, type CadastroData } from '@/lib/schemas/cadastro'
import type { Setor } from '@/lib/schemas/setor'
import { cadastrar } from '@/app/(site)/cadastro/actions'

type FormCadastroProps = {
  setores: Setor[]
}

/** Formulário de cadastro de nova conta na Central de Oa. */
export function FormCadastro({ setores }: FormCadastroProps) {
  const [mostrar, setMostrar] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(cadastroSchema), // [FORM-01]
    mode: 'onBlur', // [FORM-05]
    reValidateMode: 'onChange',
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      setorId: '' as unknown as number,
    },
  })

  async function onSubmit(dados: CadastroData) {
    const resultado = await cadastrar(dados)
    aplicarErrosDoServidor(resultado, setError) // [FORM-19]
  }

  const itensSetor = Object.fromEntries(
    setores.map((s) => [String(s.id), `Setor ${s.id} · ${s.nome}`]),
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5"> {/* [FORM-06] */}
      <CampoTexto
        id="nome"
        rotulo="Nome"
        autoComplete="name"
        registro={register('nome')}
        erro={errors.nome?.message}
      />
      <CampoTexto
        id="email"
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        registro={register('email')}
        erro={errors.email?.message}
      />
      <div className="oa-field">
        <div className="flex items-center justify-between">
          <Label htmlFor="senha">Senha</Label>
          <small className="text-xs text-(--oa-muted)">8 a 72 caracteres</small>
        </div>
        <span className="oa-password">
          <Input
            id="senha"
            type={mostrar ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('senha')}
            aria-invalid={errors.senha?.message ? true : undefined}
            aria-describedby={errors.senha?.message ? 'senha-erro' : undefined}
          />
          <button
            type="button"
            aria-label="Mostrar senha"
            aria-pressed={mostrar}
            aria-controls="senha"
            onClick={() => setMostrar(!mostrar)}
          >
            <IconeOa nome="olho" />
          </button>
        </span>
        {errors.senha?.message && <MensagemErro id="senha-erro">{errors.senha.message}</MensagemErro>}
      </div>
      <Controller
        name="setorId"
        control={control}
        render={({ field, fieldState }) => (
          <CampoSelect
            id="setorId"
            rotulo="Setor"
            placeholder="Escolha o seu setor"
            itens={itensSetor}
            valor={field.value !== undefined && field.value !== null && field.value !== '' ? String(field.value) : null}
            aoMudar={(v) => field.onChange(v !== null && v !== '' ? Number(v) : '')}
            aoSair={field.onBlur}
            refCampo={field.ref}
            erro={fieldState.error?.message}
          />
        )}
      />
      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}
      <BotaoOa type="submit" disabled={isSubmitting}> {/* [FORM-08] */}
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </BotaoOa>
    </form>
  )
}
