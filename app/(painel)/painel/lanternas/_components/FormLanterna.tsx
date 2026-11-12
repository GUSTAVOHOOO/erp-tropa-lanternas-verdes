'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BotaoOa } from '@/components/oanet/PainelOa'
import { CampoSelect } from '@/components/CampoSelect'
import { CampoTexto } from '@/components/CampoTexto'
import { MensagemErro } from '@/components/MensagemErro'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'
import {
  camposAlterados,
  lanternaFormularioSchema,
  type LanternaFormularioEntrada,
  type LanternaFormularioSaida,
} from '@/lib/schemas/gestao-lanterna'
import type { LanternaFicha, LanternaLista } from '@/lib/schemas/lanterna'
import type { Setor } from '@/lib/schemas/setor'
import {
  criarLanternaAcao,
  editarLanternaAcao,
} from '@/app/(painel)/painel/lanternas/actions'

type FormLanternaProps = {
  modo?: 'criacao' | 'edicao'
  ficha?: LanternaFicha | null
  setores: Setor[]
  lanternas: LanternaLista[]
}

/** Formulário de gestão de Ficha de Lanterna (criação e edição). [FORM-01][FORM-06][FORM-19] */
export function FormLanterna({
  modo = 'criacao',
  ficha,
  setores,
  lanternas,
}: FormLanternaProps) {
  const ehEdicao = modo === 'edicao' && Boolean(ficha)

  const itensSetor: Record<string, string> = {
    '': 'Sem setor',
    ...Object.fromEntries(setores.map((s) => [String(s.id), `Setor ${s.id} — ${s.nome}`])),
  }

  const itensMentor: Record<string, string> = {
    '': 'Sem mentor',
    ...Object.fromEntries(
      lanternas
        .filter((l) => l.id !== ficha?.id)
        .map((l) => [l.id, `${l.codinome} (${l.id})`]),
    ),
  }

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LanternaFormularioEntrada, unknown, LanternaFormularioSaida>({
    resolver: zodResolver(lanternaFormularioSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      id: ficha?.id ?? '',
      codinome: ficha?.codinome ?? '',
      identidadeCivil: ficha?.identidadeCivil ?? '',
      especie: ficha?.especie ?? '',
      planetaNatal: ficha?.planetaNatal ?? '',
      setorId: ficha?.setorId !== null && ficha?.setorId !== undefined ? String(ficha.setorId) : '',
      anoIngresso: ficha?.anoIngresso !== null && ficha?.anoIngresso !== undefined ? String(ficha.anoIngresso) : '',
      primeiraAparicao: ficha?.primeiraAparicao ?? '',
      habilidades: ficha?.habilidades ? ficha.habilidades.join(', ') : '',
      mentorId: ficha?.mentorId ?? '',
      citacao: ficha?.citacao ?? '',
      biografia: ficha?.biografia ?? '',
    },
  })

  const formularioRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (ehEdicao && ficha) {
      const timer = setTimeout(() => {
        const elemento = formularioRef.current ?? (typeof document !== 'undefined' ? document.getElementById('ficha-formulario') : null)
        elemento?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [ehEdicao, ficha])

  async function onSubmit(dados: LanternaFormularioSaida) {
    if (ehEdicao && ficha) {
      const alterados = camposAlterados(ficha, dados)
      if (Object.keys(alterados).length === 0) {
        setError('root', { type: 'manual', message: 'Nada foi alterado.' })
        return
      }
      const resultado = await editarLanternaAcao(ficha.id, alterados)
      aplicarErrosDoServidor(resultado, setError)
    } else {
      const resultado = await criarLanternaAcao(dados)
      aplicarErrosDoServidor(resultado, setError)
    }
  }

  return (
    <form ref={formularioRef} onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      {!ehEdicao && (
        <CampoTexto
          id="id"
          rotulo="Identificador (slug)"
          registro={register('id')}
          erro={errors.id?.message}
        />
      )}

      <CampoTexto
        id="codinome"
        rotulo="Codinome"
        registro={register('codinome')}
        erro={errors.codinome?.message}
      />

      <CampoTexto
        id="identidadeCivil"
        rotulo="Identidade civil (opcional)"
        registro={register('identidadeCivil')}
        erro={errors.identidadeCivil?.message}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CampoTexto
          id="especie"
          rotulo="Espécie"
          registro={register('especie')}
          erro={errors.especie?.message}
        />

        <CampoTexto
          id="planetaNatal"
          rotulo="Planeta natal"
          registro={register('planetaNatal')}
          erro={errors.planetaNatal?.message}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="setorId"
          control={control}
          render={({ field, fieldState }) => (
            <CampoSelect
              id="setorId"
              rotulo="Setor"
              itens={itensSetor}
              valor={field.value !== null && field.value !== undefined ? String(field.value) : ''}
              aoMudar={(v) => field.onChange(v ?? '')}
              aoSair={field.onBlur}
              refCampo={field.ref}
              erro={fieldState.error?.message}
            />
          )}
        />

        <CampoTexto
          id="anoIngresso"
          rotulo="Ano de ingresso (opcional)"
          type="number"
          inputMode="numeric"
          registro={register('anoIngresso')}
          erro={errors.anoIngresso?.message}
        />
      </div>

      <CampoTexto
        id="primeiraAparicao"
        rotulo="Primeira aparição (opcional)"
        registro={register('primeiraAparicao')}
        erro={errors.primeiraAparicao?.message}
      />

      <CampoTexto
        id="habilidades"
        rotulo="Habilidades (separadas por vírgula ou linhas, até 10)"
        multilinha
        registro={register('habilidades')}
        erro={errors.habilidades?.message}
      />

      <Controller
        name="mentorId"
        control={control}
        render={({ field, fieldState }) => (
          <CampoSelect
            id="mentorId"
            rotulo="Mentor"
            itens={itensMentor}
            valor={field.value !== null && field.value !== undefined ? String(field.value) : ''}
            aoMudar={(v) => field.onChange(v ?? '')}
            aoSair={field.onBlur}
            refCampo={field.ref}
            erro={fieldState.error?.message}
          />
        )}
      />

      <CampoTexto
        id="citacao"
        rotulo="Citação (até 15 palavras)"
        multilinha
        registro={register('citacao')}
        erro={errors.citacao?.message}
      />

      <CampoTexto
        id="biografia"
        rotulo="Biografia (até 1200 caracteres)"
        multilinha
        registro={register('biografia')}
        erro={errors.biografia?.message}
      />

      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {ehEdicao && (
          <Link href="/painel/lanternas" className="oa-button oa-button--linha">
            <span className="oa-button-content">Cancelar</span>
          </Link>
        )}

        <BotaoOa type="submit" tom="energia" disabled={isSubmitting}>
          {isSubmitting
            ? 'Salvando...'
            : ehEdicao
              ? 'Salvar alterações'
              : 'Cadastrar Lanterna'}
        </BotaoOa>
      </div>
    </form>
  )
}
