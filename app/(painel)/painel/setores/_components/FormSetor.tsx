'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type * as z from 'zod'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { CampoTexto } from '@/components/CampoTexto'
import { MensagemErro } from '@/components/MensagemErro'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import {
  edicaoSetorSchema,
  setorFormularioSchema,
  type Setor,
} from '@/lib/schemas/setor'
import { criarSetorAcao, editarSetorAcao } from '@/app/(painel)/painel/setores/actions'

type FormSetorProps = {
  setor?: Setor
}

type InputCriacao = z.input<typeof setorFormularioSchema>
type OutputCriacao = z.output<typeof setorFormularioSchema>
type InputEdicao = z.input<typeof edicaoSetorSchema>
type OutputEdicao = z.output<typeof edicaoSetorSchema>

function FormCriarSetor() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InputCriacao, unknown, OutputCriacao>({
    resolver: zodResolver(setorFormularioSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      id: '',
      nome: '',
      descricao: '',
    },
  })

  async function onSubmit(dados: OutputCriacao) {
    const resultado = await criarSetorAcao(dados)
    aplicarErrosDoServidor(resultado, setError)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <CampoTexto
        id="id"
        rotulo="Número do setor"
        type="number"
        inputMode="numeric"
        registro={register('id')}
        erro={errors.id?.message}
      />
      <CampoTexto
        id="nome"
        rotulo="Nome"
        registro={register('nome')}
        erro={errors.nome?.message}
      />
      <CampoTexto
        id="descricao"
        rotulo="Descrição"
        multilinha
        registro={register('descricao')}
        erro={errors.descricao?.message}
      />
      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}
      <BotaoOa
        type="submit"
        tom="energia"
        disabled={isSubmitting}
        className="sm:justify-self-end"
      >
        {isSubmitting ? 'Cadastrando...' : 'Cadastrar setor'}
      </BotaoOa>
    </form>
  )
}

function FormEditarSetor({ setor }: { setor: Setor }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InputEdicao, unknown, OutputEdicao>({
    resolver: zodResolver(edicaoSetorSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      nome: setor.nome,
      descricao: setor.descricao,
    },
  })

  async function onSubmit(dados: OutputEdicao) {
    const resultado = await editarSetorAcao(setor.id, dados)
    aplicarErrosDoServidor(resultado, setError)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <CampoTexto
        id={`nome-${setor.id}`}
        rotulo="Nome"
        registro={register('nome')}
        erro={errors.nome?.message}
      />
      <CampoTexto
        id={`descricao-${setor.id}`}
        rotulo="Descrição"
        multilinha
        registro={register('descricao')}
        erro={errors.descricao?.message}
      />
      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}
      <BotaoOa
        type="submit"
        tom="energia"
        disabled={isSubmitting}
        className="sm:justify-self-end"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
      </BotaoOa>
    </form>
  )
}

export function FormSetor({ setor }: FormSetorProps) {
  if (setor) {
    return <FormEditarSetor setor={setor} />
  }
  return <FormCriarSetor />
}
