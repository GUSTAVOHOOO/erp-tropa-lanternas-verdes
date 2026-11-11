'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CampoTexto } from '@/components/CampoTexto'
import { MensagemErro } from '@/components/MensagemErro'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { IconeOa } from '@/components/oanet/IconeOa'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import { loginSchema, type LoginData } from '@/lib/schemas/login'
import { entrar } from '@/app/(site)/login/actions'

/** Formulário de login: valida no cliente (UX) e a action valida de novo (segurança). */
export function FormLogin() { // [AUTH-08]
  const [mostrar, setMostrar] = useState(false)
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema), // [FORM-01]
    mode: 'onBlur', // [FORM-05]
    reValidateMode: 'onChange',
    defaultValues: { email: '', senha: '' }, // [FORM-04]
  })

  async function onSubmit(dados: LoginData) {
    const resultado = await entrar(dados)
    aplicarErrosDoServidor(resultado, setError) // [FORM-19]
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5"> {/* [FORM-06][FORM-07] */}
      <CampoTexto id="email" rotulo="E-mail" type="email" autoComplete="email" inputMode="email" registro={register('email')} erro={errors.email?.message} /> {/* [FORM-20] */}
      <div className="oa-field">
        <Label htmlFor="senha">Senha</Label>
        <span className="oa-password">
          <Input id="senha" type={mostrar ? 'text' : 'password'} autoComplete="current-password" {...register('senha')} aria-invalid={errors.senha?.message ? true : undefined} aria-describedby={errors.senha?.message ? 'senha-erro' : undefined} />
          <button type="button" aria-label="Mostrar senha" aria-pressed={mostrar} aria-controls="senha" onClick={() => setMostrar(!mostrar)}><IconeOa nome="olho" /></button>
        </span>
        {errors.senha?.message && <MensagemErro id="senha-erro">{errors.senha.message}</MensagemErro>}
      </div>
      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}
      <BotaoOa type="submit" disabled={isSubmitting}> {/* [FORM-08] */}
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </BotaoOa>
    </form>
  )
}
