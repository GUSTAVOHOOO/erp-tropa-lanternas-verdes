'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { CampoTexto } from '@/components/CampoTexto'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import { loginSchema, type LoginData } from '@/lib/schemas/login'
import { entrar } from '@/app/(site)/login/actions'

/** Formulário de login: valida no cliente (UX) e a action valida de novo (segurança). [AUTH-08] */
export function FormLogin() {
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-4"> {/* [FORM-06][FORM-07] */}
      <CampoTexto id="email" rotulo="E-mail" type="email" autoComplete="email" inputMode="email" registro={register('email')} erro={errors.email?.message} /> {/* [FORM-20] */}
      <CampoTexto id="senha" rotulo="Senha" type="password" autoComplete="current-password" registro={register('senha')} erro={errors.senha?.message} />
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>
      )}
      <Button type="submit" disabled={isSubmitting}> {/* [FORM-08] */}
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
